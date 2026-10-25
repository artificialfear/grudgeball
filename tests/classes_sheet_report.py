from playwright.sync_api import sync_playwright
from fontroute import install
import json
F='file:///tmp/claude-0/-home-claude/5505701e-983b-5300-8b36-c5fc8f274c17/scratchpad/out/grudgeball.html'
ok=[];bad=[]
def check(n,c,i=None): (ok if c else bad).append(n); print(('PASS ' if c else 'FAIL ')+n, '' if c else i)
ID='15Mnj23kbVn5D3Eu0l1whsXvQCQAJPsekN_k_fSJdGQA'
TABS={'Game Sets':'"Game Sets"\n"Unit 5 Quiz"\n"Rhythm, Review"\n"Typo Tab"\n',
      'Unit 5 Quiz':'"Question","Answer"\n"What is a fermata?","Hold the note"\n"Say ""hi"", then count 1 & 2 &","Done"\n"Multi\nline?","Yes, with a comma"\n',
      'Rhythm, Review':'"Question","Answer"\n"How many beats in a whole note?","4"\n'}
FIRST='"Question","Answer"\n"Default first tab Q","A"\n'
mode={'public':True}
def handle(route):
    from urllib.parse import urlparse, parse_qs
    q=parse_qs(urlparse(route.request.url).query); name=q.get('sheet',[''])[0]
    if not mode['public']: return route.fulfill(status=200, content_type='text/html', body='<!DOCTYPE html><html>Sign in</html>')
    body = TABS.get(name, FIRST)
    route.fulfill(status=200, content_type='text/csv', body=body, headers={'Access-Control-Allow-Origin':'*'})
with sync_playwright() as pw:
    b=pw.chromium.launch(); p=b.new_page(viewport={'width':1870,'height':841}); install(p); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)))
    p.route("https://docs.google.com/**", handle)
    # old-version game + settings, to test migration
    p.goto(F); p.evaluate("""localStorage.clear(); localStorage.setItem('gb_cfg', JSON.stringify({teams:3, names:['Lions','Tigers','Bears'], cfgVer:3, set:'Level 2 Developing'}));
      localStorage.setItem('gb_game', JSON.stringify({S:{teams:[{name:'Lions'},{name:'Tigers'}], over:false, phase:'pick', cur:{}}, UNDO:[]}))""")
    p.reload(); p.wait_for_timeout(400); E=p.evaluate
    check('old settings migrate into a class profile', E("PROFILES.active")=='My Class' and E("CFG.teams")==3 and E("CFG.names[0]")=='Lions' and E("CFG.set")=='Level 2 Developing')
    check('old in-progress game moves to that class', E("!!localStorage.getItem('gb_game::My Class') && !localStorage.getItem('gb_game')") and 'My Class has a game in progress' in E("$('#resumeBox').textContent"))
    p.screenshot(path='prof_setup.png')
    # new class
    p.click('#profNew',force=True); p.fill('#askIn','1st Block (8th)'); p.click('#askOK',force=True); p.wait_for_timeout(200)
    check('new class copies settings and becomes active', E("PROFILES.active")=='1st Block (8th)' and E("CFG.teams")==3)
    check('new class has no game in progress', E("$('#resumeBox').textContent.trim()")=='')
    E("CFG.teams=5; CFG.set='Theory 4 AP Music Theory'; saveCfg(); renderSetup()")
    p.select_option('#profileSelect','My Class'); p.wait_for_timeout(200)
    check('switching back restores that class', E("CFG.teams")==3 and E("CFG.set")=='Level 2 Developing' and 'game in progress' in E("$('#resumeBox').textContent"))
    p.select_option('#profileSelect','1st Block (8th)'); p.wait_for_timeout(200)
    check('each class keeps its own settings', E("CFG.teams")==5 and E("CFG.set")=='Theory 4 AP Music Theory')
    # start a game in 1st block; My Class's game must stay untouched
    p.click('#startBtn',force=True); p.wait_for_timeout(200)
    i=E("S.boxes.findIndex(b=>b.kind==='q'&&!b.media)"); E(f"pickBox({i})")
    check('games are saved per class', E("!!localStorage.getItem('gb_game::1st Block (8th)')") and json.loads(E("localStorage.getItem('gb_game::My Class')"))['S']['teams'][0]['name']=='Lions')
    # REPORT: correct / stolen / missed
    E("answerCorrect(); doAttackTarget(validTargets(S.turnTeam)[0]); shotMiss()")
    i=E("S.boxes.findIndex(b=>b.kind==='q'&&!b.opened&&!b.media)"); E(f"pickBox({i}); answerWrong(); stealGo(); stealCorrect(); doAttackTarget(validTargets(S.cur.attacker)[0])")
    i=E("S.boxes.findIndex(b=>b.kind==='q'&&!b.opened&&b.media&&b.media.type==='staff')"); E(f"pickBox({i}); answerWrong()")
    while E("S.phase")=='steal': E("stealPass()")
    E("revealDone()")
    i=E("S.boxes.findIndex(b=>b.kind==='q'&&!b.opened&&b.media&&b.media.type==='listen')"); E(f"pickBox({i}); answerWrong(); stealGo(); stealWrong()")
    while E("S.phase")=='steal': E("stealPass()")
    E("revealDone()")
    d=E("(()=>{const d=reportData(); return {done:d.done.length, right:d.firstRight.length, stolen:d.stolen.length, missed:d.missed.length, topics:d.topics}})()")
    print('  report:', d)
    check('report counts right/stolen/missed', d['done']==4 and d['right']==1 and d['stolen']==1 and d['missed']==2, d)
    check('report groups by topic', 'Written questions' in d['topics'] and len(d['topics'])>=3 and 'Music questions' not in d['topics'], d['topics'])
    E("finishGame()"); p.wait_for_timeout(300); p.click('#endReport',force=True); p.wait_for_timeout(300)
    check('report opens from the end screen', E("!!document.querySelector('.report')") and 'MISSED BY EVERYONE' in E("document.querySelector('.report').textContent"))
    p.screenshot(path='report.png')
    txt=E("reportText()"); check('copy text has class, counts, missed list', '1st Block (8th)' in txt and 'MISSED BY EVERYONE' in txt and 'STOLEN' in txt, txt[:200])
    E("$('#modalRoot').innerHTML=''"); p.click('#endSetup',force=True); p.wait_for_timeout(200)
    # SIMPLE RULES + gang-up off
    p.evaluate("document.querySelectorAll('#setup details[data-sec]').forEach(d=>d.open=true)"); p.click('#presetSimple',force=True); p.wait_for_timeout(100)
    check('simple preset: 5 items, no gang-up, hold 1, 20s', E("ITEM_ORDER.filter(k=>CFG.items[k].count>0).sort().join()")=='metronome,reed,scale,shield,shots' and E("CFG.gangUp")==0 and E("CFG.handLimit")==1 and E("CFG.qTime")>=20)
    E("CFG.teams=4; saveCfg(); renderSetup()"); p.click('#startBtn',force=True); p.wait_for_timeout(200)
    # Red hits Gold, then Blue hits Gold -> no bonus with gang-up off
    E("S.cur={attacker:0}; S.phase='attack'; doAttackTarget(3); shotMiss()"); E("S.cur={attacker:1}; S.phase='attack'; doAttackTarget(3)")
    check('gang-up off: no warning', not E("wouldGangUp(3)"))
    E("shotMiss()"); check('gang-up off: no bonus turn', not E("S.isBonus") and E("S.turnTeam")==2)
    check('rules list hides gang-up when off', 'Gang-up rule' not in E("(showRules(), document.querySelector('.modal').textContent)")); E("$('#modalRoot').innerHTML=''")
    E("stopTimer(); store.del(gameKey()); S=null; showScreen('setup'); renderSetup()")
    p.click('#presetFull',force=True); check('full preset restores all items + gang-up', E("ITEM_ORDER.every(k=>CFG.items[k].count>0)") and E("CFG.gangUp")==1)
    # GOOGLE SHEET
    p.click('#sheetBtn',force=True); p.fill('#sheetUrl', f'https://docs.google.com/spreadsheets/d/{ID}/edit#gid=0'); p.click('#sheetConnect',force=True); p.wait_for_timeout(800)
    check('sheet sets load in Game Sets order', E("SHEET.order.join('|')")=='Unit 5 Quiz|Rhythm, Review', E("SHEET.order"))
    check('missing tab is reported, not loaded', 'Typo Tab' in E("SHEET.error"), E("SHEET.error"))
    qs=E("parseSet(setText('Unit 5 Quiz'))"); print('  parsed:', qs)
    check('CSV quotes, commas and line breaks parse correctly', len(qs)==3 and qs[1]['q']=='Say "hi", then count 1 & 2 &' and qs[2]['q']=='Multi line?' and qs[2]['a']=='Yes, with a comma', qs)
    E("$('#modalRoot').innerHTML=''; renderSetup()")
    check('dropdown groups sheet sets first', E("document.querySelector('#setSelect optgroup').label").startswith('📄') and 'Unit 5 Quiz' in E("$('#setSelect').textContent"))
    p.select_option('#setSelect','Unit 5 Quiz'); p.wait_for_timeout(100)
    p.click('#editSetBtn',force=True); p.wait_for_timeout(100)
    check('editor points sheet sets back to the sheet', 'comes from your Google Sheet' in E("document.querySelector('.modal').textContent"))
    p.click('#shCopy',force=True); p.wait_for_timeout(100)
    check('copy to this device makes an editable set', E("CFG.set")=='Unit 5 Quiz (my copy)' and E("!!SETS['Unit 5 Quiz (my copy)']"))
    p.select_option('#setSelect','Unit 5 Quiz'); p.click('#startBtn',force=True); p.wait_for_timeout(200)
    check('game plays with a sheet set', E("S.boxes.some(b=>b.q==='What is a fermata?')"))
    E("stopTimer(); store.del(gameKey()); S=null; showScreen('setup'); renderSetup()")
    # offline / private sheet: cached sets survive, clear error shown
    mode['public']=False; p.reload(); p.wait_for_timeout(900)
    check('cached sheet sets still work if the sheet becomes private/offline', E("SHEET.order.length")==2 and 'Anyone with the link' in E("SHEET.error"), E("SHEET.error"))
    p.screenshot(path='sheet_setup.png')
    check('no page errors', not errs, errs)
    b.close()
print('\nPASSED',len(ok),'FAILED',len(bad),bad)
