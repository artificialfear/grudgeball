# Grudge Ball

A team review game for band class, made to run on a classroom viewboard with a mini basketball hoop.

**Play it:** https://artificialfear.github.io/grudgeball/

## How the game works
- Teams start with 8 hearts (max 12). On their turn, a team picks a mystery box.
- **Question:** the team has 15 seconds. If they get it right, they take a heart from another team, then one player shoots until they miss. Each basket is +1 heart for their team or one more heart taken from another team.
- **Wrong answer:** the team loses a heart. Then the other teams get a chance to steal, one at a time in turn order. Each team has 5 seconds to choose steal or pass; running out of time counts as a pass. A team that steals gets a fresh 5 seconds to answer. A wrong steal costs a heart. A correct steal takes a heart from another team but gets no shots, and turn order doesn't change.
- **Gang-up rule:** if one team attacks a team and a different team attacks it on the very next turn, the attacked team gets a bonus turn right away. Steal attacks don't count toward this.
- **Sudden death (0 hearts):** the team can't attack. A correct answer earns 1 heart back, with no shots. A wrong answer means the team is out.
- **Items:** a team can hold 2 items and play only one per turn. Finding a third means throwing one away.
  - **Shield**: no one can attack you until your next turn.
  - **Lifesteal Ring**: for the rest of this turn, every heart you take heals you +1.
  - **Cursed Sword**: for two of your turns, your attacks take 2 hearts, but attacks on you also take 2.
  - **Reed of Resurrection**: if your team is knocked out, it comes back with 2 hearts automatically.
  - **Metronome**: +10 seconds on your question.
  - **Repeat Sign** 𝄇: your team goes again right after this turn.
  - **Fermata**: pick a team; it can't steal on the next wrong answer.
  - **Modulation**: reverses the turn order (only one per game).
  - **Three Free Shots** (used right away): three shots no matter what.
  - **Traumatic Scale** (used right away): lose a heart.
- **Final round** 🏁: tap it when class is almost over. Choose "finish this round" or "one more full round". Every team still in ends with the same number of turns (bonus turns still play), then the winner screen shows.
- **Fairness:**
  - **Shooters rotate:** students number off, and the game calls who shoots next.
  - **Underdog bonus:** the last-place team gets +1 heart whenever it opens an item box.
  - **Leader tax:** a team at max hearts can't collect items.

- **Action animations:** hits fly from the attacking team to its target ("HIT BY RED"), and the Shield, Ring, Sword, Reed, Metronome, Repeat Sign, Fermata, Modulation, lifesteal, sudden death and knockouts each have a short effect on the team cards. They can be turned off on the setup screen.

All of these can be adjusted on the setup screen.

## Classes (profiles)
The **CLASS** bar at the top of setup keeps a separate profile for each class: team names, timers, question set, music level, items and rules. Each class also keeps **its own game in progress**, so 1st Block's paused game doesn't block 3rd Block. **+ New class** copies the current settings. Profiles are saved on that device. The remote can switch classes from the setup screen.

## Question report
At the end of a game (📋 Report), or anytime from ☰ → Question report: how many questions each class got right the first time, which were stolen, which nobody got (your reteach list), and a breakdown by topic, weakest first (written questions, intervals, cadences, Roman numerals, and so on). **Copy report** puts a plain-text version on the clipboard to paste into notes or an email.

## Rules presets
**🐣 Simple rules** (for beginners): five items (Shield, Reed, Metronome, Free Shots, Traumatic Scale), no gang-up rule, hold 1 item, 20 seconds to answer, 7 seconds to steal, no leader tax. **🔥 Full rules** turns everything back on. The gang-up rule also has its own on/off switch.

## Question sets from a Google Sheet
Keep sets in a Google Sheet and every board picks up the latest version:
1. Share the sheet: **Share → General access → Anyone with the link → Viewer**.
2. Add a tab named **Game Sets** with "Game Sets" in A1 and the names of the tabs to load listed under it.
3. Each listed tab: questions in column A, answers in column B (a header row and extra columns are fine).
4. On setup, tap **📄 Google Sheet**, paste the link and tap **Connect**. After editing the sheet, tap **↻ Sync**.
Sheet sets are cached on the device, so the game still works offline. To share sets with another director, send them the sheet link; they connect it the same way (or make a copy to edit their own).

## Remote control (iPad or computer)
Run the game from an iPad or a computer while it shows on the viewboard. The board still works by touch.
1. On the board, tap **📱** (top right in a game, or **📱 Remote** on the setup screen). A QR code, a link and a 4-letter room code appear.
2. iPad: point the camera at the QR code and tap the link. Computer: open the link.
3. The controller shows **the answer privately**, every host button (Correct/Wrong, Steal/Pass, MADE IT/MISSED, +1 heart, attack targets, items, Undo, ± Hearts, Final round, End game), the timer, the teams and the mystery boxes. Sounds play on the board.
- Computer keyboard: C correct, W wrong, S steal, P pass, Enter next, M made, X missed, H +1 heart, 1–8 attack a team, L play sound, T restart timer, A show answer on board, U or Ctrl+Z undo, F final round.
- Both devices need to be online; they connect directly over the Wi-Fi (through a relay if the network won't allow a direct link). Connection setup uses the free PeerJS service; no game data is stored anywhere.
- The remote stays on after a refresh until you tap **Turn off remote**. Tap **New code** if a student sees the code.
- If the board was refreshed, tap it once (TAP TO START) so it can play sounds; the controller shows a reminder.

## Editing questions
Use **Edit questions** in the game itself. Write one question per line as `Question | Answer`, or keep your questions in a Google Sheet (column A = question, column B = answer) and paste the columns in. The header row, blank rows and any extra columns are skipped.
Question sets save in that browser. Use **Export .txt** to back them up or move them to another device.

## Music questions (made fresh every game)
Besides the written questions, each game adds new **listening** 🎧 and **staff** 🎼 questions (3 of each by default, set on the setup screen). The level follows the question set's name ("Level 3 …" makes Level 3 questions) or can be picked by hand.
- **Listening:** tap ▶ Play. The question clock starts when the sound ends; replaying restarts it, so stealing teams can hear it again too. Level 1: higher/lower, same/different, up/down, fast/slow. Level 2: major/minor chords, steps/skips, crescendo/decrescendo, meter in 3 or 4, staccato/legato. Level 3: major/minor scales, 2nd/3rd/5th/octave, accelerando/ritardando. Level 4: interval quality, major/minor/diminished chords, chromatic scale.
- **Staff:** notation is drawn on screen. Level 1: note names on the staff, note and rest values. Level 2: ledger lines and accidentals, adding up beats, counting sharps/flats. Level 3: naming major keys, interval numbers, sixteenth-note rhythms. Level 4: interval quality, major/minor triads, relative minors.
- The answer key (☰ menu) shows every music question with its staff or a play button.
- **Test speakers** on the setup screen plays a short chord.

## Theory track (Theory 1–4, AP prep)
Pick a **Theory** set in the Questions dropdown and the game switches to the Theory track automatically (or choose **Question style: Theory** on setup). Theory sets default to **10 listening + 5 staff** questions per game, about half of the question boxes, and keep their own counts separate from the band sets.
- **Theory 1:** high/low, same/different, up/down, steps/skips, major/minor chords and scales, meter in 3 or 4, 2nds/3rds/5ths/octaves; reading note names, values, beats, key signatures.
- **Theory 2:** interval quality, major/minor triads, major/natural/harmonic minor/chromatic scales, simple vs. compound duple, authentic vs. half cadence, error detection (6 notes); reading keys (major + relative minor), triads, simple/compound meters, scale-degree names.
- **Theory 3:** all intervals incl. tritone, triad quality and inversion, the five seventh chords, authentic/half/plagal/deceptive cadences, melodic minor/whole tone/pentatonic, simple/compound duple/triple/quadruple, error detection (8 notes), scale degree a melody ends on; reading seventh chords, inversions, Roman numerals in major, all intervals.
- **Theory 4 (AP Music Theory):** intervals weighted to 2nds/6ths/7ths/tritone, seventh chords, PAC/IAC/half/plagal/deceptive/Phrygian half cadences, naming a chord in a progression, the six modes, meter, error detection, scale degrees; reading Roman numerals with inversion figures (major and minor), secondary dominants, parallel 5ths/octaves.
- **Error detection:** the staff shows the melody as written; the board plays it with one note changed; students say which numbered note was different.
- Progressions are real four-part harmony written with AP voice-leading rules: no parallel or antiparallel 5ths/octaves, no direct 5ths/8ves in the outer voices, no crossing or overlap, leading tone up to tonic, chordal 7th down, no augmented leaps, complete chords, and textbook doubling. Cadences come with varied lead-ins, including the cadential 6/4 at Theory 4.
- `tests/theory_check.js` regenerates thousands of these questions and re-derives every answer and every voice-leading rule from the notes (`node tests/theory_check.js`).

## Built-in question sets
The `questions/` folder holds the sets that come with the game and show up in the Questions dropdown on every device:
- Level 1 Beginner: Rank 3 vocab, note values, staff and clefs, piano landmarks, instruments
- Level 2 Developing: Ranks 4–5 vocab, eighth notes, dotted notes, ties, repeats, key signatures, partials
- Level 3 Intermediate: Ranks 6–7 vocab, sixteenths, triplets, 6/8, syncopation, scales, enharmonics
- Level 4 Advanced: Ranks 8–10 vocab, key signatures, transposition, chords, intervals, compound meter

- Theory 1 Fundamentals, Theory 2 Developing, Theory 3 Intermediate, Theory 4 AP Music Theory: written theory questions for the Theory track (Theory 4 follows the AP Music Theory course).

Each file is one set: a `# Set: Name` line, then `Question | Answer` lines. Run `python3 build.py` after editing.

## Files
- `index.html`: the game, with all art built in. This is the file GitHub Pages serves.
- `src/grudgeball.src.html`: the editable source, with image placeholders.
- `assets/`: the art taken from the original myViewBoard file.
- `sounds/`: the game's sound effects and menu music, as MP3s. To change a sound, upload a new MP3 with the **same file name** (for example `sounds/correct.mp3`). basketball.mp3 plays when the Free Shots box opens, open-box.mp3 when any mystery box opens, make-basket.mp3 on MADE IT, miss-basket.mp3 on MISSED, final-round.mp3 when a final round is started and again when its last turn begins, victory.mp3 on the winner screen, gain-heart.mp3 whenever a team gains a heart, select.mp3 on ordinary button taps, and attack.mp3 when a team is hit (timed so its impact lands when the attack animation strikes the card). Sounds without a file (Fermata, Modulation) use built-in beeps.
- `src/music.js`: makes the listening and staff questions, draws the staff and plays the sounds.
- `lib/vexflow-bravura.js`: [VexFlow](https://www.vexflow.com) 4.2.3 (MIT license, see `lib/LICENSE-vexflow`), which draws the notation. It's built into `index.html`, so it works without internet.
- `tests/music_theory.js`: checks thousands of generated questions against music theory (`node tests/music_theory.js`).
- `src/theory.js`: the Theory 1–4 ear-training and staff-reading generators and the four-part voicer.
- `src/remote.js`: the remote control (both the board side and the controller).
- `lib/peerjs.min.js` (PeerJS 1.5.4, MIT, `lib/LICENSE-peerjs`) connects the devices; `lib/qrcode.js` (qrcode-generator, MIT) draws the QR code. Both are built into `index.html`.
- `tests/remote_e2e.py` + `tests/peer-test-server.js`: a two-device test of the remote against a local connection server.
- `build.py`: rebuilds `index.html` from the source and the art (`python3 build.py`).
