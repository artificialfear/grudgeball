# Grudge Ball

A team review game for band class, made to run on a classroom viewboard with a mini basketball hoop.

**Play it:** https://artificialfear.github.io/grudgeball/

## How the game works
- Teams start with 8 hearts (max 12). On their turn, a team picks a mystery box.
- **Question:** the team has 15 seconds. If they get it right, they take a heart from another team, then one player shoots until they miss. Each basket is +1 heart for their team or one more heart taken from another team.
- **Wrong answer:** the team loses a heart. Then the other teams get a chance to steal, one at a time in turn order. Each team has 5 seconds to choose steal or pass; running out of time counts as a pass. A team that steals gets a fresh 5 seconds to answer. A wrong steal costs a heart. A correct steal takes a heart from another team but gets no shots, and turn order doesn't change.
- **Gang-up rule:** if one team attacks a team and a different team attacks it on the very next turn, the attacked team gets a bonus turn right away. Steal attacks don't count toward this.
- **Sudden death (0 hearts):** the team can't attack. A correct answer earns 1 heart back, with no shots. A wrong answer means the team is out.
- **Items:** Shield, Lifesteal Ring, Cursed Sword and Reed of Resurrection are kept and played later. Five Free Shots and the Traumatic Scale take effect right away.

All of these can be adjusted on the setup screen.

## Editing questions
Use **Edit questions** in the game itself. Write one question per line as `Question | Answer`, or paste two columns from Google Sheets.
Question sets save in that browser. Use **Export .txt** to back them up or move them to another device.

## Files
- `index.html`: the game, with all art built in. This is the file GitHub Pages serves.
- `src/grudgeball.src.html`: the editable source, with image placeholders.
- `assets/`: the art taken from the original myViewBoard file.
- `build.py`: rebuilds `index.html` from the source and the art (`python3 build.py`).
