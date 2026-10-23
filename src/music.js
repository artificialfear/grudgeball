/* ============================================================
   MUSIC: generated staff (notation) and listening questions
   - Every question is plain JSON {q, a, media:{type:'staff'|'listen', ...}}
     so it can live in game state, undo history and the answer key.
   - Staff questions are drawn with VexFlow (lib/vexflow-bravura.js).
   - Listening questions are played with a small Web Audio synth.
============================================================ */
const MUSIC = (function(){
  const LET = ["C","D","E","F","G","A","B"];
  const PC  = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const rnd = a => a[Math.floor(Math.random()*a.length)];
  const ri  = (lo,hi) => lo + Math.floor(Math.random()*(hi-lo+1));
  const ACC_TXT = {"-1":"♭","0":"","1":"♯"};
  const ACC_VF  = {"-1":"b","0":"","1":"#"};

  // diatonic step number: octave*7 + letter index (C4 = 28, E4 = 30, B4 = 34, G2 = 18)
  const dLetter = d => LET[((d%7)+7)%7];
  const dOct    = d => Math.floor(d/7);
  const nameOf  = (letter, acc) => letter + (ACC_TXT[acc]||"");
  const midiOf  = (d, acc=0) => 12*(dOct(d)+1) + PC[dLetter(d)] + acc;
  const vfKey   = (d, acc=0) => dLetter(d).toLowerCase() + (ACC_VF[acc]||"") + "/" + dOct(d);

  // spell the note a given interval above a root (generic = 2 for a 2nd, semis = half steps)
  function spellAbove(rootD, rootAcc, generic, semis){
    const d = rootD + generic - 1;
    const acc = midiOf(rootD, rootAcc) + semis - midiOf(d, 0);
    return {d, acc};
  }

  const INTERVALS = {
    "Major 2nd":[2,2], "Minor 3rd":[3,3], "Major 3rd":[3,4], "Perfect 4th":[4,5],
    "Perfect 5th":[5,7], "Major 6th":[6,9], "Perfect octave":[8,12]
  };
  const GENERIC = {2:"2nd",3:"3rd",4:"4th",5:"5th",6:"6th",7:"7th",8:"Octave"};

  // Major keys: VexFlow name, display name, accidentals in signature (+ sharps, - flats), relative minor
  const KEYS = [
    {vf:"C",  name:"C major",  n:0,  rel:"A minor"},
    {vf:"F",  name:"F major",  n:-1, rel:"D minor"},
    {vf:"Bb", name:"B♭ major", n:-2, rel:"G minor"},
    {vf:"Eb", name:"E♭ major", n:-3, rel:"C minor"},
    {vf:"Ab", name:"A♭ major", n:-4, rel:"F minor"},
    {vf:"G",  name:"G major",  n:1,  rel:"E minor"},
    {vf:"D",  name:"D major",  n:2,  rel:"B minor"},
    {vf:"A",  name:"A major",  n:3,  rel:"F♯ minor"},
    {vf:"E",  name:"E major",  n:4,  rel:"C♯ minor"}
  ];

  // staff ranges (diatonic numbers)
  const RANGE = {
    treble:{inStaff:[30,38], ledger:[28,41]},   // E4..F5 ; C4..A5
    bass:  {inStaff:[18,26], ledger:[14,28]}    // G2..A3 ; C2..C4
  };

  /* ---------------- STAFF QUESTION GENERATORS ---------------- */
  const S = {};

  S.noteName = (lvl) => {
    const clef = Math.random()<0.6 ? "treble" : "bass";
    const r = lvl>=2 ? RANGE[clef].ledger : RANGE[clef].inStaff;
    const d = ri(r[0], r[1]);
    let acc = 0;
    if(lvl>=2 && Math.random()<0.4){ acc = rnd([-1,1]); }
    return { q:`Name this ${clef} clef note.`, a: nameOf(dLetter(d), acc),
      media:{type:"staff", clef, notes:[{keys:[vfKey(d,acc)], dur:"w", acc:[acc]}]} };
  };

  const VALUES = [
    {dur:"w", name:"Whole note", beats:"4"}, {dur:"h", name:"Half note", beats:"2"},
    {dur:"q", name:"Quarter note", beats:"1"}, {dur:"8", name:"Eighth note", beats:"½"},
    {dur:"wr", name:"Whole rest", beats:"4"}, {dur:"hr", name:"Half rest", beats:"2"},
    {dur:"qr", name:"Quarter rest", beats:"1"}, {dur:"8r", name:"Eighth rest", beats:"½"},
    {dur:"hd", name:"Dotted half note", beats:"3"}
  ];
  S.noteValue = (lvl) => {
    const pool = lvl<=1 ? VALUES.filter(v=>!v.dur.includes("d") && v.dur!=="8r") : VALUES;
    const v = rnd(pool);
    const isRest = v.dur.endsWith("r");
    const askBeats = lvl>=2 && Math.random()<0.5;
    return { q: askBeats ? `In 4/4 time, how many beats does this ${isRest?"rest":"note"} get?` : `What kind of ${isRest?"rest":"note"} is this?`,
      a: askBeats ? `${v.beats} beat${v.beats==="1"?"":"s"} (${v.name.toLowerCase()})` : v.name,
      media:{type:"staff", clef:"treble", notes:[{keys:[v.dur==="wr"?"d/5":"b/4"], dur:v.dur}]} };
  };

  // rhythm groups: [vexflow durations], beats
  const RHY2 = [ {n:["w"],b:4}, {n:["h"],b:2}, {n:["hd"],b:3}, {n:["q"],b:1}, {n:["qr"],b:1}, {n:["hr"],b:2}, {n:["8","8"],b:1} ];
  const RHY3 = RHY2.concat([ {n:["16","16","16","16"],b:1}, {n:["qd","8"],b:2}, {n:["8","16","16"],b:1}, {n:["16","16","8"],b:1} ]);
  S.beats = (lvl) => {
    const pool = lvl>=3 ? RHY3 : RHY2;
    let groups, total;
    do{ groups = Array.from({length:ri(2,4)},()=>rnd(pool)); total = groups.reduce((s,g)=>s+g.b,0); }
    while(total<3 || total>8 || groups.filter(g=>g.b===4).length>1);
    const notes = []; groups.forEach(g=>g.n.forEach(dur=>notes.push({keys:["b/4"], dur})));
    return { q:"Add up the beats in 4/4 time. How many beats is this?", a:`${total} beats`,
      media:{type:"staff", clef:"treble", notes, beam:true} };
  };

  S.countKeySig = (lvl) => {
    const k = rnd(KEYS.filter(k=>k.n!==0 && Math.abs(k.n)<=(lvl>=4?4:3)));
    const kind = k.n<0 ? "flats" : "sharps";
    return { q:`How many ${kind} are in this key signature?`, a:`${Math.abs(k.n)}`,
      media:{type:"staff", clef:rnd(["treble","bass"]), keySig:k.vf, notes:[]} };
  };

  S.keyName = (lvl) => {
    const pool = KEYS.filter(k=> lvl>=4 ? (k.n>=-4 && k.n<=3) : (k.n>=-3 && k.n<=2));
    const k = rnd(pool);
    const askRel = lvl>=4 && Math.random()<0.4;
    return { q: askRel ? "This is a major key signature. What is its relative minor?" : "Name the major key with this key signature.",
      a: askRel ? `${k.rel} (relative of ${k.name})` : k.name,
      media:{type:"staff", clef:rnd(["treble","bass"]), keySig:k.vf, notes:[]} };
  };

  S.genericInterval = () => {
    const generic = rnd([2,3,4,5,6,8]);
    const lo = ri(29, 38 - (generic-1));         // keep it on/near the treble staff
    const hi = lo + generic - 1;
    const harmonic = Math.random()<0.5;
    const notes = harmonic ? [{keys:[vfKey(lo), vfKey(hi)], dur:"w"}] : [{keys:[vfKey(lo)], dur:"h"},{keys:[vfKey(hi)], dur:"h"}];
    return { q:"What interval is this? Count the letter names.", a: generic===8 ? "An octave" : `A ${GENERIC[generic]}`,
      media:{type:"staff", clef:"treble", notes} };
  };

  const ROOTS = [ {d:28,acc:0},{d:31,acc:0},{d:32,acc:0},{d:29,acc:1},{d:33,acc:0},{d:34,acc:-1},{d:30,acc:-1},{d:29,acc:0} ];
  // C4, F4, G4, F#4, A4, Bb4, Eb4, D4
  S.qualityInterval = () => {
    for(let tries=0; tries<50; tries++){
      const root = rnd(ROOTS); const name = rnd(Object.keys(INTERVALS)); const [g, semis] = INTERVALS[name];
      const t = spellAbove(root.d, root.acc, g, semis);
      if(Math.abs(t.acc)>1 || t.d>41) continue;
      const harmonic = Math.random()<0.5;
      const keys = [ {k:vfKey(root.d,root.acc), a:root.acc}, {k:vfKey(t.d,t.acc), a:t.acc} ];
      const notes = harmonic ? [{keys:keys.map(x=>x.k), dur:"w", acc:keys.map(x=>x.a)}]
                             : keys.map(x=>({keys:[x.k], dur:"h", acc:[x.a]}));
      return { q:"What is this interval? Give the quality and number (like Major 3rd).", a:name,
        media:{type:"staff", clef:"treble", notes, _check:{root:[root.d,root.acc], top:[t.d,t.acc], name}} };
    }
  };

  const TRIAD_ROOTS = [ {d:28,acc:0},{d:29,acc:0},{d:30,acc:-1},{d:31,acc:0},{d:32,acc:0},{d:33,acc:0},{d:34,acc:-1},{d:30,acc:0} ];
  S.triad = () => {
    for(let tries=0; tries<50; tries++){
      const r = rnd(TRIAD_ROOTS); const minor = Math.random()<0.5;
      const third = spellAbove(r.d, r.acc, 3, minor?3:4), fifth = spellAbove(r.d, r.acc, 5, 7);
      if([third.acc, fifth.acc].some(a=>Math.abs(a)>1) || fifth.d>40) continue;
      const tones = [[r.d,r.acc],[third.d,third.acc],[fifth.d,fifth.acc]];
      return { q:"Name this chord (root and major or minor).", a:`${nameOf(dLetter(r.d), r.acc)} ${minor?"minor":"major"}`,
        media:{type:"staff", clef:"treble", notes:[{keys:tones.map(t=>vfKey(t[0],t[1])), dur:"w", acc:tones.map(t=>t[1])}], _check:{tones, minor}} };
    }
  };

  const STAFF_BY_LEVEL = {
    1: ["noteName","noteName","noteValue"],
    2: ["noteName","noteName","noteValue","beats","countKeySig"],
    3: ["noteName","beats","keyName","genericInterval","countKeySig"],
    4: ["keyName","qualityInterval","triad","beats","noteName"]
  };

  /* ---------------- LISTENING QUESTION GENERATORS ---------------- */
  // events: {t, midi, dur, vel}  clicks: {t, accent}
  const L = {};
  const seq = (midis, step=0.55, dur=0.5, vel=0.8) => midis.map((m,i)=>({t:i*step, midi:m, dur, vel}));
  const block = (midis, t, dur=1.4, vel=0.6) => midis.map(m=>({t, midi:m, dur, vel}));
  const lis = (q, a, events, clicks) => ({ q, a, media:{type:"listen", events: events||[], clicks: clicks||[]} });

  L.highLow = () => { const a = ri(55,72), gap = ri(5,12)*rnd([-1,1]); const b = a+gap;
    return lis("Which note was HIGHER: the first or the second?", b>a ? "The second note" : "The first note", seq([a,b],1.0,0.9)); };
  L.sameDiff = () => { const a = ri(57,72), same = Math.random()<0.5; const b = same ? a : a + rnd([-4,-3,3,4,5]);
    return lis("Were the two notes the SAME or DIFFERENT?", same ? "The same" : "Different", seq([a,b],1.0,0.9)); };
  L.upDown = (lvl) => { const up = Math.random()<0.5; const start = ri(57,65); const scale=[0,2,4,5,7,9,11,12];
    const n = lvl<=1 ? 5 : 6; let m = scale.slice(0,n).map(x=>start+x); if(!up) m = m.reverse();
    return lis("Did the notes go UP or DOWN?", up ? "Up" : "Down", seq(m,0.45,0.42)); };
  L.fastSlow = () => { const fast = Math.random()<0.5; const bpm = fast ? ri(150,176) : ri(50,62); const st = 60/bpm;
    return lis("Is this tempo FAST or SLOW?", fast ? "Fast (allegro / presto)" : "Slow (largo / adagio)", [], Array.from({length:8},(_,i)=>({t:i*st, accent:false}))); };
  L.majorMinorChord = () => { const r = ri(55,64), minor = Math.random()<0.5; const ch=[r, r+(minor?3:4), r+7];
    return lis("Was this chord MAJOR or MINOR?", minor ? "Minor" : "Major", seq(ch,0.45,0.42).concat(block(ch,1.5))); };
  L.stepsSkips = () => { const steps = Math.random()<0.5; const start = ri(57,64);
    const pattern = steps ? [0,2,4,5,7,5,4,2] : [0,4,7,12,7,4,0]; const up=[0,2,4,5,7,9,11,12];
    const m = steps ? [0,2,4,5,4,2,0].map(x=>start+x) : [0,4,7,4,7,12].map(x=>start+x);
    return lis("Did this melody move mostly by STEPS or by SKIPS?", steps ? "Steps" : "Skips", seq(m,0.42,0.4)); };
  L.crescDecresc = () => { const cresc = Math.random()<0.5; const m = ri(60,67); const n=8;
    const ev = Array.from({length:n},(_,i)=>({t:i*0.38, midi:m, dur:0.33, vel: cresc ? 0.12+0.85*i/(n-1) : 0.97-0.85*i/(n-1)}));
    return lis("Did it get louder (crescendo) or softer (decrescendo)?", cresc ? "Crescendo (louder)" : "Decrescendo (softer)", ev); };
  L.meter = () => { const three = Math.random()<0.5; const per = three?3:4; const st=0.45;
    const clicks = Array.from({length:per*4},(_,i)=>({t:i*st, accent: i%per===0}));
    return lis("Listen for the strong beats. Is this in 3 or in 4?", three ? "3 (like 3/4)" : "4 (like 4/4)", [], clicks); };
  L.articulation = () => { const stac = Math.random()<0.5; const s = ri(60,64);
    const m = [0,2,4,5,7,5,4,2].map(x=>s+x);
    return lis("Was this played STACCATO or LEGATO?", stac ? "Staccato (short, detached)" : "Legato (smooth, connected)", seq(m,0.4, stac?0.1:0.42)); };
  L.scaleMajorMinor = (lvl) => { const r = ri(57,63); const kinds = lvl>=4 ? ["major","minor","chromatic"] : ["major","minor"]; const k = rnd(kinds);
    const steps = k==="major" ? [0,2,4,5,7,9,11,12] : k==="minor" ? [0,2,3,5,7,8,10,12] : [0,1,2,3,4,5,6,7,8,9,10,11,12];
    const ans = {major:"Major scale", minor:"Minor scale", chromatic:"Chromatic scale"}[k];
    return lis(lvl>=4 ? "Which scale is this: MAJOR, MINOR or CHROMATIC?" : "Was this a MAJOR or MINOR scale?", ans, seq(steps.map(x=>r+x), k==="chromatic"?0.26:0.36, k==="chromatic"?0.24:0.34)); };
  L.genericIntervalEar = () => { const opts = [[2,"A 2nd"],[3,"A 3rd"],[5,"A 5th"],[12,"An octave"]]; const [semis, ans] = rnd(opts);
    const r = ri(57,65); const s = semis===3 ? 4 : semis;   // 3rd played as a major 3rd
    return lis("Which interval: a 2nd, a 3rd, a 5th or an octave?", ans, seq([r,r+s],0.8,0.75).concat(block([r,r+s],1.8,1.2))); };
  L.accelRit = () => { const acc = Math.random()<0.5; let t=0; const clicks=[];
    for(let i=0;i<12;i++){ clicks.push({t, accent:false}); const gap = acc ? 0.62-0.035*i : 0.24+0.035*i; t+=gap; }
    return lis("Did the tempo speed up (accelerando) or slow down (ritardando)?", acc ? "Accelerando (speeding up)" : "Ritardando (slowing down)", [], clicks); };
  L.qualityIntervalEar = () => { const names = ["Major 2nd","Major 3rd","Perfect 4th","Perfect 5th","Major 6th","Perfect octave"]; const name = rnd(names);
    const semis = INTERVALS[name][1]; const r = ri(55,64);
    return lis("Name this interval (Major 2nd, Major 3rd, Perfect 4th, Perfect 5th, Major 6th or octave).", name, seq([r,r+semis],0.8,0.75).concat(block([r,r+semis],1.8,1.2))); };
  L.chordQuality = () => { const k = rnd(["major","minor","diminished"]); const r = ri(55,62);
    const ch = k==="major"?[0,4,7]:k==="minor"?[0,3,7]:[0,3,6];
    return lis("Was this chord MAJOR, MINOR or DIMINISHED?", k[0].toUpperCase()+k.slice(1), seq(ch.map(x=>r+x),0.45,0.42).concat(block(ch.map(x=>r+x),1.5))); };

  const LISTEN_BY_LEVEL = {
    1: ["highLow","sameDiff","upDown","fastSlow"],
    2: ["majorMinorChord","stepsSkips","crescDecresc","meter","articulation","upDown"],
    3: ["scaleMajorMinor","genericIntervalEar","accelRit","majorMinorChord","meter","articulation"],
    4: ["qualityIntervalEar","chordQuality","scaleMajorMinor","accelRit","genericIntervalEar"]
  };

  // build n questions of a kind, cycling through types so a game gets variety
  function make(kind, level, n){
    const lvl = Math.max(1, Math.min(4, level|0 || 2));
    const types = shuffle((kind==="staff" ? STAFF_BY_LEVEL : LISTEN_BY_LEVEL)[lvl].slice());
    const lib = kind==="staff" ? S : L;
    const out = [], seen = new Set();
    for(let i=0, guard=0; out.length<n && guard<n*20; guard++){
      const t = types[i % types.length]; i++;
      const item = lib[t](lvl); if(!item) continue;
      const sig = item.q + "|" + item.a + "|" + JSON.stringify(item.media.notes||item.media.events||item.media.clicks);
      if(seen.has(sig)) continue; seen.add(sig);
      item.media.kind = t; out.push(item);
    }
    return out;
  }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

  /* ---------------- DRAW A STAFF (VexFlow) ---------------- */
  function staffReady(){ return typeof window!=="undefined" && window.Vex && window.Vex.Flow; }
  function renderStaff(el, m){
    if(!staffReady()){ el.innerHTML = '<div class="staffmissing">Music notation could not load. Check the internet connection and reload.</div>'; return; }
    const VF = window.Vex.Flow;
    el.innerHTML = "";
    const nNotes = (m.notes||[]).length;
    const W = Math.max(250, (m.keySig?140:110) + nNotes*(nNotes>4?44:58)), H = 150;
    const renderer = new VF.Renderer(el, VF.Renderer.Backends.SVG);
    renderer.resize(W, H);
    const ctx = renderer.getContext();
    const stave = new VF.Stave(6, 18, W-12);
    stave.addClef(m.clef||"treble");
    if(m.keySig) stave.addKeySignature(m.keySig);
    stave.setContext(ctx).draw();
    if(nNotes){
      const notes = m.notes.map(n=>{
        const dotted = n.dur.includes("d");
        const sn = new VF.StaveNote({clef:m.clef||"treble", keys:n.keys, duration:n.dur, align_center: nNotes===1});
        (n.acc||[]).forEach((a,i)=>{ if(a) sn.addModifier(new VF.Accidental(a<0?"b":"#"), i); });
        if(dotted) VF.Dot.buildAndAttach([sn], {all:true});
        return sn;
      });
      const beams = m.beam ? VF.Beam.generateBeams(notes) : [];
      const voice = new VF.Voice({num_beats:4, beat_value:4}).setMode(VF.Voice.Mode.SOFT).addTickables(notes);
      new VF.Formatter().joinVoices([voice]).format([voice], W - (m.keySig?150:90));
      voice.draw(ctx, stave);
      beams.forEach(b=>b.setContext(ctx).draw());
    }
    const svg = el.querySelector("svg");
    // crop to the staff plus room for ledger lines, clefs and stems
    if(svg){ svg.setAttribute("viewBox", `0 26 ${W} 100`); svg.removeAttribute("width"); svg.removeAttribute("height"); svg.style.height="100%"; svg.style.width="100%"; }
    el.style.setProperty("--staffw", W);   // CSS sizes the box from this aspect ratio (W x 100)
  }

  /* ---------------- PLAY A LISTENING QUESTION ---------------- */
  let ctxA = null, live = [], endTimer = null;
  function audio(){ try{ ctxA = ctxA || (typeof actx!=="undefined" && actx) || new (window.AudioContext||window.webkitAudioContext)(); if(ctxA.state==="suspended") ctxA.resume(); }catch(e){} return ctxA; }
  function stop(){ live.forEach(n=>{ try{ n.stop(); }catch(e){} }); live = []; if(endTimer){ clearTimeout(endTimer); endTimer=null; } }
  function tone(ac, t0, midi, dur, vel){
    const f = 440*Math.pow(2,(midi-69)/12);
    const g = ac.createGain(); g.connect(ac.destination);
    const peak = 0.22*vel;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0+0.015);
    g.gain.exponentialRampToValueAtTime(peak*0.55, t0+Math.min(0.25, dur*0.6));
    g.gain.setValueAtTime(peak*0.55, t0+Math.max(0.02, dur-0.05)); g.gain.exponentialRampToValueAtTime(0.0001, t0+dur+0.12);
    [[1,"triangle",1],[2,"sine",0.35],[3,"sine",0.12]].forEach(([mult,type,amp])=>{
      const o = ac.createOscillator(), og = ac.createGain(); o.type=type; o.frequency.value=f*mult; og.gain.value=amp;
      o.connect(og).connect(g); o.start(t0); o.stop(t0+dur+0.2); live.push(o);
    });
  }
  function click(ac, t0, accent){
    const o = ac.createOscillator(), g = ac.createGain(); o.type="square"; o.frequency.value = accent?1500:950;
    g.gain.setValueAtTime(accent?0.3:0.14, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0+0.05);
    o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0+0.06); live.push(o);
  }
  function play(m, onEnd){
    stop(); const ac = audio(); if(!ac){ if(onEnd) onEnd(); return 0; }
    const t0 = ac.currentTime + 0.08; let end = 0;
    (m.events||[]).forEach(e=>{ tone(ac, t0+e.t, e.midi, e.dur, e.vel??0.8); end = Math.max(end, e.t+e.dur+0.15); });
    (m.clicks||[]).forEach(c=>{ click(ac, t0+c.t, c.accent); end = Math.max(end, c.t+0.1); });
    endTimer = setTimeout(()=>{ endTimer=null; if(onEnd) onEnd(); }, (end+0.15)*1000);
    return end;
  }

  return { make, renderStaff, staffReady, play, stop,
           _test:{S, L, spellAbove, midiOf, dLetter, dOct, KEYS, INTERVALS, STAFF_BY_LEVEL, LISTEN_BY_LEVEL} };
})();
if(typeof module!=="undefined") module.exports = MUSIC;
