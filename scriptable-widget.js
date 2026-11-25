// Nous deux — widget écran verrouillé (app gratuite Scriptable)
// 1) Remplis les 4 lignes ci-dessous  2) Ajoute un widget Scriptable sur l'écran verrouillé et choisis ce script

const API_KEY = "AIzaSyDV4-fHCK5RWR9lUcqwpmibo2n6A9OWCGo";      // même apiKey que dans index.html
const PROJECT_ID = "nousdeux-7915c";
const CODE = "XXXXXX";                    // code de votre espace
const ME = "Noah";                        // "Noah" ou "Ally" (toi)

const normalizePerson = person => person === "Emy" ? "Ally" : person;

async function getToken() {
  if (Keychain.contains("nd_refresh")) {
    try {
      const r = new Request(`https://securetoken.googleapis.com/v1/token?key=${API_KEY}`);
      r.method = "POST";
      r.headers = { "Content-Type": "application/x-www-form-urlencoded" };
      r.body = `grant_type=refresh_token&refresh_token=${Keychain.get("nd_refresh")}`;
      const j = await r.loadJSON();
      if (j.id_token) { Keychain.set("nd_refresh", j.refresh_token); return j.id_token; }
    } catch (e) {}
  }
  const r = new Request(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`);
  r.method = "POST";
  r.headers = { "Content-Type": "application/json" };
  r.body = JSON.stringify({ returnSecureToken: true });
  const j = await r.loadJSON();
  Keychain.set("nd_refresh", j.refreshToken);
  return j.idToken;
}

async function latestFromPartner(token) {
  const r = new Request(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${CODE}:runQuery`);
  r.method = "POST";
  r.headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  r.body = JSON.stringify({ structuredQuery: {
    from: [{ collectionId: "events" }],
    orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
    limit: 15 } });
  const rows = await r.loadJSON();
  for (const row of rows) {
    const f = row.document && row.document.fields;
    if (!f) continue;
    const e = { from: f.from?.stringValue, fromName: f.fromName?.stringValue, kind: f.kind?.stringValue,
                text: f.text?.stringValue || "", extra: f.extra?.stringValue || "" };
    if (e.from && normalizePerson(e.from) !== ME) return e;
  }
  return null;
}

function body(e) {
  const il = normalizePerson(e.from) === "Ally" ? "elle" : "il";
  const q = e.text ? ` : « ${e.text} »` : "";
  switch (e.kind) {
    case "wish": return `aimerait${q}`;
    case "grievance": return `a besoin de te dire avec douceur${q}`;
    case "bouquet": return `t’a envoyé un bouquet 💐 — ${il} pense à toi`;
    case "mood": return `se sent ${e.extra}${q}`;
    case "dateProposal": return `te propose un date : ${e.extra}`;
  }
  return "";
}

let e = null;
try { e = await latestFromPartner(await getToken()); } catch (err) {}
const title = e ? e.fromName || normalizePerson(e.from) : "Nous deux ❤️";
const msg = e ? body(e) : "Pas encore de message";

const w = new ListWidget();
w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
const fam = config.widgetFamily;

if (fam === "accessoryInline") {
  w.addText(`❤️ ${title} ${msg}`);
} else if (fam === "accessoryRectangular") {
  const t = w.addText(title); t.font = Font.boldSystemFont(12);
  const m = w.addText(msg); m.font = Font.systemFont(11); m.lineLimit = 3;
} else {
  w.backgroundColor = new Color("#fbf3f6");
  const t = w.addText(`❤️ ${title}`); t.font = Font.boldSystemFont(15); t.textColor = new Color("#d6336c");
  w.addSpacer(6);
  const m = w.addText(msg); m.font = Font.systemFont(14); m.textColor = new Color("#2a1d33");
}

if (config.runsInWidget) Script.setWidget(w); else await w.presentSmall();
Script.complete();
