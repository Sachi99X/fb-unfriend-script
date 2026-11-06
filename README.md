# Facebook Unfriend Helper

A small browser-console script that removes friends from your own Facebook account one at a time, with random pauses between each one. It is a personal-use helper, not a polished tool.

## ⚠️ Read first
- **Facebook has no bulk-unfriend feature, and automating the site goes against its Terms.** Using this can get your account **temporarily blocked or restricted**. Use it at your own risk.
- **Unfriending cannot be undone in one step.** You would have to send each person a new friend request.
- Run it only on **your own account**. Never paste scripts from other people into the console without reading them: a console script can take over your account.
- Facebook changes its page layout often, so the script may stop working. It was written for the **English** Facebook interface and has not been tested against every layout.

## How to use
1. In Chrome, open facebook.com → your profile → **Friends → All friends**.
2. Open the console with **Ctrl + Shift + J**. If Chrome blocks pasting, type `allow pasting` and press Enter.
3. Paste the contents of [`unfriend.js`](unfriend.js) and press Enter.
4. Watch the console for `Unfriended 1`, `Unfriended 2`, … Keep the tab open and active (background tabs slow timers down).
5. To stop at any time, type `stopUF=true` and press Enter.

## Settings (top of the script)
| Setting | Default | Meaning |
|---|---|---|
| `SPEED` | `"fast"` | Pause between unfriends: `"safe"` 4–7 s, `"normal"` 2–3.5 s, `"fast"` 1–2 s |
| `RUN_MIN` | 5 | Minutes of unfriending per round |
| `REST_MIN` | 1 | Minutes of rest between rounds. Can also be a range, e.g. `[1, 2]` |
| `TOTAL_CAP` | 5000 | Stop after this many unfriends (5000 = everyone) |

## How it works
- It works in rounds: unfriend for `RUN_MIN` minutes, rest for `REST_MIN`, then start again.
- It scrolls down to load more friends when it runs out of rows, and finishes when no more appear.
- Slow rows are retried. After 6 failures in a row it cools down for 60 s (up to 3 times) before stopping.
- If Facebook shows a "temporarily blocked" / "try again later" message, it stops by itself.
- Failures are explained in the console (for example what the menu showed).
- Type `stopUF=true` to stop at any time.

## Staying safe
- Start small (e.g. `TOTAL_CAP = 25`), then increase slowly.
- Faster settings and short rests raise the chance of a block. Keep to a few hundred per day at most.
- After a block, wait a day and use `SPEED = "safe"`.
- Keep the Facebook tab open and visible; background tabs slow timers down.
- Download your data first: Settings → Accounts Center → Your information and permissions → Download your information.

## Disclaimer
Provided "as is" with no warranty. This project is not affiliated with or endorsed by Meta/Facebook. You are responsible for how you use it.

## License
MIT. See [LICENSE](LICENSE).
