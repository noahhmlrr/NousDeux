import json
import os
import re
from datetime import datetime, timezone
from urllib.parse import quote

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

PROJECT_ID = "nousdeux-7915c"
DOCUMENTS_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"
FCM_URL = f"https://fcm.googleapis.com/v1/projects/{PROJECT_ID}/messages:send"
SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]
EVENT_LIMIT = 50


def fail_if_request_failed(response, label, allow_not_found=False):
    if allow_not_found and response.status_code == 404:
        return False
    if response.status_code >= 400:
        raise RuntimeError(f"{label} failed with HTTP {response.status_code}.")
    return True


def request(session, method, url, label, **kwargs):
    try:
        response = session.request(method, url, timeout=20, **kwargs)
    except requests.RequestException:
        raise RuntimeError(f"{label} request failed.") from None
    return response


def field(fields, name):
    value = fields.get(name, {})
    for kind in ("stringValue", "timestampValue"):
        if kind in value:
            return value[kind]
    return None


def fields_of(document):
    return document.get("fields", {})


def normalize_role(role):
    return "Ally" if role == "Emy" else role


def partner_of(role):
    role = normalize_role(role)
    if role == "Noah":
        return "Ally"
    if role == "Ally":
        return "Noah"
    return None


def message_body(event, previous_status):
    kind = field(event["fields"], "kind")
    status = field(event["fields"], "status")
    sender = normalize_role(field(event["fields"], "from"))

    if kind == "dateProposal":
        if status in ("accepted", "declined") and previous_status in (None, "pending"):
            body = (
                "Ta proposition de rendez-vous a été acceptée."
                if status == "accepted"
                else "Pas pour ce soir, une autre fois."
            )
            return sender, body
        if status == "pending" and previous_status is None:
            return partner_of(sender), "Te propose un rendez-vous."
        return None, None

    if previous_status is not None:
        return None, None

    bodies = {
        "wish": "T’a laissé un petit mot.",
        "grievance": "Souhaite te parler avec douceur.",
        "bouquet": "T’a envoyé un bouquet 💐.",
        "mood": "Vient de partager son humeur.",
    }
    body = bodies.get(kind, "Tu as un nouveau message.")
    return partner_of(sender), body


def collection_documents(session, headers, collection_path):
    documents = []
    page_token = None
    while True:
        params = {"pageSize": 100}
        if page_token:
            params["pageToken"] = page_token
        response = request(
            session,
            "GET",
            f"{DOCUMENTS_URL}/{collection_path}",
            "Firestore collection read",
            headers=headers,
            params=params,
        )
        fail_if_request_failed(response, "Firestore collection read")
        result = response.json()
        documents.extend(result.get("documents", []))
        page_token = result.get("nextPageToken")
        if not page_token:
            return documents


def recent_events(session, headers, code):
    parent = quote(code, safe="")
    response = request(
        session,
        "POST",
        f"{DOCUMENTS_URL}/couples/{parent}:runQuery",
        "Firestore event query",
        headers=headers,
        json={
            "structuredQuery": {
                "from": [{"collectionId": "events"}],
                "orderBy": [{"field": {"fieldPath": "updatedAt"}, "direction": "DESCENDING"}],
                "limit": EVENT_LIMIT,
            }
        },
    )
    fail_if_request_failed(response, "Firestore event query")
    return [row["document"] for row in response.json() if "document" in row]


def read_marker(session, headers, code, event_id):
    path = f"couples/{quote(code, safe='')}/pushState/{quote(event_id, safe='')}"
    response = request(
        session,
        "GET",
        f"{DOCUMENTS_URL}/{path}",
        "Firestore notification state read",
        headers=headers,
    )
    if not fail_if_request_failed(response, "Firestore notification state read", allow_not_found=True):
        return None
    return response.json()


def write_marker(session, headers, code, event_id, status, updated_at):
    path = f"couples/{quote(code, safe='')}/pushState/{quote(event_id, safe='')}"
    response = request(
        session,
        "PATCH",
        f"{DOCUMENTS_URL}/{path}",
        "Firestore notification state write",
        headers=headers,
        params=[
            ("updateMask.fieldPaths", "status"),
            ("updateMask.fieldPaths", "updatedAt"),
        ],
        json={
            "fields": {
                "status": {"stringValue": status or ""},
                "updatedAt": {"timestampValue": updated_at},
            }
        },
    )
    fail_if_request_failed(response, "Firestore notification state write")


def start_time(session, headers, code):
    marker = read_marker(session, headers, code, "_poller")
    if marker:
        started_at = field(fields_of(marker), "updatedAt")
        if started_at:
            return started_at

    started_at = datetime.now(timezone.utc).isoformat(timespec="microseconds").replace("+00:00", "Z")
    write_marker(session, headers, code, "_poller", "", started_at)
    return started_at


def delete_device(session, headers, document_name):
    response = request(
        session,
        "DELETE",
        f"https://firestore.googleapis.com/v1/{document_name}",
        "Stale notification token cleanup",
        headers=headers,
    )
    fail_if_request_failed(response, "Stale notification token cleanup", allow_not_found=True)


def send_notification(session, headers, token, body):
    response = request(
        session,
        "POST",
        FCM_URL,
        "FCM send",
        headers=headers,
        json={
            "message": {
                "token": token,
                "data": {"title": "Nous deux", "body": body, "url": "./"},
                "webpush": {"headers": {"TTL": "86400", "Urgency": "high"}},
            }
        },
    )
    if response.status_code == 404:
        try:
            details = response.json().get("error", {}).get("details", [])
        except ValueError:
            details = []
        if any(detail.get("errorCode") == "UNREGISTERED" for detail in details):
            return False
    fail_if_request_failed(response, "FCM send")
    return True


def timestamp_key(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def run():
    service_account_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT", "")
    code = os.environ.get("COUPLE_CODE", "").strip().upper()
    if not service_account_json or not re.fullmatch(r"[A-Z0-9]{6}", code):
        raise RuntimeError("Set the FIREBASE_SERVICE_ACCOUNT and six-character COUPLE_CODE Actions secrets.")

    account = json.loads(service_account_json)
    credentials = service_account.Credentials.from_service_account_info(account, scopes=SCOPES)
    credentials.refresh(Request())
    headers = {"Authorization": f"Bearer {credentials.token}", "Content-Type": "application/json"}
    session = requests.Session()

    started_at = timestamp_key(start_time(session, headers, code))
    devices = collection_documents(session, headers, f"couples/{quote(code, safe='')}/devices")
    events = recent_events(session, headers, code)
    events.sort(key=lambda event: (timestamp_key(field(fields_of(event), "updatedAt")), event["name"]))
    processed = 0
    sent = 0

    for event in events:
        fields = fields_of(event)
        event_id = event["name"].rsplit("/", 1)[-1]
        status = field(fields, "status") or ""
        updated_at = field(fields, "updatedAt")
        if not updated_at:
            continue
        if timestamp_key(updated_at) < started_at:
            continue

        marker = read_marker(session, headers, code, event_id)
        previous_status = field(fields_of(marker), "status") if marker else None
        if previous_status == status:
            continue

        recipient, body = message_body({"fields": fields}, previous_status)
        if recipient and body:
            for device in devices:
                device_fields = fields_of(device)
                if normalize_role(field(device_fields, "role")) != recipient:
                    continue
                token = field(device_fields, "token")
                if token:
                    if send_notification(session, headers, token, body):
                        sent += 1
                    else:
                        delete_device(session, headers, device["name"])

        write_marker(session, headers, code, event_id, status, updated_at)
        processed += 1

    print(f"Checked {len(events)} recent events; processed {processed} and sent {sent} notifications.")


if __name__ == "__main__":
    run()
