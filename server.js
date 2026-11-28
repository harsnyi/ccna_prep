/*
 * Minimal static server with a PIN gate, for hosting (e.g. Railway). No dependencies.
 *
 *   ACCESS_PIN=0000 node server.js        # PORT defaults to 8080
 *
 * Env:
 *   ACCESS_PIN      required — the PIN to enter the app
 *   SESSION_SECRET  optional — signs the session cookie; if unset, a random one is generated
 *                   at startup (everyone has to re-enter the PIN after each deploy/restart)
 *   PORT            set by Railway
 *
 * The app itself stays a static site: progress is still stored in each browser's localStorage.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PIN = process.env.ACCESS_PIN;
if (!PIN) {
  console.error("ACCESS_PIN is not set — refusing to start without a PIN.");
  process.exit(1);
}
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const PORT = Number(process.env.PORT) || 8080;
const ROOT = __dirname;
const COOKIE = "ccna_session";
const SESSION_DAYS = 30;

// Only these paths are ever served (no server.js, tools/, .git, …).
const PUBLIC = [/^\/index\.html$/, /^\/css\/[\w.-]+\.css$/, /^\/js\/[\w.-]+\.js$/, /^\/data\/[\w.-]+\.js$/, /^\/data\/(days|guides)\/[\w.-]+\.js$/];
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

// ---- sessions: "<expiry>.<hmac>" ----
const sign = (v) => crypto.createHmac("sha256", SECRET).update(v).digest("hex");
const newSession = () => { const exp = String(Date.now() + SESSION_DAYS * 86400000); return `${exp}.${sign(exp)}`; };
const validSession = (tok) => {
  if (!tok) return false;
  const [exp, mac] = tok.split(".");
  if (!exp || !mac || Number(exp) < Date.now()) return false;
  const want = Buffer.from(sign(exp)), got = Buffer.from(mac);
  return want.length === got.length && crypto.timingSafeEqual(want, got);
};
const cookies = (req) => Object.fromEntries((req.headers.cookie || "").split(";").map((c) => c.trim().split("=")).filter((p) => p.length === 2));
const pinOk = (p) => {
  const a = crypto.createHash("sha256").update(String(p)).digest(), b = crypto.createHash("sha256").update(PIN).digest();
  return crypto.timingSafeEqual(a, b);
};

// ---- brute-force protection: 5 wrong PINs per IP → 15 minute lockout ----
const MAX_TRIES = 5, LOCK_MS = 15 * 60000;
const attempts = new Map(); // ip -> {fails, until}
// The hosting proxy appends the real client address as the LAST X-Forwarded-For entry;
// earlier entries can be set by the client, so they must not be trusted for the lockout.
const clientIp = (req) => (req.headers["x-forwarded-for"] || "").split(",").pop().trim() || req.socket.remoteAddress;
setInterval(() => { const now = Date.now(); for (const [ip, a] of attempts) if (a.until < now && a.fails < MAX_TRIES) attempts.delete(ip); }, 600000).unref();

const loginPage = (msg = "") => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>CCNA Prep</title>
<style>
  :root { --bg:#f5f6f8; --panel:#fff; --text:#1c2230; --muted:#6b7385; --line:#e3e6ec; --accent:#2f5fe0; --bad:#c63a4f; }
  @media (prefers-color-scheme: dark) { :root { --bg:#12151c; --panel:#1b1f29; --text:#e6e9f0; --muted:#949bad; --line:#2b3140; --accent:#6b8dff; --bad:#ff7a8c; } }
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:var(--bg); color:var(--text); font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
  form { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:28px 30px; width:min(320px,90vw); text-align:center; }
  h1 { margin:0 0 4px; font-size:1.4rem; letter-spacing:-.02em; } h1 span { color:var(--accent); font-weight:600; }
  p { margin:0 0 18px; color:var(--muted); font-size:.9rem; }
  input { width:100%; box-sizing:border-box; padding:12px; font-size:1.6rem; letter-spacing:.5em; text-align:center; border:1px solid var(--line); border-radius:8px; background:var(--bg); color:var(--text); }
  input:focus { outline:2px solid var(--accent); outline-offset:-1px; }
  button { width:100%; margin-top:12px; padding:11px; border:0; border-radius:8px; background:var(--accent); color:#fff; font:inherit; font-weight:600; cursor:pointer; }
  .err { color:var(--bad); margin:12px 0 0; }
</style></head><body>
<form method="post" action="/login">
  <h1>CCNA<span>prep</span></h1><p>Enter the PIN to continue</p>
  <input name="pin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="12" autofocus required aria-label="PIN">
  <button type="submit">Enter</button>
  ${msg ? `<p class="err">${msg}</p>` : ""}
</form></body></html>`;

const send = (res, code, body, headers = {}) => {
  res.writeHead(code, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", ...headers });
  res.end(body);
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const p = decodeURIComponent(url.pathname);

  if (p === "/healthz") return send(res, 200, "ok", { "Content-Type": "text/plain" });

  if (p === "/login" && req.method === "POST") {
    const ip = clientIp(req);
    const a = attempts.get(ip) || { fails: 0, until: 0 };
    if (a.fails >= MAX_TRIES && a.until > Date.now()) {
      return send(res, 429, loginPage(`Too many wrong PINs. Try again in ${Math.ceil((a.until - Date.now()) / 60000)} min.`));
    }
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 1000) req.destroy(); });
    req.on("end", () => {
      const pin = new URLSearchParams(body).get("pin") || "";
      if (pinOk(pin)) {
        attempts.delete(ip);
        const secure = (req.headers["x-forwarded-proto"] || "").includes("https") ? "; Secure" : "";
        return send(res, 303, "", { Location: "/", "Set-Cookie": `${COOKIE}=${newSession()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}` });
      }
      a.fails = a.until > Date.now() || a.fails < MAX_TRIES ? a.fails + 1 : 1;
      if (a.fails >= MAX_TRIES) a.until = Date.now() + LOCK_MS;
      attempts.set(ip, a);
      const left = MAX_TRIES - a.fails;
      send(res, 401, loginPage(left > 0 ? `Wrong PIN. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many wrong PINs. Try again in 15 min."));
    });
    return;
  }

  if (p === "/logout") return send(res, 303, "", { Location: "/", "Set-Cookie": `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` });

  if (!validSession(cookies(req)[COOKIE])) return send(res, 401, loginPage());

  const file = p === "/" ? "/index.html" : p;
  if (!PUBLIC.some((re) => re.test(file))) return send(res, 404, "Not found", { "Content-Type": "text/plain" });
  fs.readFile(path.join(ROOT, file), (err, data) => {
    if (err) return send(res, 404, "Not found", { "Content-Type": "text/plain" });
    // no-cache: always revalidate, so new content shows up right after a deploy
    send(res, 200, data, { "Content-Type": TYPES[path.extname(file)], "Cache-Control": "no-cache" });
  });
});

server.listen(PORT, () => console.log(`CCNA prep listening on :${PORT}`));
