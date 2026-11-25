const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");

initializeApp();

const db = getFirestore();

function roleOf(value) {
  return value === "Emy" ? "Ally" : value;
}

function partnerOf(role) {
  if (role === "Noah") return "Ally";
  if (role === "Ally") return "Noah";
  return null;
}

function bodyFor(event) {
  switch (event.kind) {
    case "wish": return "t’a laissé un petit mot.";
    case "grievance": return "souhaite te parler avec douceur.";
    case "bouquet": return "t’a envoyé un bouquet 💐.";
    case "mood": return "vient de partager son humeur.";
    case "dateProposal": return "te propose un rendez-vous.";
    default: return "Tu as un nouveau message.";
  }
}

async function notifyRole(code, recipientRole, title, body) {
  const snapshot = await db.collection("couples").doc(code).collection("devices").get();
  const targets = snapshot.docs.filter(device => {
    const data = device.data();
    return roleOf(data.role) === recipientRole && typeof data.token === "string" && data.token.length > 0;
  });

  for (let offset = 0; offset < targets.length; offset += 500) {
    const batch = targets.slice(offset, offset + 500);
    const response = await getMessaging().sendEachForMulticast({
      tokens: batch.map(device => device.data().token),
      data: { title, body, url: "./" },
      webpush: { headers: { TTL: "86400", Urgency: "high" } }
    });

    await Promise.all(response.responses.map((result, index) => {
      const errorCode = result.error?.code;
      if (!result.success && (errorCode === "messaging/registration-token-not-registered" ||
          errorCode === "messaging/invalid-registration-token")) {
        return batch[index].ref.delete();
      }
      return Promise.resolve();
    }));
  }
}

exports.notifyNewEvent = onDocumentCreated(
  { document: "couples/{code}/events/{eventId}", region: "us-central1" },
  async event => {
    const data = event.data?.data();
    if (!data) return;
    const recipient = partnerOf(roleOf(data.from));
    if (!recipient) return;
    await notifyRole(
      event.params.code,
      recipient,
      "Nous deux",
      bodyFor(data)
    );
  }
);

exports.notifyDateResponse = onDocumentUpdated(
  { document: "couples/{code}/events/{eventId}", region: "us-central1" },
  async event => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (before.status === after.status || !["accepted", "declined"].includes(after.status)) return;
    const recipient = roleOf(after.from);
    if (!partnerOf(recipient)) return;
    await notifyRole(
      event.params.code,
      recipient,
      "Nous deux",
      after.status === "accepted"
        ? "Ta proposition de rendez-vous a été acceptée."
        : "Pas pour ce soir, une autre fois."
    );
  }
);
