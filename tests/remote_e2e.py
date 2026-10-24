import subprocess, time, json, os
from playwright.sync_api import sync_playwright
from fontroute import install_base
D='/tmp/claude-0/-home-claude/5505701e-983b-5300-8b36-c5fc8f274c17/scratchpad/'
ps=subprocess.Popen(['node','server.js'],cwd=D+'peerserver',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
web=subprocess.Popen(['python3','-m','http.server','8780','--directory',D+'out'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(2)
ok=[];bad=[]
def check(n,c,i=None): (ok if c else bad).append(n); print(('PASS ' if c else 'FAIL ')+n, '' if c else i)
Q='peerhost=127.0.0.1&peerport=9000'
try:
  with sync_playwright() as pw:
    br=pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required','--disable-features=WebRtcHideLocalIpsWithMdns'])
    board=br.new_page(viewport={'width':1870,'height':841}); install_base(board)
    berr=[]; board.on('pageerror',lambda e:berr.append(str(e)))
    board.goto(f'http://localhost:8780/grudgeball.html?{Q}'); board.evaluate("localStorage.clear()"); board.reload(); board.wait_for_timeout(400)
    B=board.evaluate
    board.click('#splash',force=True); board.wait_for_timeout(500)
    board.click('#setupRemoteBtn',force=True)
    board.wait_for_function("document.querySelector('#rpStatus') && /waiting/.test(document.querySelector('#rpStatus').textContent)", timeout=15000)
    url=B("document.querySelector('.rp-url').textContent"); code=B("document.querySelector('.rp-code').textContent")
    check('board panel shows code, QR and link', len(code)==4 and 'remote='+code in url and B("!!document.querySelector('.rp-qr svg')"), (code,url))
    board.screenshot(path='rc_board_panel.png')
    ctx=br.new_context(viewport={'width':820,'height':1180}, has_touch=True, is_mobile=True, device_scale_factor=1)
    pad=ctx.new_page(); install_base(pad); perr=[]; pad.on('pageerror',lambda e:perr.append(str(e)))
    pad.goto(url); P=pad.evaluate
    pad.wait_for_function("document.querySelector('#rcConn').classList.contains('ok')", timeout=20000)
    check('controller connects', True)
    board.wait_for_timeout(500)
    check('board panel shows 1 device connected', '1 device' in B("document.querySelector('#rpStatus').textContent"), B("document.querySelector('#rpStatus').textContent"))
    check('board header-free setup remote button shows connected', 'connected' in B("$('#setupRemoteBtn').textContent"))
    B("$('#modalRoot').innerHTML=''")
    pad.wait_for_timeout(300); pad.screenshot(path='rc_pad_setup.png')
    def tap(sel): pad.locator(sel).first.click(force=True); pad.wait_for_timeout(350)
    tap('[data-ra="start"]')
    check('controller starts the game on the board', B("!!S && !$('#game').classList.contains('hidden')"))
    print('  state message size: %.1f KB' % (len(json.dumps(B("RemoteHost && (()=>{return {S}})()")))/1024))
    # pick a written question from the remote
    i=B("S.boxes.findIndex(b=>b.kind==='q'&&!b.media)"); tap(f'[data-ra="pick"][data-rx="{i}"]')
    check('remote pick opens box on board', B("S.phase")=='question')
    ans=B("curBox().a"); check('controller shows the private answer', ans[:20] in P("document.querySelector('.rc-ans').textContent"))
    check('board does NOT show the answer', not B("!!document.querySelector('#stage .answer')"))
    pad.screenshot(path='rc_pad_question.png')
    tap('[data-ra="correct"]'); check('correct -> attack phase', B("S.phase")=='attack')
    t=B("validTargets(S.turnTeam)[1]"); h0=B(f"S.teams[{t}].hearts")
    pad.screenshot(path='rc_pad_attack.png')
    tap(f'.rc-target[data-rx="{t}"]'); check('remote attack takes a heart on the board', B(f"S.teams[{t}].hearts")==h0-1 and B("S.phase")=='shoot')
    tap('[data-ra="made"]'); check('made it -> choice', B("S.cur.pending"))
    pad.screenshot(path='rc_pad_basket.png')
    h=B("S.teams[S.turnTeam].hearts"); tap('[data-ra="madeheal"]'); check('+1 heart from remote', B("S.teams[0].hearts")==min(h+1,12))
    tap('[data-ra="miss"]'); check('missed -> next team', B("S.turnTeam")==1 and B("S.phase")=='pick')
    # board touch still works and the remote follows
    i=B("S.boxes.findIndex(b=>b.kind==='q'&&!b.opened&&!b.media)"); board.click(f'[data-box="{i}"]',force=True); pad.wait_for_timeout(400)
    check('board touch works and controller follows', P("!!document.querySelector('[data-ra=\"correct\"]')"))
    tap('[data-ra="wrong"]'); check('wrong -> steal on board', B("S.phase")=='steal')
    tap('[data-ra="stealgo"]'); check('steal from remote', B("S.cur.stealing"))
    tap('[data-ra="correct"]'); check('steal correct -> attack', B("S.phase")=='attack')
    t=B("validTargets(S.cur.attacker)[0]"); tap(f'.rc-team[data-rx="{t}"]'); check('attack by tapping team row', B("S.phase")=='pick')
    # undo
    tap('[data-ra="undo"]'); check('undo from remote', B("S.phase")=='attack')
    t=B("validTargets(S.cur.attacker)[0]"); tap(f'.rc-target[data-rx="{t}"]')
    # items: shield + fermata
    ti=B("S.turnTeam"); B(f"S.teams[{ti}].inv=['shield','fermata']; render()"); pad.wait_for_timeout(300)
    tap(f'.rc-item[data-rx=\'[{ti},"shield"]\']'); check('use Shield from remote', B(f"S.teams[{ti}].shield"))
    B("S.itemUsedTurn=0; render()"); pad.wait_for_timeout(300)
    tap(f'.rc-item[data-rx=\'[{ti},"fermata"]\']'); pad.screenshot(path='rc_pad_fermata.png')
    tg=[x for x in range(4) if x!=ti][0]; tap(f'.rc-panel [data-rx=\'[{ti},"fermata",{tg}]\']'); check('Fermata with target picker', B(f"S.teams[{tg}].fermata"))
    # adjust hearts
    tap('[data-ra="ui:adjust"]'); h=B("S.teams[2].hearts"); tap('[data-ra="adjust"][data-rx="[2,-1]"]'); check('± hearts from remote', B("S.teams[2].hearts")==h-1)
    tap('[data-ra="ui:adjust"]')
    # timer mirrors
    i=B("S.boxes.findIndex(b=>b.kind==='q'&&!b.opened&&!b.media)"); tap(f'[data-ra="pick"][data-rx="{i}"]'); pad.wait_for_timeout(1500)
    bt=B("Math.ceil(timerState.left)"); ct=P("document.querySelector('.rc-tnum').textContent")
    check('controller timer matches board (±1s)', ct.isdigit() and abs(int(ct)-bt)<=1, (bt,ct))
    tap('[data-ra="correct"]'); t=B("validTargets(S.turnTeam)[0]"); tap(f'.rc-target[data-rx="{t}"]'); tap('[data-ra="miss"]')
    # listening question: play from remote starts sound on board, clock waits
    i=B("S.boxes.findIndex(b=>b.media&&b.media.type==='listen'&&!b.opened)"); tap(f'[data-ra="pick"][data-rx="{i}"]')
    tap('[data-ra="play"]'); check('play from remote -> board plays', B("listening"))
    pad.wait_for_function("document.querySelector('.rc-tnum') && document.querySelector('.rc-tnum').textContent.trim()!=='🎧'", timeout=15000)
    check('clock starts on both after sound', B("timerState.running"))
    tap('[data-ra="wrong"]'); 
    for k in range(3):
        if B("S.phase")=='steal': tap('[data-ra="stealpass"]')
    tap('[data-ra="next"]')
    # final round
    tap('[data-ra="ui:final"]'); pad.screenshot(path='rc_pad_final.png'); tap('.rc-panel [data-ra="final"][data-rx="0"]')
    check('final round from remote', B("!!S.final"))
    # staff question renders on the controller
    i=B("S.boxes.findIndex(b=>b.media&&b.media.type==='staff'&&!b.opened)"); tap(f'[data-ra="pick"][data-rx="{i}"]')
    check('staff drawn on controller', P("document.querySelectorAll('#rcStaffBox svg').length")==1)
    pad.screenshot(path='rc_pad_staff.png')
    # reconnect after board refresh
    board.reload(); board.wait_for_timeout(500)
    pad.wait_for_function("document.querySelector('#rcConn').classList.contains('ok') && document.querySelector('[data-ra=\"resume\"]')", timeout=40000)
    check('controller reconnects after board refresh; offers Resume', True)
    check('controller warns board needs a tap for sound', P("document.querySelector('#rcBanner').classList.contains('show')"))
    tap('[data-ra="resume"]'); check('resume from remote', B("!!S && !$('#game').classList.contains('hidden')"))
    # laptop controller with keyboard
    lap=br.new_page(viewport={'width':1366,'height':768}); install_base(lap); lap.goto(url)
    lap.wait_for_function("document.querySelector('#rcConn').classList.contains('ok') && document.querySelector('#rcCard').textContent.length>5", timeout=20000)
    B("const i=S.boxes.findIndex(b=>b.kind==='q'&&!b.opened&&!b.media); if(S.phase!=='pick'){S.phase='pick';S.cur={};} pickBox(i)"); lap.wait_for_timeout(400)
    lap.keyboard.press('c'); lap.wait_for_timeout(400); check('laptop: C = correct', B("S.phase")=='attack')
    t=B("validTargets(S.cur.attacker)[0]"); lap.keyboard.press(str(t+1)); lap.wait_for_timeout(400); check('laptop: number key attacks', B("S.phase")=='shoot')
    lap.keyboard.press('m'); lap.wait_for_timeout(300); lap.keyboard.press('h'); lap.wait_for_timeout(300); lap.keyboard.press('x'); lap.wait_for_timeout(400)
    check('laptop: M, H, X', B("S.phase")=='pick')
    lap.keyboard.press('Control+z'); lap.wait_for_timeout(400); check('laptop: Ctrl+Z undo', B("S.phase")=='shoot')
    lap.screenshot(path='rc_laptop.png')
    check('two controllers at once', B("RemoteHost.connected")==2, B("RemoteHost.connected"))
    # iPad landscape screenshot
    pad.set_viewport_size({'width':1180,'height':820}); pad.wait_for_timeout(300); pad.screenshot(path='rc_pad_landscape.png')
    # phone-ish narrow
    pad.set_viewport_size({'width':400,'height':860}); pad.wait_for_timeout(300); pad.screenshot(path='rc_phone.png', full_page=True)
    check('no page errors', not berr and not perr, (berr,perr))
    br.close()
finally:
  ps.terminate(); web.terminate()
print('\nPASSED',len(ok),'FAILED',len(bad),bad)
