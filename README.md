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
- **Fairness:**
  - **Shooters rotate:** students number off, and the game calls who shoots next.
  - **Underdog bonus:** the last-place team gets +1 heart whenever it opens an item box.
  - **Leader tax:** a team at max hearts can't collect items.

All of these can be adjusted on the setup screen.

## Editing questions
Use **Edit questions** in the game itself. Write one question per line as `Question | Answer`, or keep your questions in a Google Sheet (column A = question, column B = answer) and paste the columns in. The header row, blank rows and any extra columns are skipped.
Question sets save in that browser. Use **Export .txt** to back them up or move them to another device.

## Built-in question sets
The `questions/` folder holds the sets that come with the game and show up in the Questions dropdown on every device:
- Level 1 Beginner: Rank 3 vocab, note values, staff and clefs, piano landmarks, instruments
- Level 2 Developing: Ranks 4–5 vocab, eighth notes, dotted notes, ties, repeats, key signatures, partials
- Level 3 Intermediate: Ranks 6–7 vocab, sixteenths, triplets, 6/8, syncopation, scales, enharmonics
- Level 4 Advanced: Ranks 8–10 vocab, key signatures, transposition, chords, intervals, compound meter

Each file is one set: a `# Set: Name` line, then `Question | Answer` lines. Run `python3 build.py` after editing.

## Files
- `index.html`: the game, with all art built in. This is the file GitHub Pages serves.
- `src/grudgeball.src.html`: the editable source, with image placeholders.
- `assets/`: the art taken from the original myViewBoard file.
- `sounds/`: the game's sound effects and menu music, as MP3s. To change a sound, upload a new MP3 with the **same file name** (for example `sounds/correct.mp3`). basketball.mp3 plays when the Free Shots box opens. Sounds without a file (Fermata, Modulation, MADE IT) use built-in beeps.
- `build.py`: rebuilds `index.html` from the source and the art (`python3 build.py`).
