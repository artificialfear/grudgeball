# Grudge Ball: Session Handoff

Paste this into a new chat (or point the session at this file) to pick up where the last session left off. Read README.md for full feature and file documentation.

## Project
- Grudge Ball: Mat's team review game for Raven Band classes. It runs full screen on the school ViewBoard with a mini basketball hoop; Mat hosts it.
- Source of truth: GitHub repo artificialfear/grudgeball. Served by GitHub Pages at https://artificialfear.github.io/grudgeball/ from index.html.
- The repo README.md documents every feature and file. Read it first.
- Latest code commit: 7305ec9 "Fix pale, washed-out buttons on older browsers (ViewBoard)".

## Current State
- Everything below is built, tested and pushed. Nothing is half-finished.
- Core game:
  - hearts, attacks, steals, gang-up rule, sudden death
  - a miss costs exactly 1 heart, decided after the steal round: a correct steal moves that heart to the stealer (no attack, no shots, Shield doesn't block); if nobody steals, the team that missed loses it
  - 10 items, final round 🏁, undo, ± hearts
  - fairness rules (rotating shooters, underdog bonus, leader tax)
  - action animations
- Sounds: MP3s in sounds/, leveled to about −15 LUFS. Each file is cache-busted by a content hash (?v=), so replacing a file with the same name just works.
- Music questions are generated fresh each game:
  - Band track, levels 1–4: listening 🎧 and staff 🎼 questions, written in src/music.js with VexFlow 4.2.3.
  - Theory track, Theory 1–4 (Theory 4 = AP Music Theory), in src/theory.js:
    - roughly half ear training
    - an SATB voicer that follows AP voice-leading rules
    - error detection
- Built-in question sets live in questions/*.txt (Level 1–4 and Theory 1–4).
- Remote control (src/remote.js): run the game from an iPad or computer over PeerJS, using a room code, QR code, or a ?remote=CODE link.
  - The controller shows the answer privately and has every host button plus keyboard shortcuts.
  - The board stays usable by touch.
- Class profiles: each class has its own settings and its own game in progress.
- Question report: per-topic breakdown and a reteach list.
- Rules presets: 🐣 Simple and 🔥 Full, side by side.
- Google Sheet question sets: read from a "Game Sets" index tab, cached on the device, with an ↻ Sync button.
- Setup screen: an everyday card on top, everything else in collapsible sections.
- Older-browser (ViewBoard) support:
  - @supports fallbacks for aspect-ratio
  - longhand top/right/bottom/left instead of inset
  - all 4- and 8-digit hex colors converted to rgba()
  - native button appearance reset, with solid dark and cream color fallbacks on .btn and .topbtn
  - a browser/version line in the ☰ menu

## Decisions Made
- Single-file build: build.py inlines the art (base64), the libraries (VexFlow, PeerJS, qrcode), src/*.js and the question sets into index.html, so the game works offline.
- Remote uses PeerJS (free signaling service) with no server and no stored data. Mat chose to support both iPad and computer, with the board kept touch-usable.
- Theory track: a separate track from the band levels, ~half ear training, all four AP ear-training types. The AP-level players are advanced 8th graders.
- Theory sets default to 10 listening + 5 staff questions. Band sets default to 3 + 3.
- Mat supplied separate correct.mp3 and make-basket.mp3 files; they are no longer shared.
- ViewBoard rendering bugs came from its older browser not supporting modern CSS (aspect-ratio, inset, alpha hex colors). Fix them with fallbacks, not browser detection.

## Constraints & Conventions
- Edit src/grudgeball.src.html (images are placeholders), src/*.js and questions/*.txt. Then run `python3 build.py` and commit index.html too. Never hand-edit index.html.
- In CSS, avoid 4- and 8-digit hex colors and `inset:`. If you use aspect-ratio, add an @supports fallback. The ViewBoard browser can't handle them.
- Sound changes: upload a new MP3 under the same file name in sounds/.
- Question set format: a `# Set: Name` line, then one `Question | Answer` per line.
- Saved on the device (localStorage):
  - gb_profiles, gb_game::<profile>, gb_sets, gb_sheet
  - gb_sound, gb_music, gb_remote_on, gb_remote_code
- Tests in tests/: steal_rule.py, music_theory.js, theory_check.js, remote_e2e.py (+ peer-test-server.js), classes_sheet_report.py, button_colors.py. The Python tests use Playwright.
- Commit messages end with Claude's attribution lines.
- Mat's preferences: bullets, fuller explanations, complete code replacements, challenge his framing, confirm only before large tasks.

## Known Issues
- classes_sheet_report.py and remote_e2e.py are stale: they need a fontroute.py helper and a peerserver/ folder that aren't in the repo, and classes_sheet_report.py times out at the #askIn step (fails on the old build too). steal_rule.py is self-contained.
- The button fix isn't confirmed on the real ViewBoard yet. Mat needs to hard-refresh there.
  - If buttons are still pale, get the browser line from the ☰ menu. That would point to the browser overriding colors itself (e.g. forced dark mode), which needs a different fix.
- The Google Sheet "Grudgeball Questions" (id 15Mnj23kbVn5D3Eu0l1whsXvQCQAJPsekN_k_fSJdGQA) is still private. Mat has to set Share → Anyone with the link → Viewer before other boards or another director can load it.
- At 1024×768 the Rules section on the setup screen needs scrolling. This is minor and works as is.

## Next Steps
- Confirm the ViewBoard shows dark buttons and the mystery-box board correctly after a refresh.
- Make the question sheet link-viewable so the other band director can use the shared sets.
- After that, nothing is queued. Ask Mat what he wants next.
