/* ============================================================
   REMOTE CONTROL — run the game from an iPad or a computer.
   - The BOARD (this page, normal URL) is the host. It owns the game, keeps working by touch,
     sends its state to every connected controller, and runs the actions they send
     (each action is checked against the current phase first, exactly like a button tap).
   - A CONTROLLER is this same page opened with ?remote=CODE. It shows the private answer,
     every host button, the timer and the teams, and works by touch or keyboard.
   - PeerJS connects the two (directly over the Wi-Fi when possible, through a relay if not).
============================================================ */
const REMOTE_PREFIX = "grudgeball-v1-";
const REMOTE_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ";   // no I or O (they look like 1 and 0)
function remotePeerOpts(){
  const q = new URLSearchParams(location.search), o = {debug:0};
  // test hook: point both sides at a local PeerJS server
  if(q.get("peerhost")){ o.host = q.get("peerhost"); o.port = +(q.get("peerport")||9000); o.path = q.get("peerpath")||"/"; o.secure = q.get("peersecure")==="1"; o.config = {iceServers:[]}; }
  return o;
}
function remoteExtraParams(){
  const q = new URLSearchParams(location.search);
  return ["peerhost","peerport","peerpath","peersecure"].filter(k=>q.get(k)).map(k=>`&${k}=${encodeURIComponent(q.get(k))}`).join("");
}

(function injectRemoteCSS(){
  const css = `
  /* ---- board: pairing panel ---- */
  .remotecard{max-width:min(860px,94vw)}
  .rp-grid{display:grid;grid-template-columns:auto minmax(0,1fr);gap:22px;align-items:center;margin:8px 0 16px}
  .rp-qr{background:#fff;padding:10px;border-radius:12px;width:min(300px,36vw);aspect-ratio:1}
  .rp-qr svg{width:100%;height:100%;display:block}
  .rp-step{color:var(--dim);font-size:15px;margin:10px 0 6px}
  .rp-url{font-family:"Atkinson Hyperlegible",Verdana,sans-serif;font-weight:700;font-size:16px;background:#000a;border:2px solid var(--line);border-radius:8px;padding:8px 10px;word-break:break-all;user-select:text;-webkit-user-select:text}
  .rp-code{font-family:"Press Start 2P";font-size:44px;letter-spacing:10px;color:var(--gold);text-shadow:4px 4px 0 #000}
  .rp-status{margin-top:14px;font-weight:700;font-size:17px;padding:8px 12px;border-radius:8px;background:#0006;border-left:5px solid var(--dim)}
  .rp-status.ok{border-color:var(--good)} .rp-status.err{border-color:var(--red)} .rp-status.wait{border-color:var(--gold)}
  #remoteBtn.on{background:#0b5d2a;border-color:#3dff7a}
  .rboard-note{font-size:14px;color:var(--dim);margin-top:6px}
  /* ---- controller ---- */
  #remote{position:fixed;inset:0;overflow-y:auto;-webkit-overflow-scrolling:touch;background:radial-gradient(ellipse at 50% 0%,#3a0d16,var(--bg) 60%);color:#fff;
    display:flex;flex-direction:column;font-family:"Pixelify Sans",system-ui,sans-serif;touch-action:manipulation;user-select:none;-webkit-user-select:none}
  #remote.hidden{display:none}
  .rc-top{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#000a;border-bottom:2px solid var(--line);position:sticky;top:0;z-index:5}
  .rc-title{font-family:"Press Start 2P";font-size:15px;text-shadow:2px 2px 0 #b00000;white-space:nowrap}
  .rc-title span{color:var(--gold)}
  .rc-conn{flex:1;min-width:0;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .rc-conn .dot{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:6px;background:#888;vertical-align:middle}
  .rc-conn.ok .dot{background:#3dff7a;box-shadow:0 0 8px #3dff7a} .rc-conn.wait .dot{background:#ffd400;animation:pulse 1s infinite} .rc-conn.err .dot{background:#ff3b3b}
  .rc-banner{display:none;margin:10px 14px 0;padding:10px 14px;border-radius:10px;background:#5a3b00;border:2px solid var(--gold);font-weight:700;font-size:16px}
  .rc-banner.show{display:block}
  .rc-body{flex:1;display:grid;grid-template-columns:minmax(0,1fr);gap:14px;padding:12px 14px;align-content:start}
  @media (min-width:900px){ .rc-body{grid-template-columns:minmax(0,1.45fr) minmax(300px,1fr);align-items:start} }
  .rc-turn{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:17px;margin-bottom:10px}
  .rc-chip{display:inline-block;padding:4px 10px;border-radius:8px;color:#fff;font-family:"Press Start 2P";font-size:12px;text-shadow:2px 2px 0 #000;vertical-align:middle}
  .rc-pill{display:inline-block;padding:4px 8px;border-radius:6px;font-family:"Press Start 2P";font-size:10px;background:var(--gold);color:#000;vertical-align:middle}
  .rc-pill.final{background:#fff}
  .rc-next{margin-left:auto;color:var(--dim);font-size:15px}
  .rc-timer{display:flex;align-items:center;gap:10px;margin:0 0 10px}
  .rc-tnum{font-family:"Press Start 2P";font-size:26px;min-width:84px;text-align:center;padding:8px 6px;border-radius:10px;background:#000a;border:3px solid var(--gold)}
  .rc-tnum.low{color:var(--red);border-color:var(--red);animation:pulse .5s infinite} .rc-tnum.wait{font-size:22px}
  .rc-tbar{flex:1;height:12px;border-radius:6px;background:#ffffff1a;overflow:hidden} .rc-tbar i{display:block;height:100%;background:var(--gold);border-radius:6px}
  .rc-card{background:#140a1ccc;border:3px solid var(--line);border-radius:14px;padding:14px;position:relative}
  .rc-h{font-family:"Press Start 2P";font-size:14px;line-height:1.5;margin:0 0 10px;color:var(--gold)}
  .rc-q{background:#fff;color:#1a1020;border:5px solid var(--gold);border-radius:8px;padding:12px 14px;font-family:"Atkinson Hyperlegible",Verdana,sans-serif;font-weight:700;font-size:22px;line-height:1.25}
  .rc-q .tag{display:block;font-family:"Press Start 2P";font-size:10px;color:#8a5a00;margin-bottom:6px}
  .rc-staff{margin-top:8px;overflow-x:auto} .rc-staff .staffbox{--sh:110px;margin:0}
  .rc-ans{margin-top:10px;background:#123d1f;border:3px solid var(--good);border-radius:10px;padding:10px 14px;font-family:"Atkinson Hyperlegible",Verdana,sans-serif;font-weight:700;font-size:21px;line-height:1.25}
  .rc-ans small{display:block;font-family:"Press Start 2P";font-size:9px;color:#9fe3b4;margin-bottom:6px;line-height:1.5}
  .rc-msg{font-size:18px;margin:10px 0;line-height:1.35} .rc-msg b{color:var(--gold)}
  .rc-btns{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:12px}
  .rc-b{min-height:64px;border-radius:12px;border:3px solid #fff3;background:#2a1b33;color:#fff;font-family:"Press Start 2P";font-size:14px;line-height:1.35;padding:8px;cursor:pointer;box-shadow:0 5px 0 #0008}
  .rc-b:active{transform:translateY(3px);box-shadow:0 2px 0 #0008}
  .rc-b.good{background:#147a35;border-color:#3dff7a} .rc-b.bad{background:#8d1717;border-color:#ff6b6b} .rc-b.gold{background:#7a5a00;border-color:var(--gold)}
  .rc-b.blue{background:#1d4fb8;border-color:#7fb0ff} .rc-b.ghost{background:#0006;min-height:50px;font-size:11px}
  .rc-b[disabled]{opacity:.35;pointer-events:none}
  .rc-b .k{display:block;font-family:"Pixelify Sans";font-size:12px;opacity:.65;margin-top:4px}
  .rc-sec{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
  .rc-boxes{display:grid;grid-template-columns:repeat(auto-fill,minmax(54px,1fr));gap:7px}
  .rc-box{aspect-ratio:1;border-radius:9px;border:2px solid #ffd40088;background:#7a4b00;color:#fff;font-family:"Press Start 2P";font-size:13px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 0 #0008}
  .rc-box.opened{background:#0005;border-color:#ffffff22;cursor:default;box-shadow:none} .rc-box img{width:70%;height:70%;object-fit:contain;opacity:.6}
  .rc-targets{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:10px}
  .rc-target{min-height:70px;border-radius:12px;border:3px solid #fff;color:#fff;font-family:"Press Start 2P";font-size:13px;text-shadow:2px 2px 0 #000;cursor:pointer;line-height:1.5;box-shadow:0 5px 0 #0008}
  .rc-target small{display:block;font-family:"Pixelify Sans";font-size:13px}
  .rc-target.gang{outline:4px solid #ff9d00;outline-offset:2px}
  .rc-teamshead{display:flex;align-items:center;justify-content:space-between;font-family:"Press Start 2P";font-size:12px;color:var(--gold);margin-bottom:8px}
  .rc-mini{background:#0008;border:2px solid var(--line);border-radius:8px;color:#fff;padding:8px 10px;font-family:"Pixelify Sans";font-size:15px;font-weight:700;cursor:pointer}
  .rc-mini.on{background:#7a5a00;border-color:var(--gold)}
  .rc-team{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 10px;align-items:center;background:#0007;border:3px solid #ffffff1a;border-radius:12px;padding:9px 10px;margin-bottom:8px}
  .rc-team.cur{border-color:var(--gold);box-shadow:0 0 14px #ffd40066} .rc-team.out{opacity:.45}
  .rc-team.target{border-color:#ff3b3b;cursor:pointer;animation:pulse 1.2s infinite} .rc-team.gang{border-color:#ff9d00}
  .rc-tn{font-family:"Press Start 2P";font-size:12px;padding:5px 8px;border-radius:7px;text-shadow:2px 2px 0 #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .rc-hearts{font-family:"Press Start 2P";font-size:18px;color:#fff;text-align:right;white-space:nowrap} .rc-hearts img{width:18px;height:18px;vertical-align:-2px;margin-right:4px}
  .rc-tfx{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:13px}
  .rc-badge{padding:3px 7px;border-radius:6px;background:#ffffff1f;font-weight:700} .rc-badge.sd{background:#8d1717} .rc-badge.hit{background:#5a2a00}
  .rc-inv{display:flex;gap:6px;margin-left:auto}
  .rc-item{width:46px;height:46px;border-radius:10px;border:2px solid #ffffff33;background:#0008;padding:4px;cursor:pointer}
  .rc-item img{width:100%;height:100%;object-fit:contain} .rc-item.ready{border-color:var(--gold);box-shadow:0 0 10px #ffd400aa} .rc-item:not(.ready){opacity:.55}
  .rc-adj{display:flex;gap:6px} .rc-adj button{width:44px;height:40px;border-radius:9px;border:2px solid #fff4;background:#2a1b33;color:#fff;font-size:22px;font-weight:700;cursor:pointer}
  .rc-bottom{display:flex;flex-wrap:wrap;gap:8px;padding:10px 14px 16px;border-top:2px solid var(--line);background:#000a;position:sticky;bottom:0;z-index:5}
  .rc-bottom .rc-mini{flex:1 1 auto;min-height:48px}
  .rc-panel{position:absolute;inset:0;background:#0d0612f2;border-radius:12px;padding:16px;z-index:3;overflow-y:auto}
  .rc-keys{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:16px} .rc-keys kbd{font-family:"Press Start 2P";font-size:11px;background:#fff;color:#000;border-radius:5px;padding:4px 6px;text-align:center}
  .rc-toasts{position:fixed;left:50%;bottom:86px;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;align-items:center;z-index:20;pointer-events:none;width:min(92vw,560px)}
  .rc-toast{background:#000e;border:2px solid var(--gold);border-radius:10px;padding:8px 14px;font-weight:700;font-size:16px;text-align:center;animation:rcToast 3s forwards}
  .rc-toast.green{border-color:#3dff7a} .rc-toast.red{border-color:#ff3b3b} .rc-toast.cyan{border-color:#3ad7ff}
  @keyframes rcToast{0%{opacity:0;transform:translateY(10px)}8%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0}}
  .rc-wait{text-align:center;padding:40px 10px;font-size:20px;line-height:1.5}
  .rc-help{color:var(--dim);font-size:14px;margin-top:10px}
  /* touch screens (iPad): no keyboard hints */
  @media (hover:none) and (pointer:coarse){ .rc-b .k, .kbdonly, .rc-bottom [data-ra="ui:keys"]{display:none} }
  @media (max-width:700px){ .rc-toasts{bottom:190px} }
  @media (max-width:520px){ .rc-title{font-size:11px} .rc-b{font-size:12px;min-height:58px} .rc-q{font-size:19px} .rc-ans{font-size:18px} }
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
})();

/* ============================================================
   BOARD SIDE
============================================================ */
const RemoteHost = (function(){
  let peer = null, conns = [], status = "off", errMsg = "", queued = false, lastTick = 0, idRetries = 0, restartT = null;
  let code = store.get("gb_remote_code", null);
  const newCode = () => Array.from({length:4}, ()=>REMOTE_ALPHA[Math.floor(Math.random()*REMOTE_ALPHA.length)]).join("");
  const url = () => location.origin + location.pathname + "?remote=" + code + remoteExtraParams();
  const onScreen = id => !$(id).classList.contains("hidden");

  function start(){
    if(typeof Peer==="undefined"){ status = "err"; errMsg = "The remote-control library didn't load."; update(); return; }
    if(peer && !peer.destroyed) return;
    if(!code){ code = newCode(); store.set("gb_remote_code", code); }
    store.set("gb_remote_on", true);
    status = "wait"; errMsg = ""; update();
    let p;
    try{ p = peer = new Peer(REMOTE_PREFIX + code, remotePeerOpts()); }catch(e){ status = "err"; errMsg = "Couldn't start: " + e.message; update(); return; }
    p.on("open", ()=>{ if(p!==peer) return; status = "ready"; idRetries = 0; update(); });
    p.on("connection", c=>{
      c.on("open", ()=>{ conns.push(c); toast("📱 Remote connected", "cyan"); send(c, snapshot()); update(); });
      c.on("data", d=>{ try{ handle(d); }catch(e){ console.error(e); } });
      c.on("close", ()=>{ conns = conns.filter(x=>x!==c); update(); });
      c.on("error", ()=>{});
    });
    p.on("disconnected", ()=>{ if(p!==peer) return; status = "wait"; update(); setTimeout(()=>{ try{ if(p===peer && !p.destroyed && p.disconnected) p.reconnect(); }catch(e){} }, 2000); });
    p.on("error", e=>{
      if(p!==peer) return;
      if(e.type==="unavailable-id"){
        // usually our own previous session still registered for a few seconds after a reload: retry, then pick a new code
        idRetries++;
        if(idRetries<=4){ status = "wait"; errMsg = ""; update(); restart(3000); }
        else { code = newCode(); store.set("gb_remote_code", code); idRetries = 0; restart(200); }
        return;
      }
      if(["network","server-error","socket-error","socket-closed","browser-incompatible","ssl-unavailable"].includes(e.type)){
        status = "err"; errMsg = e.type==="browser-incompatible" ? "This browser can't do remote control." : "Can't reach the connection service — the network may be blocking it. Retrying…";
        update(); restart(6000); return;
      }
      // peer-level problems with one controller (e.g. it left) don't stop the board
    });
  }
  function restart(ms){
    if(restartT) clearTimeout(restartT);
    restartT = setTimeout(()=>{ restartT = null; if(!store.get("gb_remote_on", false)) return; teardown(); start(); }, ms);
  }
  function teardown(){ conns.forEach(c=>{ try{ c.close(); }catch(e){} }); conns = []; if(peer){ const p = peer; peer = null; try{ p.destroy(); }catch(e){} } }
  function stop(){ store.set("gb_remote_on", false); if(restartT){ clearTimeout(restartT); restartT = null; } teardown(); status = "off"; update(); }
  function changeCode(){ code = newCode(); store.set("gb_remote_code", code); teardown(); start(); }

  /* ---- what the controllers get ---- */
  function timerInfo(){ return {left:timerState.left||0, total:timerState.total||0, running:!!timerState.running}; }
  function snapshot(){
    const scr = onScreen("#game") ? "game" : onScreen("#endscreen") ? "end" : "setup";
    const saved = store.get("gb_game", null);
    const audioOK = !document.getElementById("splash") && !!(actx ? actx.state!=="suspended" : true);
    return { type:"state", screen:scr, S:S||null, undo:UNDO.length, listening, sound:soundOn, audioOK,
      resume: scr==="setup" && !!(saved && saved.S && !saved.S.over), set:CFG.set, teamsCfg:CFG.teams,
      endTitle: scr==="end" ? (($("#endscreen h1")||{}).innerHTML||"") : "", timer:timerInfo() };
  }
  function send(c, msg){ try{ if(c.open) c.send(msg); }catch(e){} }
  function broadcast(msg){ conns.forEach(c=>send(c, msg)); }
  function sync(){ if(!conns.length || queued) return; queued = true; setTimeout(()=>{ queued = false; broadcast(snapshot()); }, 0); }
  function tick(){
    if(!conns.length) return;
    const now = performance.now(); if(now - lastTick < 240 && timerState.running) return; lastTick = now;
    broadcast({type:"tick", timer:timerInfo(), listening});
  }
  function toastFwd(msg, cls){ if(conns.length) broadcast({type:"toast", msg, cls}); }

  /* ---- actions from a controller: checked against the current phase, like a button tap ---- */
  function handle(d){
    if(!d || typeof d!=="object") return;
    if(d.type==="hello"){ sync(); return; }
    if(d.type!=="act") return;
    const a = d.a, x = d.x;
    const inGame = onScreen("#game") && S && !S.over;
    const P = inGame ? S.phase : null, cur = S ? S.cur : {};
    const click = id => { const b = $(id); if(b && !b.disabled) b.click(); };
    // a tap on the board's splash may still be needed for sound; everything else works without it
    switch(a){
      case "start":     if(onScreen("#setup")) click("#startBtn"); break;
      case "resume":    if(onScreen("#setup")) click("#resumeBtn"); break;
      case "endBack": case "endAgain": case "endSetup": if(onScreen("#endscreen")) click("#"+a); break;
      case "pick":      if(P==="pick" && S.boxes[x] && !S.boxes[x].opened) pickBox(x); break;
      case "correct":   if(P==="question") answerCorrect(); else if(P==="steal" && cur.stealing) stealCorrect(); break;
      case "wrong":     if(P==="question") answerWrong(); else if(P==="steal" && cur.stealing) stealWrong(); break;
      case "stealgo":   if(P==="steal" && !cur.stealing) stealGo(); break;
      case "stealpass": if(P==="steal" && !cur.stealing) stealPass(); break;
      case "next":      if(P==="reveal") revealDone(); else if(P==="item" && !cur.overflow) itemContinue(); break;
      case "discard":   if(P==="item" && cur.overflow && (x==="new" || T(S.turnTeam).inv[+x]!=null)) discardItem(String(x)); break;
      case "made":      if(P==="shoot" && !cur.pending) shotMade(); break;
      case "miss":      if(P==="shoot" && !cur.pending) shotMiss(); break;
      case "madeheal":  if(P==="shoot" && cur.pending) madeHeal(); break;
      case "target":
        if(P==="attack" && validTargets(cur.attacker).includes(x)) doAttackTarget(x);
        else if(P==="shoot" && cur.pending && !cur.heartsOnly && T(cur.shooter).status==="alive" && validTargets(cur.shooter).includes(x)) madeAttack(x);
        break;
      case "use": {
        if(!inGame || !Array.isArray(x)) break;
        const [ti, k, tg] = x;
        if(ti!==S.turnTeam || !canUseItems(ti) || !T(ti).inv.includes(k) || itemBlockReason(ti, k)) break;
        if(k==="fermata"){ if(tg!=null && tg!==ti && S.teams[tg] && T(tg).status!=="out") applyFermata(ti, tg); }
        else useItem(ti, k);
        break; }
      case "undo":      if(onScreen("#game") && S) undo(); break;
      case "adjust":    if(inGame && Array.isArray(x) && S.teams[x[0]] && (x[1]===1 || x[1]===-1)) adjust(x[0], x[1]); break;
      case "timer":     if(P==="question" || P==="steal") restartTimer(); break;
      case "play":      if(["question","steal","reveal"].includes(P)) playListen(); break;
      case "peek":      if((P==="question" || P==="steal") && !cur.answerShown) showAnswer(); break;
      case "reshuffle": if(P==="pick" && S.boxes.every(b=>b.opened)) reshuffle(); break;
      case "skip":      if(inGame){ stopListening(); skipTurn(); } break;
      case "final":     if(inGame && [-1,0,1].includes(x) && (x===-1) === !!S.final) setFinal(x); break;
      case "endgame":   if(inGame) finishGame(); break;
      case "sound":     soundOn = !!x; store.set("gb_sound", soundOn); if(onScreen("#game") && S) render(); break;
    }
    sync();
  }

  /* ---- the pairing panel on the board ---- */
  function statusText(){
    if(status==="off") return ["", "Remote is off."];
    if(status==="err") return ["err", "⚠ " + errMsg];
    if(status==="wait") return ["wait", "Connecting to the connection service…"];
    return conns.length ? ["ok", `✅ ${conns.length} device${conns.length>1?"s":""} connected — you can close this.`] : ["wait", "Ready — waiting for your iPad or computer…"];
  }
  function qrSVG(text){
    try{ const q = qrcode(0, "M"); q.addData(text); q.make(); return q.createSvgTag({cellSize:4, margin:2, scalable:true}); }
    catch(e){ return ""; }
  }
  function openPanel(){ start(); renderPanel(); }
  function renderPanel(){
    const [cls, txt] = statusText();
    modal(`<div class="card remotecard"><h2>📱 REMOTE CONTROL</h2>
      <p style="margin-top:0">Run the game from an iPad or computer on the same Wi-Fi. You'll see the answers privately; the board still works by touch.</p>
      <div class="rp-grid"><div class="rp-qr">${qrSVG(url())}</div><div style="min-width:0">
        <div class="rp-step">📷 iPad: point the camera at the code and tap the link.</div>
        <div class="rp-step">💻 Computer: open this link</div><div class="rp-url">${esc(url())}</div>
        <div class="rp-step">Room code</div><div class="rp-code">${esc(code||"")}</div>
        <div class="rp-status ${cls}" id="rpStatus">${esc(txt)}</div></div></div>
      <div class="row"><button class="btn ghost" data-m="close">Close</button>
        <button class="btn" data-m="keep" id="rpNew">New code</button>
        <button class="btn bad" data-m="keep" id="rpStop">Turn off remote</button></div>
      <div class="rboard-note">The remote stays on (even after a refresh) until you turn it off. Anyone with the code can control the game — use "New code" if a student sees it.</div></div>`);
    $("#rpNew").onclick = ()=>{ changeCode(); renderPanel(); };
    $("#rpStop").onclick = ()=>{ stop(); $("#modalRoot").innerHTML = ""; toast("Remote control turned off"); };
  }
  function update(){
    const b = $("#remoteBtn");
    if(b){ b.classList.toggle("on", conns.length>0); b.textContent = conns.length ? `📱 ${conns.length}` : "📱"; }
    const sb = $("#setupRemoteBtn"); if(sb) sb.textContent = conns.length ? `📱 Remote: ${conns.length} connected` : (status==="off" ? "📱 Remote" : "📱 Remote: on");
    if(document.querySelector(".remotecard")){
      const el = $("#rpStatus"), [cls, txt] = statusText();
      if(el && $(".rp-code").textContent===code){ el.className = "rp-status " + cls; el.textContent = txt; }   // same code: just the status line
      else renderPanel();
    }
  }
  return { start, stop, sync, tick, toast:toastFwd, openPanel, get connected(){ return conns.length; }, _handle:handle };
})();

/* ============================================================
   CONTROLLER SIDE (?remote=CODE)
============================================================ */
const RemoteCtl = (function(){
  let peer = null, conn = null, connected = false, code = "", st = null, tmr = {left:0,total:0,running:false,at:0};
  let ui = {adjust:false, panel:null, fermata:null}, retryT = null, openT = null, wake = null, lastErr = "";

  function init(c){
    code = (c||"").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8);
    document.title = "Grudge Ball Remote";
    document.body.insertAdjacentHTML("beforeend", `<section id="remote">
      <div class="rc-top"><div class="rc-conn wait" id="rcConn"><span class="dot"></span>Connecting…</div>
        <div class="rc-title">GRUDGE BALL <span>REMOTE</span></div></div>
      <div class="rc-banner" id="rcBanner"></div>
      <div class="rc-body"><div><div class="rc-turn" id="rcTurn"></div><div id="rcTimer"></div><div class="rc-card" id="rcCard"></div></div>
        <div><div class="rc-teamshead">TEAMS <button class="rc-mini" data-ra="ui:adjust" id="rcAdjBtn">± Hearts</button></div><div id="rcTeams"></div></div></div>
      <div class="rc-bottom" id="rcBottom"></div><div class="rc-toasts" id="rcToasts"></div></section>`);
    const root = $("#remote");
    root.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    root.addEventListener("pointerdown", keepAwake, {passive:true});
    document.addEventListener("visibilitychange", ()=>{ if(document.visibilityState==="visible"){ wake = null; if(!connected) connect(); } });
    setInterval(drawTimer, 100);
    if(!code){ renderAll(); setConn("err", "No room code in the link — open the link shown on the board."); return; }
    connect(); renderAll();
  }
  async function keepAwake(){ try{ if(!wake && navigator.wakeLock) wake = await navigator.wakeLock.request("screen"); }catch(e){} }

  /* ---- connection ---- */
  function setConn(cls, txt){ const el = $("#rcConn"); if(el){ el.className = "rc-conn " + cls; el.innerHTML = `<span class="dot"></span>${esc(txt)}`; } }
  function connect(){
    if(retryT){ clearTimeout(retryT); retryT = null; }
    if(typeof Peer==="undefined"){ setConn("err", "Remote library didn't load"); return; }
    connected = false;
    try{ if(conn) conn.close(); }catch(e){} try{ if(peer) peer.destroy(); }catch(e){}
    setConn("wait", `Connecting to board ${code}…`);
    const p = peer = new Peer(remotePeerOpts());
    p.on("open", ()=>{
      if(p!==peer) return;
      const c = conn = p.connect(REMOTE_PREFIX + code, {reliable:true, serialization:"json"});
      clearTimeout(openT); openT = setTimeout(()=>{ if(c===conn && !connected) retry(); }, 12000);
      c.on("open", ()=>{ if(c!==conn) return; connected = true; lastErr = ""; clearTimeout(openT); setConn("ok", `Connected to board ${code}`); c.send({type:"hello"}); });
      c.on("data", onData);
      c.on("close", ()=>{ if(c!==conn) return; connected = false; setConn("err", "Lost the board — reconnecting…"); retry(); });
      c.on("error", ()=>{ if(c!==conn) return; connected = false; retry(); });
    });
    p.on("error", e=>{
      if(p!==peer) return;
      connected = false;
      lastErr = e.type==="peer-unavailable" ? `Board ${code} not found. On the board, tap 📱 and check the code. Retrying…`
        : ["network","server-error","socket-error","socket-closed"].includes(e.type) ? "Can't reach the connection service — the network may be blocking it. Retrying…"
        : e.type==="browser-incompatible" ? "This browser can't do remote control." : "Connection problem (" + e.type + "). Retrying…";
      setConn("err", lastErr); retry();
    });
    p.on("disconnected", ()=>{ if(p===peer && !connected) retry(); });
  }
  function retry(){ if(retryT) return; retryT = setTimeout(()=>{ retryT = null; if(!connected) connect(); }, 2500); }
  function send(a, x){
    if(!connected || !conn){ toastLocal("Not connected to the board yet", "red"); return; }
    try{ conn.send({type:"act", a, x}); }catch(e){ toastLocal("Couldn't send — reconnecting", "red"); retry(); }
  }

  /* ---- incoming ---- */
  function onData(d){
    if(!d || typeof d!=="object") return;
    if(d.type==="state"){ st = d; S = d.S; setTimer(d.timer); renderAll(); }
    else if(d.type==="tick"){ setTimer(d.timer); if(st && st.listening!==d.listening){ st.listening = d.listening; renderCard(); } }
    else if(d.type==="toast"){ toastLocal(d.msg, d.cls); }
  }
  function setTimer(t){ if(t) tmr = {left:t.left, total:t.total, running:t.running, at:performance.now()}; drawTimer(); }
  function timeLeft(){ return Math.max(0, tmr.running ? tmr.left - (performance.now()-tmr.at)/1000 : tmr.left); }
  function toastLocal(msg, cls=""){
    const box = $("#rcToasts"); if(!box) return;
    const d = document.createElement("div"); d.className = "rc-toast " + cls; d.innerHTML = msg; box.appendChild(d);
    while(box.children.length>2) box.firstChild.remove(); setTimeout(()=>d.remove(), 3000);
  }

  /* ---- drawing ---- */
  const chip = i => `<span class="rc-chip" style="background:${T(i).color}">${esc(T(i).name)}</span>`;
  const btn = (act, label, cls="", key="", x, dis=false) =>
    `<button class="rc-b ${cls}" data-ra="${act}"${x!==undefined?` data-rx='${esc(JSON.stringify(x))}'`:""}${dis?" disabled":""}>${label}${key?`<span class="k">${key}</span>`:""}</button>`;
  const inGame = () => st && st.screen==="game" && S && !S.over;

  function renderAll(){ renderBanner(); renderTurn(); renderCard(); renderTeams(); renderBottom(); drawTimer(); }
  function renderBanner(){
    const b = $("#rcBanner"); if(!b) return;
    const msg = !st ? "" : !st.audioOK ? "🔇 Tap the board once (the TAP TO START screen) so it can play sounds." : !st.sound ? "🔇 The board's sound is off — turn it on with the button below." : "";
    b.textContent = msg; b.classList.toggle("show", !!msg);
  }
  function renderTurn(){
    const el = $("#rcTurn"); if(!el) return;
    if(!inGame()){ el.innerHTML = ""; return; }
    const nx = nextUp();
    let fin = ""; if(S.final){ const left = finalTurnsLeft(); fin = `<span class="rc-pill final">🏁 ${nx==null ? "LAST TURN" : `FINAL · ${left} LEFT`}</span>`; }
    el.innerHTML = `${chip(S.turnTeam)} ${S.isBonus?'<span class="rc-pill">BONUS TURN</span>':""} ${fin}<span class="rc-next">${nx!=null?`next: <b style="color:${T(nx).color};filter:brightness(1.4)">${esc(T(nx).name)}</b>`:""}</span>`;
  }
  function drawTimer(){
    const el = $("#rcTimer"); if(!el) return;
    const show = inGame() && (S.phase==="question" || S.phase==="steal");
    if(!show){ if(el.innerHTML) el.innerHTML = ""; return; }
    const waiting = st.listening || (S.phase==="question" && isListen(curBox()) && !S.cur.heard && !tmr.running);
    const left = timeLeft(), s = Math.ceil(left), frac = tmr.total ? left/tmr.total : 0;
    const cls = waiting ? "wait" : (s<=5 && s>0 && tmr.running) ? "low" : "";
    const txt = waiting ? "🎧" : s===0 ? "TIME" : s;
    el.innerHTML = `<div class="rc-timer"><div class="rc-tnum ${cls}">${txt}</div><div class="rc-tbar"><i style="width:${Math.round(frac*100)}%;background:${frac>.34?"var(--gold)":"var(--red)"}"></i></div></div>`;
  }
  function targetsNow(){
    if(!inGame()) return [];
    if(S.phase==="attack") return validTargets(S.cur.attacker);
    if(S.phase==="shoot" && S.cur.pending && !S.cur.heartsOnly && T(S.cur.shooter).status==="alive") return validTargets(S.cur.shooter);
    return [];
  }
  function targetButtons(list){
    return `<div class="rc-targets">${list.map(i=>`<button class="rc-target ${wouldGangUp(i)?"gang":""}" style="background:${T(i).color}" data-ra="target" data-rx="${i}">
      ${esc(T(i).name)}<small>${T(i).hearts} ♥<span class="kbdonly"> · key ${i+1}</span>${wouldGangUp(i)?" · ⚠ gives them a bonus turn":""}</small></button>`).join("")}</div>`;
  }
  function questionBlock(b){
    const md = b.media;
    const tag = !md ? "" : md.type==="listen" ? `<span class="tag">🎧 LISTENING</span>` : `<span class="tag">🎼 READ THE STAFF</span>`;
    return `<div class="rc-q">${tag}${esc(b.q||"")}${md && (md.type==="staff" || md.staff) ? `<div class="rc-staff"><div class="staffbox" id="rcStaffBox"></div></div>` : ""}</div>
      <div class="rc-ans"><small>ANSWER — ONLY YOU CAN SEE THIS</small>${esc(b.a || "(no answer entered)")}</div>`;
  }
  function renderCard(){
    const el = $("#rcCard"); if(!el) return;
    let h = "";
    if(!st){ h = `<div class="rc-wait">${connected ? "Waiting for the board…" : esc(lastErr || "Connecting to the board…")}<div class="rc-help">Room code <b>${esc(code)}</b></div></div>`; }
    else if(st.screen==="setup"){
      h = `<div class="rc-h">THE BOARD IS ON THE SETUP SCREEN</div><div class="rc-msg">Question set: <b>${esc(st.set||"")}</b> · ${st.teamsCfg} teams</div>
        <div class="rc-btns">${btn("start","▶ Start new game","good")}${st.resume?btn("resume","⏯ Resume game","gold"):""}</div>
        <div class="rc-help">Team names, timers and items are set on the board.</div>`;
    }
    else if(st.screen==="end" && S){
      const ranked = S.teams.map((t,i)=>({t,i})).sort((a,b)=>(b.t.status==="out"?-1:b.t.hearts)-(a.t.status==="out"?-1:a.t.hearts));
      h = `<div class="rc-h">🏆 ${st.endTitle||"GAME OVER"}</div>${ranked.map((r,k)=>`<div class="rc-msg">#${k+1} ${chip(r.i)} ${r.t.status==="out"?"OUT":r.t.hearts+" ♥"}</div>`).join("")}
        <div class="rc-btns">${btn("endBack","↶ Back to game")}${btn("endAgain","Play again","good")}${btn("endSetup","Setup")}</div>`;
    }
    else if(inGame()){
      const p = S.phase, ti = S.turnTeam, c = S.cur;
      if(p==="pick"){
        const left = S.boxes.filter(b=>!b.opened).length;
        h = `<div class="rc-h">${esc(T(ti).name.toUpperCase())}: PICK A MYSTERY BOX</div><div class="rc-msg">Students can tap the board, or tap the number they call out:</div>
          <div class="rc-boxes">${S.boxes.map((b,i)=> b.opened
            ? `<div class="rc-box opened">${b.kind==="item" ? `<img src="${ITEMS[b.item].icon}" alt="">` : b.media ? (b.media.type==="listen"?"🎧":"🎼") : "?"}</div>`
            : `<button class="rc-box" data-ra="pick" data-rx="${i}">${i+1}</button>`).join("")}</div>
          ${left===0 ? `<div class="rc-btns">${btn("reshuffle","All opened — Reshuffle","gold")}</div>` : ""}`;
      }
      else if(p==="question" || p==="steal" || p==="reveal"){
        const b = curBox(), listen = isListen(b);
        h = questionBlock(b);
        const playBtn = listen ? btn("play", st.listening ? "♪ Playing on the board…" : (c.heard || p!=="question") ? "▶ Play again" : "▶ Play the sound", "blue", "L", undefined, st.listening) : "";
        if(p==="question"){
          h += `<div class="rc-msg">${chip(ti)} is answering.${T(ti).status==="sd"?' <b style="color:var(--red)">Sudden death: wrong = OUT.</b>':""}${listen && !c.heard?" The clock starts after the sound plays.":""}</div>
            <div class="rc-btns">${btn("correct","✓ Correct","good","C")}${btn("wrong","✗ Wrong","bad","W")}</div>
            <div class="rc-btns">${playBtn}${btn("timer","↻ Restart timer","ghost","T")}${btn("peek", c.answerShown?"Answer is on the board":"👁 Show answer on board","ghost","A",undefined,!!c.answerShown)}</div>`;
        }else if(p==="steal"){
          const si = c.stealList[c.si];
          h += !c.stealing
            ? `<div class="rc-msg">${chip(si)} — <b>steal or pass?</b> (no answer in time = pass)</div>
               <div class="rc-btns">${btn("stealgo","🖐 Steal","gold","S")}${btn("stealpass","Pass →","","P")}</div><div class="rc-btns">${playBtn}</div>`
            : `<div class="rc-msg">${chip(si)} <b>is stealing!</b>${T(si).status==="sd"?" Sudden death: wrong = OUT.":""}</div>
               <div class="rc-btns">${btn("correct","✓ Correct","good","C")}${btn("wrong","✗ Wrong","bad","W")}</div>
               <div class="rc-btns">${playBtn}${btn("timer","↻ Restart timer","ghost","T")}${btn("peek", c.answerShown?"Answer is on the board":"👁 Show answer on board","ghost","A",undefined,!!c.answerShown)}</div>`;
        }else{
          h += `<div class="rc-msg">${c.revealMsg||""}</div><div class="rc-btns">${btn("next","Next turn →","gold","Enter")}${playBtn}</div>`;
        }
      }
      else if(p==="item"){
        const k = c.item, it = ITEMS[k], t = T(ti), after = S.cfg.items[k]?.after;
        const notes = [];
        if(c.underdog) notes.push("Underdog bonus: last place gets +1 heart!");
        if(c.taxed) notes.push(`Leader tax: ${t.name} is at max hearts and can't collect items.`);
        h = `<div class="rc-h">${esc(t.name.toUpperCase())} FOUND ${esc(it.found)}!</div>
          <div style="display:flex;gap:12px;align-items:center"><img src="${it.icon}" alt="" style="width:64px;height:64px;object-fit:contain"><div class="rc-msg">${esc(it.desc)}</div></div>
          ${notes.map(n=>`<div class="rc-msg"><b>${esc(n)}</b></div>`).join("")}`;
        if(c.overflow){
          h += `<div class="rc-msg">${esc(t.name)} can only hold ${C("handLimit",2)} items. Throw one away:</div>
            <div class="rc-btns">${t.inv.map((x,j)=>btn("discard",`Drop ${esc(ITEMS[x].short)}`,"",'',String(j))).join("")}${btn("discard",`Leave new ${esc(it.short)}`,"gold","","new")}</div>`;
        }else{
          const label = c.taxed ? "Pick another box →" : k==="shots" ? "🏀 Start shooting" : (after==="again" ? "Pick another box →" : "End turn →");
          h += `<div class="rc-btns">${btn("next", label, "gold", "Enter")}</div>`;
        }
      }
      else if(p==="attack"){
        const a = c.attacker;
        h = `<div class="rc-h">${esc(T(a).name.toUpperCase())} ${c.noShots?"STOLE IT":"GOT IT RIGHT"} — ATTACK WHO?</div>
          ${S.lastAnswer?`<div class="rc-ans"><small>ANSWER</small>${esc(S.lastAnswer)}</div>`:""}
          <div class="rc-msg">Tap a team${c.noShots?" (no shots on a steal)":""}.<span class="kbdonly"> Keys 1–${S.teams.length} work too.</span></div>${targetButtons(targetsNow())}`;
      }
      else if(p==="shoot"){
        const sh = T(c.shooter);
        const head = c.mode==="free" ? `FREE SHOTS — ${Math.min(FREE_SHOTS, FREE_SHOTS-c.shotsLeft+1)} OF ${FREE_SHOTS}` : `${esc(sh.name.toUpperCase())} SHOOTS 'TIL THEY MISS`;
        h = `<div class="rc-h">${head}</div><div class="rc-msg">${c.shooterNo?`Shooter: <b>Player ${c.shooterNo}</b> · `:""}Baskets made: <b>${c.made}</b></div>`;
        if(c.pending){
          const tg = targetsNow();
          h += `<div class="rc-msg"><b>Basket!</b> +1 heart for ${esc(sh.name)}${tg.length?", or tap a team to attack":""}.</div>
            <div class="rc-btns">${btn("madeheal","❤ +1 heart","good","H")}</div>${tg.length?targetButtons(tg):""}`;
        }else h += `<div class="rc-btns">${btn("made","🏀 MADE IT","good","M")}${btn("miss","✗ MISSED","bad","X")}</div>`;
      }
    }
    // overlays
    if(ui.panel==="final" && inGame()){
      if(S.final){
        const left = finalTurnsLeft();
        h += `<div class="rc-panel"><div class="rc-h">🏁 FINAL ROUND IS ON</div><div class="rc-msg">${left?`${left} more regular turn${left===1?"":"s"} after this one.`:"This is the last regular turn."} Bonus turns still play.</div>
          <div class="rc-btns">${btn("final","Cancel final round","bad","",-1)}${btn("ui:close","Keep going")}</div></div>`;
      }else{
        const act_ = activeTeams(), mx = Math.max(...act_.map(i=>T(i).turns||0)), behind = act_.filter(i=>(T(i).turns||0)<mx);
        h += `<div class="rc-panel"><div class="rc-h">🏁 FINAL ROUND</div><div class="rc-msg">Every team still in ends with the same number of turns, then the winner shows.</div>
          <div class="rc-btns">${btn("final","Finish this round","gold","",0)}${btn("final","One more full round","","",1)}</div>
          <div class="rc-help">${behind.length?`Still to go this round: ${behind.map(i=>esc(T(i).name)).join(", ")}.`:`Everyone has had the same number of turns — "Finish this round" ends the game after ${esc(T(S.turnTeam).name)}'s turn.`}</div>
          <div class="rc-btns">${btn("ui:close","Cancel","ghost")}</div></div>`;
      }
    }
    if(ui.panel==="end" && inGame()) h += `<div class="rc-panel"><div class="rc-h">END THE GAME NOW?</div><div class="rc-msg">The winner screen shows on the board.</div><div class="rc-btns">${btn("endgame","🏆 End game & show winner","gold")}${btn("ui:close","Cancel")}</div></div>`;
    if(ui.panel==="skip" && inGame()) h += `<div class="rc-panel"><div class="rc-h">SKIP ${esc(T(S.turnTeam).name.toUpperCase())}'S TURN?</div><div class="rc-btns">${btn("skip","Skip turn","bad")}${btn("ui:close","Cancel")}</div></div>`;
    if(ui.panel==="fermata" && inGame()){
      const ti = S.turnTeam, opts = S.teams.map((_,i)=>i).filter(i=>i!==ti && T(i).status!=="out");
      h += `<div class="rc-panel"><div class="rc-h">FERMATA — HOLD WHICH TEAM?</div><div class="rc-msg">They can't steal on the next wrong answer.</div>
        <div class="rc-targets">${opts.map(i=>`<button class="rc-target" style="background:${T(i).color}" data-ra="use" data-rx='${esc(JSON.stringify([ti,"fermata",i]))}'>${esc(T(i).name)}</button>`).join("")}</div>
        <div class="rc-btns">${btn("ui:close","Cancel","ghost")}</div></div>`;
    }
    if(ui.panel==="keys") h += `<div class="rc-panel"><div class="rc-h">⌨ KEYBOARD SHORTCUTS</div><div class="rc-keys">
      <kbd>C</kbd><span>Correct</span><kbd>W</kbd><span>Wrong</span><kbd>S</kbd><span>Steal</span><kbd>P</kbd><span>Pass</span>
      <kbd>Enter</kbd><span>Next turn / continue</span><kbd>M</kbd><span>Made it</span><kbd>X</kbd><span>Missed</span><kbd>H</kbd><span>+1 heart after a basket</span>
      <kbd>1–8</kbd><span>Attack team 1–8 (in team order)</span><kbd>L</kbd><span>Play the listening sound</span><kbd>T</kbd><span>Restart timer</span>
      <kbd>A</kbd><span>Show answer on the board</span><kbd>U</kbd><span>Undo (Ctrl+Z works too)</span><kbd>F</kbd><span>Final round</span><kbd>Esc</kbd><span>Close this panel</span></div>
      <div class="rc-btns">${btn("ui:close","Close","ghost")}</div></div>`;
    el.innerHTML = h;
    const sb = $("#rcStaffBox"); if(sb && typeof MUSIC!=="undefined"){ const cm = curBox().media; MUSIC.renderStaff(sb, cm.type==="staff" ? cm : cm.staff); }
  }
  function renderTeams(){
    const el = $("#rcTeams"); if(!el) return;
    $("#rcAdjBtn").classList.toggle("on", ui.adjust);
    if(!S || !st || st.screen==="setup"){ el.innerHTML = `<div class="rc-help">Teams show here once a game starts.</div>`; return; }
    const tg = targetsNow();
    el.innerHTML = S.teams.map((t,i)=>{
      const fx = [];
      const hitBy = (S.prevAttacks && S.prevAttacks[i]) || [];
      if(hitBy.length && t.status!=="out") fx.push(`<span class="rc-badge hit">⚔ hit by ${esc(hitBy.map(a=>T(a).name).join(" & "))}</span>`);
      if(t.status==="sd") fx.push(`<span class="rc-badge sd">SUDDEN DEATH</span>`);
      if(t.status==="out") fx.push(`<span class="rc-badge sd">OUT</span>`);
      if(t.shield) fx.push(`<span class="rc-badge">🛡 shield</span>`);
      if(t.ring>0) fx.push(`<span class="rc-badge">💍 lifesteal</span>`);
      if(t.sword>0) fx.push(`<span class="rc-badge">⚔ 2× ×${t.sword}</span>`);
      if(t.metronome) fx.push(`<span class="rc-badge">⏱ +10s</span>`);
      if(S.repeatTeam===i) fx.push(`<span class="rc-badge">𝄇 repeat</span>`);
      if(t.fermata) fx.push(`<span class="rc-badge">held</span>`);
      const can = inGame() && canUseItems(i);
      const inv = t.inv.map(k=>`<button class="rc-item ${can && !itemBlockReason(i,k)?"ready":""}" data-ra="item" data-rx='${esc(JSON.stringify([i,k]))}' title="${esc(ITEMS[k].name)}"><img src="${ITEMS[k].icon}" alt="${esc(ITEMS[k].short)}"></button>`).join("");
      const cls = ["rc-team", i===S.turnTeam?"cur":"", t.status==="out"?"out":"", tg.includes(i)?"target":"", tg.includes(i)&&wouldGangUp(i)?"gang":""].join(" ");
      return `<div class="${cls}" ${tg.includes(i)?`data-ra="target" data-rx="${i}"`:""}>
        <div class="rc-tn" style="background:${t.color}">${i+1}. ${esc(t.name)}</div>
        <div class="rc-hearts"><img src="${A.heart}" alt="">${t.hearts}</div>
        <div class="rc-tfx">${fx.join("")}<div class="rc-inv">${inv}</div>${ui.adjust?`<div class="rc-adj"><button data-ra="adjust" data-rx="[${i},-1]">−</button><button data-ra="adjust" data-rx="[${i},1]">+</button></div>`:""}</div></div>`;
    }).join("");
  }
  function renderBottom(){
    const el = $("#rcBottom"); if(!el) return;
    const g = inGame();
    el.innerHTML = `<button class="rc-mini" data-ra="undo" ${st && st.screen==="game" && st.undo ? "" : "disabled"}>↶ Undo</button>
      <button class="rc-mini ${S&&S.final?"on":""}" data-ra="ui:final" ${g?"":"disabled"}>🏁 Final round</button>
      <button class="rc-mini" data-ra="ui:skip" ${g?"":"disabled"}>⏭ Skip turn</button>
      <button class="rc-mini" data-ra="ui:key" ${S?"":"disabled"}>🔑 Answer key</button>
      <button class="rc-mini" data-ra="ui:end" ${g?"":"disabled"}>🏆 End game</button>
      <button class="rc-mini" data-ra="sound" data-rx="${st && st.sound ? "false" : "true"}">${st && !st.sound ? "🔇 Board sound off" : "🔊 Board sound on"}</button>
      <button class="rc-mini" data-ra="ui:keys">⌨ Keys</button>`;
  }

  /* ---- input ---- */
  function onClick(e){
    const b = e.target.closest("[data-ra]"); if(!b || b.disabled) return;
    const a = b.dataset.ra; let x = b.dataset.rx; if(x!==undefined){ try{ x = JSON.parse(x); }catch(err){} }
    doAct(a, x);
  }
  function doAct(a, x){
    if(a.startsWith("ui:")){
      const w = a.slice(3);
      if(w==="close"){ ui.panel = null; }
      else if(w==="adjust"){ ui.adjust = !ui.adjust; renderTeams(); return; }
      else if(w==="key"){ showKey(); return; }
      else ui.panel = ui.panel===w ? null : w;
      renderCard(); return;
    }
    if(a==="item"){
      const [i, k] = x;
      if(!inGame() || i!==S.turnTeam){ toastLocal(`Items can only be used on ${T(i).name}'s own turn.`); return; }
      if(!canUseItems(i)){ toastLocal(S.itemUsedTurn===S.turnNo ? "One item per turn!" : "Not right now — finish this step first."); return; }
      const why = itemBlockReason(i, k); if(why){ toastLocal(esc(why)); return; }
      if(k==="fermata"){ ui.panel = "fermata"; renderCard(); return; }
      send("use", [i, k]); return;
    }
    if(["final","endgame","skip","use"].includes(a)) ui.panel = null;
    if(a==="sound") x = !!x;
    send(a, x);
    if(ui.panel===null) renderCard();
  }
  function onKey(e){
    if(e.target.matches && e.target.matches("input,textarea,select")) return;
    if($("#modalRoot").innerHTML && e.key==="Escape"){ $("#modalRoot").innerHTML = ""; return; }
    const k = e.key.toLowerCase();
    if((e.ctrlKey||e.metaKey) && k==="z"){ e.preventDefault(); send("undo"); return; }
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    if(k==="escape"){ ui.panel = null; renderCard(); return; }
    if(!inGame()){ if(k==="enter" && st && st.screen==="setup") return; return; }
    const p = S.phase, c = S.cur;
    const map = { c:"correct", w:"wrong", s:"stealgo", p:"stealpass", m:"made", x:"miss", h:"madeheal", l:"play", t:"timer", a:"peek", u:"undo" };
    if(k==="enter" || k==="n"){ e.preventDefault(); send("next"); return; }
    if(k==="f"){ doAct("ui:final"); return; }
    if(/^[1-8]$/.test(k)){ const i = +k - 1; if(targetsNow().includes(i)) send("target", i); return; }
    if(map[k]){ e.preventDefault(); send(map[k]); }
  }
  return { init, get connected(){ return connected; } };
})();

/* ---- start-up ---- */
if(REMOTE_MODE) RemoteCtl.init(new URLSearchParams(location.search).get("remote"));
else{
  $("#remoteBtn").onclick = ()=>{ uiSel(); RemoteHost.openPanel(); };
  $("#setupRemoteBtn").onclick = e=>{ e.stopPropagation(); uiSel(); RemoteHost.openPanel(); };
  if(store.get("gb_remote_on", false)) RemoteHost.start();   // stay on after a refresh so the iPad reconnects by itself
}
