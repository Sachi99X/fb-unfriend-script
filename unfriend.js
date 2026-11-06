/*
 * Facebook unfriend helper (browser console script) - rounds version
 * Unfriends for RUN_MIN minutes, rests, then starts again until everyone is removed
 * or TOTAL_CAP is reached. Retries slow rows and stops by itself on a Facebook warning.
 * Use only on your own account, at your own risk. See README.md.
 *
 * 1. Open facebook.com -> your profile -> Friends -> All friends
 * 2. Open the console (Ctrl + Shift + J). If Chrome blocks pasting, type: allow pasting
 * 3. Paste this file and press Enter. To stop at any time, type: stopUF=true
 */
(async () => {
  // ===== SETTINGS =====
  const SPEED = "fast";              // "safe" | "normal" | "fast"
  const RUN_MIN = 5;                 // minutes unfriending per round
  const REST_MIN = 1;                // minutes rest between rounds (or a range like [1, 2])
  const TOTAL_CAP = 5000;            // stop after this many (5000 = everyone)
  // ====================
  const GAPS = { safe: [4000, 7000], normal: [2000, 3500], fast: [1000, 2000] };
  const GAP = GAPS[SPEED] || GAPS.fast;
  window.stopUF = false;
  try { window._wl = await navigator.wakeLock.request("screen"); } catch (e) {}
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rnd = ([a, b]) => a + Math.random() * (b - a);
  const visible = e => e.isConnected && e.offsetParent !== null;
  const label = e => (e.getAttribute("aria-label") || e.innerText || "").trim();
  const tried = new Map();           // button -> 1 (failed once) or 9 (done)
  const allMore = () => document.querySelectorAll('[role="button"][aria-label^="More"]');
  const pick = () => { const c = [...allMore()].filter(visible); return c.find(b => !tried.has(b)) || c.find(b => tried.get(b) === 1); };
  const menuText = () => [...document.querySelectorAll('[role="menuitem"]')].map(e => e.innerText.trim()).slice(0, 6);
  const blockedText = () => { const d = [...document.querySelectorAll('[role="dialog"]')]
    .find(d => /temporarily blocked|try again later|we limit how often|can't use this feature/i.test(d.innerText)); return d ? d.innerText.slice(0, 150) : ""; };
  const esc = () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  let logged = 0;
  const why = (...a) => { if (logged++ < 6) console.log(...a); };

  async function waitFor(fn, ms) {
    const t = Date.now();
    while (Date.now() - t < ms) { const r = fn(); if (r) return r; await sleep(60); }
    return null;
  }
  async function nap(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end && !window.stopUF) await sleep(Math.min(1000, end - Date.now()));
  }

  // true = unfriended, false = this row failed, null = no new rows on the page
  async function unfriendOne() {
    const b = pick();
    if (!b) return null;
    tried.set(b, tried.get(b) === 1 ? 9 : 1);
    b.scrollIntoView({ block: "center" });
    b.click();
    const item = await waitFor(() => [...document.querySelectorAll('[role="menuitem"]')]
      .find(e => /unfriend/i.test(e.innerText)), 3000);
    if (!item) { why("Row skipped: no Unfriend in menu. Menu shows:", menuText()); esc(); await sleep(400); return false; }
    item.click();
    const ok = await waitFor(() => [...document.querySelectorAll('[role="button"], button')]
      .find(e => visible(e) && /^confirm$/i.test(label(e))), 4000);
    if (!ok) { why("Row skipped: no Confirm button appeared."); esc(); await sleep(400); return false; }
    ok.click();
    const closed = await waitFor(() => !visible(ok), 3000);
    if (!closed) { why("Confirm dialog stayed open (Facebook slow?)."); esc(); await sleep(400); return false; }
    tried.set(b, 9);
    await sleep(300);
    return true;
  }

  async function loadMore() {
    const all = allMore();
    if (all.length) all[all.length - 1].scrollIntoView({ block: "end" });
    window.scrollTo(0, document.body.scrollHeight);
    return await waitFor(() => pick(), 6000);
  }

  console.log(`Found ${allMore().length} rows on the page. Starting…`);
  let total = 0, round = 0, halt = false, cool = 0;
  while (!halt && !window.stopUF && total < TOTAL_CAP) {
    round++;
    const end = Date.now() + RUN_MIN * 60000;
    let n = 0, empty = 0, fails = 0, recheck = false;
    console.log(`Round ${round}: unfriending for ${RUN_MIN} min`);
    while (Date.now() < end && !window.stopUF && total < TOTAL_CAP) {
      const bt = blockedText();
      if (bt) { console.log("Facebook warning: \"" + bt + "\". Stopped. Wait a day, then use SPEED = 'safe'."); halt = true; break; }
      const r = await unfriendOne();
      if (r === true) {
        n++; total++; empty = 0; fails = 0; cool = 0; recheck = false;
        console.log(`Unfriended ${total} (round ${round}: ${n})`);
        await sleep(rnd(GAP));
      } else if (r === false) {
        if (++fails >= 6) {
          if (++cool > 3) { console.log("Still failing after 3 cool-downs. Stopped. Page layout may have changed."); halt = true; break; }
          console.log(`6 failures in a row. Cooling down 60 s (try ${cool}/3)…`);
          await nap(60000); tried.clear(); fails = 0;
        }
      } else {
        console.log("Loading more friends…");
        if (await loadMore()) empty = 0;
        else if (++empty >= 4) {
          if (!recheck) { recheck = true; empty = 0; console.log("Re-checking from the top…"); window.scrollTo(0, 0); await sleep(1000); }
          else { console.log("No more friends found. Finished."); halt = true; break; }
        }
      }
    }
    if (halt || window.stopUF || total >= TOTAL_CAP) break;
    const rest = (Array.isArray(REST_MIN) ? rnd(REST_MIN) : REST_MIN) * 60000;
    console.log(`Round ${round} done (${n}). Resting ${(rest / 60000).toFixed(1)} min… resumes at ${new Date(Date.now() + rest).toLocaleTimeString()}`);
    await nap(rest);
  }
  try { window._wl && window._wl.release(); } catch (e) {}
  console.log(`Done. Total this run: ${total}`);
})();
