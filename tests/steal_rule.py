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

    def setup_turn(setup=""):
        E("if(S.phase!=='pick'){ S.phase='pick'; S.cur={}; } S.teams.forEach(t=>{ t.hearts=6; t.status='alive'; t.shield=false; t.fermata=false; }); render()")
        if setup: E(setup)
        i = E("S.boxes.findIndex(b=>b.kind==='q'&&!b.opened&&!b.media)")
        E(f"pickBox({i})")
        return E("S.turnTeam")
    H = lambda k: E(f"S.teams[{k}].hearts")

    def miss_then_steal(setup=""):
        """Current team misses; the next team steals it correctly. Hearts are read before the miss."""
        miss = setup_turn(setup)
        thief = E("S.order[(S.order.indexOf(S.turnTeam)+1)%S.order.length]")
        before = [H(miss), H(thief), E(f"S.teams[{miss}].status"), E(f"S.teams[{thief}].status")]
        E("answerWrong()")
        assert E("S.cur.stealList[S.cur.si]") == thief
        mid = H(miss)
        E("stealGo(); stealCorrect()")
        after = [H(miss), H(thief), E(f"S.teams[{miss}].status"), E(f"S.teams[{thief}].status")]
        return miss, thief, before, after, mid

    # 1) wrong answer alone costs nothing yet
    miss, thief, bf, af, mid = miss_then_steal()
    check('wrong answer: no heart lost until the steal round is over', mid == bf[0])
    check('stolen: the missed team loses exactly 1 heart and the stealer gains it', af[0] == bf[0]-1 and af[1] == bf[1]+1)
    check('no attack choice, no shots: goes to the reveal screen', E("S.phase") == 'reveal' and not E("S.cur.attacker!=null"))
    check('reveal message names both teams', 'stole a heart' in E("S.cur.revealMsg"))
    check('steal does not count for the gang-up rule', not E(f"(S.turnAttacks[{miss}]||[]).includes({thief})"))
    E("undo()")
    check('undo puts both teams back', [H(miss), H(thief)] == [bf[0], bf[1]] and E("S.phase") == 'steal')
    E("stealCorrect(); revealDone()")
    check('turn order unchanged (next team after the one that missed)', E("S.turnTeam") == E(f"S.order[(S.order.indexOf({miss})+1)%S.order.length]"))

    # 2) nobody steals: the missed team loses exactly 1
    miss = setup_turn(); h0 = H(miss)
    E("answerWrong()")
    while E("S.phase") == 'steal': E("stealPass()")
    check('nobody steals: the missed team loses exactly 1 heart', H(miss) == h0-1)
    check('message says the heart was lost', 'loses a heart' in E("S.cur.revealMsg"))
    E("revealDone()")

    # 3) wrong steal, then nobody else: missed team still loses just 1
    miss = setup_turn(); h0 = H(miss)
    E("answerWrong(); stealGo(); stealWrong()")
    while E("S.phase") == 'steal': E("stealPass()")
    check('wrong steal then passes: the missed team still loses just 1', H(miss) == h0-1)
    E("revealDone()")

    # 4) one team passes, the next steals: still just 1 heart, to the stealer
    miss = setup_turn(); h0 = H(miss)
    E("answerWrong(); stealPass()"); thief = E("S.cur.stealList[S.cur.si]"); t0 = H(thief)
    E("stealGo(); stealCorrect()")
    check('pass then steal: 1 heart moves to the second team', H(miss) == h0-1 and H(thief) == t0+1)
    E("revealDone()")

    # 5) Shield does not block it
    miss, thief, bf, af, mid = miss_then_steal("S.teams[S.turnTeam].shield=true")
    check('Shield does not block the steal', af[0] == bf[0]-1)
    E("revealDone()")

    # 6) missed team at 1 heart: stolen -> sudden death
    miss, thief, bf, af, mid = miss_then_steal("S.teams[S.turnTeam].hearts=1")
    check('missed team at 1, stolen -> 0 = sudden death, stealer +1', af[0] == 0 and af[2] == 'sd' and af[1] == bf[1]+1)
    E("revealDone()")

    # 7) missed team already in sudden death: wrong = OUT, stealer still earns 1
    miss, thief, bf, af, mid = miss_then_steal("S.teams[S.turnTeam].hearts=0; S.teams[S.turnTeam].status='sd'; S.teams[S.turnTeam].inv=[]")
    check('sudden-death team misses: OUT, stealer still earns 1', af[2] == 'out' and af[1] == bf[1]+1)
    E("revealDone(); S.teams.forEach(t=>t.status='alive')")

    # 8) stealer in sudden death comes back
    miss, thief, bf, af, mid = miss_then_steal("(()=>{const t=S.order[(S.order.indexOf(S.turnTeam)+1)%S.order.length]; S.teams[t].hearts=0; S.teams[t].status='sd';})()")
    check('sudden-death stealer comes back alive with 1 heart', af[1] == 1 and af[3] == 'alive' and af[0] == bf[0]-1)
    E("revealDone()")

    # 9) stealer at max hearts: missed team still loses the heart
    miss, thief, bf, af, mid = miss_then_steal("(()=>{const t=S.order[(S.order.indexOf(S.turnTeam)+1)%S.order.length]; S.teams[t].hearts=S.cfg.maxHearts;})()")
    check('stealer at max: missed team still loses the heart, stealer stays at max', af[0] == bf[0]-1 and af[1] == E("S.cfg.maxHearts"))
    E("revealDone()")

    # 10) "Wrong answer costs 0": no heart lost either way, stealer still earns 1
    E("S.cfg.wrongCost=0")
    miss, thief, bf, af, mid = miss_then_steal()
    check('cost 0 + steal: missed team keeps its hearts, stealer +1', af[0] == bf[0] and af[1] == bf[1]+1)
    E("revealDone()")
    miss = setup_turn(); h0 = H(miss); E("answerWrong()")
    while E("S.phase") == 'steal': E("stealPass()")
    check('cost 0 + nobody steals: no heart lost', H(miss) == h0)
    E("revealDone(); S.cfg.wrongCost=1")

    # 11) with animations on, nothing throws
    E("CFG.anims=1")
    miss_then_steal(); p.wait_for_timeout(1500); E("revealDone()")
    check('rules sheet describes the new steal', 'your heart goes to them' in E("document.documentElement.innerHTML"))
    check('no page errors', not errs)
    if errs: print(errs)
    b.close()
sys.exit(1 if fails else 0)
