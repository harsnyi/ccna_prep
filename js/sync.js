/*
 * Progress sync with the hosting server (server.js → /api/progress).
 *
 * The browser always works from localStorage; sync runs in the background:
 *   - on start (before the first render), when the tab becomes visible again, and every 2 minutes: pull + merge
 *   - shortly after every change, and when the tab is hidden: push; the server merges and returns the result
 * Merging (js/merge.js) means two devices never overwrite each other. If the server's "epoch" is newer
 * (progress was reset or imported on another device), this device drops its copy and takes the server's.
 * Opened as a local file or without the server, sync simply stays off.
 */
(function () {
  const CCNA = window.CCNA;
  const S = CCNA.state;
  const API = "/api/progress";
  const META_KEY = "ccna_sync_meta";
  let meta = {};
  try { meta = JSON.parse(localStorage.getItem(META_KEY) || "{}") || {}; } catch (e) { meta = {}; }
  const saveMeta = () => localStorage.setItem(META_KEY, JSON.stringify(meta));

  const sync = (CCNA.sync = { enabled: false, status: "off", error: null, lastSync: meta.lastSync || null });

  // ---- helpers ----
  const stable = (v) => JSON.stringify(v, (k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, key) => ((o[key] = x[key]), o), {}) : x));
  const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
  /** Copy src into target in place, keeping nested object identity (views hold references into the state). */
  const assignDeep = (target, src) => {
    Object.keys(target).forEach((k) => { if (!(k in src)) delete target[k]; });
    Object.keys(src).forEach((k) => {
      if (isObj(target[k]) && isObj(src[k])) assignDeep(target[k], src[k]);
      else target[k] = isObj(src[k]) ? assignDeep({}, src[k]) : Array.isArray(src[k]) ? JSON.parse(JSON.stringify(src[k])) : src[k];
    });
    return target;
  };
  const remoteChanged = () => { if (CCNA.onRemoteChange) CCNA.onRemoteChange(); };

  const setStatus = (status, error) => {
    sync.status = status; sync.error = error || null;
    const el = document.getElementById("sync-status");
    if (!el) return;
    const text = { synced: "✓ Synced", pending: "Saving…", syncing: "Syncing…", offline: "Offline — will retry", signedout: "Signed out", off: "" }[status];
    el.textContent = text;
    el.className = `sync-pill ${status}`;
    el.title = sync.lastSync ? `Last synced ${new Date(sync.lastSync).toLocaleString()}` : "";
  };

  const markSynced = (d) => {
    meta.epoch = d.epoch; meta.rev = d.rev; meta.lastSync = sync.lastSync = new Date().toISOString();
    saveMeta();
  };

  /** Take the server's copy as-is (after a reset/import elsewhere). */
  const adopt = (d) => {
    assignDeep(S, CCNA.normalize(d.state || {}));
    CCNA.saveLocal(); markSynced(d); remoteChanged();
  };

  /** Merge the server's copy into ours. Returns true if we still have something the server lacks. */
  const absorb = (d) => {
    const merged = CCNA.normalize(CCNA.mergeState(S, d.state || {}));
    if (stable(merged) !== stable(S)) { assignDeep(S, merged); CCNA.saveLocal(); remoteChanged(); }
    markSynced(d);
    return stable(CCNA.mergeState(d.state || {}, S)) !== stable(d.state || {});
  };

  const request = (method, body, query = "") =>
    fetch(API + query, {
      method, credentials: "same-origin", cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });

  // ---- push (debounced) ----
  let timer = null, inflight = false, dirty = false;
  sync.schedule = (delay = 1500) => {
    if (!sync.enabled) return;
    dirty = true;
    clearTimeout(timer);
    timer = setTimeout(push, delay);
    if (sync.status !== "offline") setStatus("pending");
  };

  async function push() {
    if (!sync.enabled || !dirty) return;
    if (inflight) { clearTimeout(timer); timer = setTimeout(push, 800); return; }
    inflight = true; dirty = false; setStatus("syncing");
    try {
      const r = await request("PUT", { epoch: meta.epoch ?? null, state: S });
      if (r.status === 401) { setStatus("signedout"); return; }
      if (r.status === 409) { adopt(await r.json()); setStatus("synced"); return; }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      if (absorb(await r.json())) dirty = true; // something changed while the request was in flight
      if (dirty) sync.schedule(300); else setStatus("synced");
    } catch (e) {
      dirty = true; setStatus("offline", e.message);
      clearTimeout(timer); timer = setTimeout(push, 15000);
    } finally { inflight = false; }
  }

  // ---- pull ----
  let lastPull = 0;
  sync.pull = async () => {
    lastPull = Date.now();
    const r = await request("GET");
    if (r.status === 401) { setStatus("signedout"); return; }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    if (meta.epoch != null && d.epoch > meta.epoch) adopt(d);
    else if (absorb(d)) sync.schedule(200);
    if (!dirty) setStatus("synced");
  };

  sync.now = async () => { dirty = true; await push(); await sync.pull(); };

  /** Import on this device → replace the server copy and start a new epoch. */
  sync.replaceRemote = async () => {
    const r = await request("PUT", { state: S }, "?replace=1");
    if (!r.ok) throw new Error(`Sync failed (HTTP ${r.status}) — the import was only saved in this browser.`);
    markSynced(await r.json()); setStatus("synced");
  };
  /** Reset on this device → clear the server copy and start a new epoch. */
  sync.resetRemote = async () => {
    const r = await request("DELETE");
    if (!r.ok) throw new Error(`Couldn't reset the synced progress (HTTP ${r.status}). Nothing was deleted.`);
    markSynced(await r.json());
  };

  /** Called once at boot, before the first render. Resolves quickly even if the server is slow or absent. */
  sync.init = async () => {
    if (!/^https?:$/.test(location.protocol)) return;
    try {
      const probe = request("GET").then(async (r) => {
        if (r.status === 404) return; // plain static server (python -m http.server): no sync
        sync.enabled = true;
        if (r.status === 401) return setStatus("signedout");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        if (meta.epoch != null && d.epoch > meta.epoch) adopt(d);
        else if (absorb(d)) sync.schedule(200);
        if (!dirty) setStatus("synced");
      });
      await Promise.race([probe, new Promise((res) => setTimeout(res, 4000))]);
    } catch (e) {
      sync.enabled = true; dirty = true; setStatus("offline", e.message);
      timer = setTimeout(push, 15000);
    }
    if (!sync.enabled) return;

    CCNA.onSave.push(() => sync.schedule());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") { if (Date.now() - lastPull > 10000) sync.pull().catch((e) => setStatus("offline", e.message)); }
      else if (dirty) { clearTimeout(timer); push(); }
    });
    window.addEventListener("online", () => { if (dirty) push(); else sync.pull().catch(() => {}); });
    setInterval(() => { if (document.visibilityState === "visible") sync.pull().catch((e) => setStatus("offline", e.message)); }, 120000);
  };
})();
