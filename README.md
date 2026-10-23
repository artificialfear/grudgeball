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
Use **Edit questions** in the game itself. Write one question per line as `Question | Answer`, or paste two columns from Google Sheets.
Question sets save in that browser. Use **Export .txt** to back them up or move them to another device.

## Files
- `index.html`: the game, with all art built in. This is the file GitHub Pages serves.
- `src/grudgeball.src.html`: the editable source, with image placeholders.
- `assets/`: the art taken from the original myViewBoard file.
- `sounds/`: the game's sound effects and menu music, as MP3s. To change a sound, upload a new MP3 with the **same file name** (for example `sounds/correct.mp3`). Sounds without a file (Fermata, Modulation, Free Shots) use built-in beeps.
- `build.py`: rebuilds `index.html` from the source and the art (`python3 build.py`).
