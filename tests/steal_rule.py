# Correct steal = take 1 heart from the team that missed (no attack, no shots).
# Run after `python3 build.py`:  python3 tests/steal_rule.py
import os, sys
from playwright.sync_api import sync_playwright
F = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
fails = []
def check(name, ok):
    print(('PASS ' if ok else 'FAIL ') + name)
    if not ok: fails.append(name)

with sync_playwright() as pw:
    b = pw.chromium.launch(); p = b.new_page(viewport={'width': 1600, 'height': 900})
    p.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(status=200, content_type="text/css", body=""))
    p.route("https://fonts.gstatic.com/**", lambda r: r.abort())
    errs = []; p.on('pageerror', lambda e: errs.append(str(e)))
    p.goto(F); p.evaluate("localStorage.clear()"); p.reload(); p.wait_for_timeout(500)
    E = p.evaluate
    E("newGame()"); p.wait_for_timeout(500)
    print('start:', E("[!!S, S&&S.phase, S&&S.teams.length]"))
    E("CFG.anims=0")

    def miss_then_steal(setup=""):
        """Current team picks a written question and misses; the next team steals it correctly."""
        E("if(S.phase!=='pick'){ S.phase='pick'; S.cur={}; } S.teams.forEach(t=>{ t.hearts=6; t.status='alive'; t.shield=false; t.fermata=false; }); render()")
        if setup: E(setup)
        i = E("S.boxes.findIndex(b=>b.kind==='q'&&!b.opened&&!b.media)")
        E(f"pickBox({i})")
        miss = E("S.turnTeam")
        E("answerWrong()")
        thief = E("S.cur.stealList[S.cur.si]")
        before = E(f"[S.teams[{miss}].hearts, S.teams[{thief}].hearts, S.teams[{miss}].status, S.teams[{thief}].status]")
        E("stealGo(); stealCorrect()")
        after = E(f"[S.teams[{miss}].hearts, S.teams[{thief}].hearts, S.teams[{miss}].status, S.teams[{thief}].status]")
        return miss, thief, before, after

    # 1) normal steal
    miss, thief, bf, af = miss_then_steal()
    check('heart moves from the team that missed to the stealer', af[0] == bf[0]-1 and af[1] == bf[1]+1)
    check('no attack choice, no shots: goes to the reveal screen', E("S.phase") == 'reveal' and not E("S.cur.attacker!=null"))
    check('reveal message names both teams', 'stole a heart' in E("S.cur.revealMsg"))
    check('steal does not count for the gang-up rule', not E(f"(S.turnAttacks[{miss}]||[]).includes({thief})"))
    E("undo()")
    check('undo puts both teams back', E(f"[S.teams[{miss}].hearts, S.teams[{thief}].hearts]") == [bf[0], bf[1]] and E("S.phase") == 'steal')
    E("stealCorrect(); revealDone()")
    check('turn order unchanged (next team after the one that missed)', E("S.turnTeam") == E(f"S.order[(S.order.indexOf({miss})+1)%S.order.length]"))

    # 2) Shield does not block it
    miss, thief, bf, af = miss_then_steal("S.teams[S.turnTeam].shield=true")
    check('Shield does not block the steal', af[0] == bf[0]-1)
    E("revealDone()")

    # 3) team that missed drops to 0 -> sudden death
    miss, thief, bf, af = miss_then_steal("S.teams[S.turnTeam].hearts=2")
    check('missed team at 2 -> wrong (1) -> stolen (0) = sudden death', af[0] == 0 and af[2] == 'sd' and af[1] == bf[1]+1)
    E("revealDone()")

    # 4) team that missed has nothing left: stealer still earns 1
    miss, thief, bf, af = miss_then_steal("S.teams[S.turnTeam].hearts=1")
    check('missed team already at 0: stealer still +1, missed team stays at 0', af[0] == 0 and af[1] == bf[1]+1)
    check('message says there was nothing to take', 'no hearts to take' in E("S.cur.revealMsg"))
    E("revealDone()")

    # 5) stealer in sudden death comes back
    miss, thief, bf, af = miss_then_steal("(()=>{const t=S.order[(S.order.indexOf(S.turnTeam)+1)%S.order.length]; S.teams[t].hearts=0; S.teams[t].status='sd';})()")
    check('sudden-death stealer comes back alive with 1 heart', af[1] == 1 and af[3] == 'alive' and af[0] == bf[0]-1)
    E("revealDone()")

    # 6) stealer at max hearts: still takes it from the team that missed
    miss, thief, bf, af = miss_then_steal("(()=>{const t=S.order[(S.order.indexOf(S.turnTeam)+1)%S.order.length]; S.teams[t].hearts=S.cfg.maxHearts;})()")
    check('stealer at max: missed team still loses the heart, stealer stays at max', af[0] == bf[0]-1 and af[1] == E("S.cfg.maxHearts"))
    E("revealDone()")

    # 7) with animations on, nothing throws
    E("CFG.anims=1")
    miss_then_steal(); p.wait_for_timeout(1500); E("revealDone()")
    check('rules sheet describes the new steal', 'from the team that missed' in E("document.documentElement.innerHTML"))
    check('no page errors', not errs)
    if errs: print(errs)
    b.close()
sys.exit(1 if fails else 0)
