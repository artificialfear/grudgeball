// independent checks: recompute every answer from the pitches actually shown / played
global.window = {}; 
const MUSIC = require('../src/music.js'); global.MUSIC = MUSIC;
require('../src/theory.js');
const PC = {C:0,D:2,E:4,F:5,G:7,A:9,B:11}, LET="CDEFGAB";
const parse = k => { const [n,o]=k.split("/"); const L=n[0].toUpperCase(); const a=n.slice(1); const acc = a==="##"?2:a==="#"?1:a==="bb"?-2:a==="b"?-1:0; return {L, acc, midi:12*(+o+1)+PC[L]+acc, d:+o*7+LET.indexOf(L)}; };
const SHARPS="FCGDAEB", FLATS="BEADGCF";
const sigN = {C:0,G:1,D:2,A:3,E:4,F:-1,Bb:-2,Eb:-3,Ab:-4};
const sigAcc=(L,n)=> n>0&&SHARPS.slice(0,n).includes(L)?1 : n<0&&FLATS.slice(0,-n).includes(L)?-1:0;
let bad=0, n=0; const stats={leadins:new Set(), cad64:0, v7:0, inv:{}, rinv:{}};
// AP voice-leading audit of a generated progression (independent of the voicer's code)
function voiceLeading(k, c){
  const ch=c.chords; if(!ch) return fail(k,'no chord data');
  ch.forEach((x,i)=>{ const v=x.v; if(!(v[0]<=v[1]&&v[1]<v[2]&&v[2]<v[3])) fail(k+'-order',v);
    if(v[2]-v[1]>12||v[3]-v[2]>12) fail(k+'-spacing',v);
    if(v[3]<60||v[3]>79||v[2]<55||v[2]>74||v[1]<48||v[1]>67||v[0]<40||v[0]>60) fail(k+'-range',v);
    if(v.filter(m=>mod(m,12)===c.ltPc).length>1 && (x.x%7===4||x.x%7===6)) fail(k+'-doubledLT',v);
    if(i===0) return; const p=ch[i-1].v, px=ch[i-1];
    for(let a=0;a<4;a++) for(let b=a+1;b<4;b++){ const i1=mod(p[b]-p[a],12), i2=mod(v[b]-v[a],12);
      if(((i1===7&&i2===7)||(i1===0&&i2===0)) && p[a]!==v[a] && p[b]!==v[b]) fail(k+'-parallels', p+' -> '+v); }
    for(let j=0;j<4;j++){ const mv=Math.abs(v[j]-p[j]); if(mv===6) fail(k+'-tritoneLeap', `voice ${j} ${p} -> ${v}`);
      if(c.minor && mv===3){ const sub6=mod(c.ltPc-3,12); const pair=[mod(v[j],12),mod(p[j],12)].sort().join(); if(pair===[sub6,c.ltPc].sort().join()) fail(k+'-aug2', `voice ${j}`); } }
    { const bm=Math.abs(v[0]-p[0]); if(bm===10||bm===11||bm>12) fail(k+'-bassLeap', p+' -> '+v); }
    if(!x.seventh && !(x.x%7===0 && x.inv===0 && px.seventh)){ const pcs=new Set(v.map(m=>mod(m,12))); if(pcs.size<3) fail(k+'-incompleteTriad', v); }
    if([0,7].includes(mod(v[3]-v[0],12)) && Math.sign(v[0]-p[0])===Math.sign(v[3]-p[3]) && v[0]!==p[0] && Math.abs(v[3]-p[3])>2) fail(k+'-direct', p+' -> '+v);
    if(v[1]>=p[2]||v[2]<=p[1]||v[2]>=p[3]||v[3]<=p[2]) fail(k+'-overlap', p+' -> '+v);
    const dom = px.x%7===4||px.x%7===6, tonicPc = mod(c.ltPc+1,12);
    if(dom && x.x%7!==4 && v.some(m=>mod(m,12)===tonicPc)) for(let j=1;j<4;j++) if(mod(p[j],12)===c.ltPc && v[j]-p[j]!==1) fail(k+'-LT', `voice ${j} ${p} -> ${v}`);
    if(px.seventh && x.x%7!==px.x%7) for(let j=1;j<4;j++) if(mod(p[j],12)===px.sPc && !(p[j]-v[j]>=1&&p[j]-v[j]<=2)) fail(k+'-7th', `voice ${j} ${p} -> ${v}`);
  });
} const fails={}; const fail=(t,m)=>{bad++; fails[t]=(fails[t]||0)+1; if(fails[t]<=3) console.log('FAIL',t,m);};
const INTN = {1:"Minor 2nd",2:"Major 2nd",3:"Minor 3rd",4:"Major 3rd",5:"Perfect 4th",6:"Tritone (A4 / d5)",7:"Perfect 5th",8:"Minor 6th",9:"Major 6th",10:"Minor 7th",11:"Major 7th",12:"Perfect octave"};
const triQ = (a,b)=> a===4&&b===7?"major":a===3&&b===7?"minor":a===3&&b===6?"diminished":a===4&&b===8?"augmented":"?";
const sevQ = ms => { const [r,t,f,s]=ms.map(x=>x-ms[0]); const q=triQ(t,f); return q==="major"&&s===11?"MM7":q==="major"&&s===10?"Mm7":q==="minor"&&s===10?"mm7":q==="diminished"&&s===10?"hd7":q==="diminished"&&s===9?"fd7":"?"; };
const SEVN = {MM7:"Major 7th (MM7)",Mm7:"Dominant 7th (Mm7)",mm7:"Minor 7th (mm7)",hd7:"Half-diminished 7th (ø7)",fd7:"Fully diminished 7th (°7)"};
// pitches heard in each chord of a progression (grouped by start time)
const chordsOf = ev => { const g={}; ev.forEach(e=>{(g[e.t.toFixed(3)]=g[e.t.toFixed(3)]||[]).push(e.midi)}); return Object.keys(g).sort((a,b)=>a-b).map(k=>g[k].sort((a,b)=>a-b)); };
const mod=(a,m)=>((a%m)+m)%m;
for(let lvl=1; lvl<=4; lvl++) for(let rep=0; rep<300; rep++) for(const kind of ["listen","staff"]){
  const items = MUSIC.make(kind, lvl, 10, "theory");
  for(const it of items){ n++;
    const k = it.media.kind, c = it._check || it.media._check || {};
    if(!it.q || !it.a) fail(k, 'empty');
    const notes = (it.media.notes || (it.media.staff||{}).notes || []).filter(x=>!x.bar);
    const keys = notes.flatMap(x=>x.keys||[]).map(parse);
    if(keys.some(p=>p.d<14 || p.d>42)) fail(k, 'staff range '+JSON.stringify(notes));
    switch(k){
      case "intervalBasic": case "intervalAll": case "intervalAP":
        if(k==="intervalAP" && Math.abs(it.media.events[1].midi-it.media.events[0].midi)===12) fail(k,'octave at Theory 4');
        if(kind==="listen"){ const ev=it.media.events; const s=Math.abs(ev[1].midi-ev[0].midi); if(INTN[s]!==it.a) fail(k, s+' '+it.a); }
        else { const [lo,hi]=keys; const s=hi.midi-lo.midi, g=hi.d-lo.d+1;
          const nm = {"2,1":"Minor 2nd","2,2":"Major 2nd","3,3":"Minor 3rd","3,4":"Major 3rd","4,5":"Perfect 4th","4,6":"Augmented 4th","5,6":"Diminished 5th","5,7":"Perfect 5th","6,8":"Minor 6th","6,9":"Major 6th","7,10":"Minor 7th","7,11":"Major 7th"}[g+','+s];
          if(nm!==it.a) fail(k, `${g},${s} ${it.a}`); }
        break;
      case "triadQualityEar": { const ch=it.media.events.slice(0,3).map(e=>e.midi); const q=triQ(ch[1]-ch[0],ch[2]-ch[0]); if(q[0].toUpperCase()+q.slice(1)!==it.a) fail(k,it.a); break; }
      case "seventhEar": { const ch=it.media.events.slice(0,4).map(e=>e.midi); if(SEVN[sevQ(ch)]!==it.a) fail(k,it.a); break; }
      case "triadInversionEar": { const ch=it.media.events.slice(it.media.events.length/2).map(e=>e.midi).sort((a,b)=>a-b); const bass=mod(ch[0],12), root=c.rootPc;
        const third = mod(root+(c.q==="major"?4:3),12), fifth=mod(root+7,12); const inv = bass===root?0:bass===third?1:bass===fifth?2:-1;
        if(["Root position","First inversion (6)","Second inversion (6/4)"][inv]!==it.a) fail(k, inv+' '+it.a); break; }
      case "scaleType2": case "scaleType3": case "modeEar": {
        const ev=it.media.events, st=ev.map(e=>e.midi-ev[0].midi);
        const T={ "Major scale":[0,2,4,5,7,9,11,12],"Natural minor scale":[0,2,3,5,7,8,10,12],"Harmonic minor scale":[0,2,3,5,7,8,11,12],"Melodic minor (ascending) scale":[0,2,3,5,7,9,11,12],"Chromatic scale":[0,1,2,3,4,5,6,7,8,9,10,11,12],"Whole tone scale":[0,2,4,6,8,10,12],"Major pentatonic scale":[0,2,4,7,9,12],
          "Ionian (major)":[0,2,4,5,7,9,11,12],"Dorian":[0,2,3,5,7,9,10,12],"Phrygian":[0,1,3,5,7,8,10,12],"Lydian":[0,2,4,6,7,9,11,12],"Mixolydian":[0,2,4,5,7,9,10,12],"Aeolian (natural minor)":[0,2,3,5,7,8,10,12]}[it.a];
        if(!T || JSON.stringify(st.slice(0,T.length))!==JSON.stringify(T)) fail(k, it.a+' '+st); break; }
      case "meterSimpleCompound": case "meterFull": {
        const cl=it.media.clicks; const per = cl.findIndex((x,i)=>i>0&&x.accent===2); const beats = cl.slice(0,per).filter(x=>x.accent>=1).length; const sub=per/beats;
        const nm = (sub===2?"Simple ":"Compound ")+({2:"duple",3:"triple",4:"quadruple"}[beats]); if(!it.a.startsWith(nm)) fail(k, nm+' vs '+it.a); break; }
      case "cadenceBasic": case "cadence3": case "cadenceAP": {
        const ch=chordsOf(it.media.events); const last=ch[ch.length-1], pen=ch[ch.length-2];
        // identify each heard chord's root degree relative to the key tonic
        const ton = mod(c.ltPc+1,12);
        const degOf = chord => { // find root among pitch classes: the pc that has a 3rd and 5th above in the chord
          const pcs=[...new Set(chord.map(m=>mod(m,12)))];
          for(const r of pcs){ if(pcs.includes(mod(r+4,12)) && pcs.includes(mod(r+10,12))) return mod(r-ton,12); }   // dominant 7th (5th may be omitted)
          for(const r of pcs){ if(pcs.includes(mod(r+3,12))||pcs.includes(mod(r+4,12))) if(pcs.includes(mod(r+7,12))||pcs.includes(mod(r+6,12))) return mod(r-ton,12);}
          for(const r of pcs){ if(pcs.length===2 && (pcs.includes(mod(r+3,12))||pcs.includes(mod(r+4,12)))) return mod(r-ton,12); } return null; };   // incomplete (no 5th): root + 3rd
        const dl=degOf(last), dp=degOf(pen), bassL=mod(last[0]-ton,12), bassP=mod(pen[0]-ton,12), sopL=mod(last[last.length-1]-ton,12);
        let actual;
        if(c.minor){ actual = (dl===7 && dp===5 && bassP===8) ? "phrygian" : "?"; }
        else if(dl===7) actual="half";
        else if(dl===9 && dp===7) actual="deceptive";
        else if(dl===0 && dp===7) actual = (bassL===0 && bassP===7) ? (sopL===0 ? "pac" : "iac") : "iac";
        else if(dl===0 && dp===5) actual="plagal";
        const want={ "Authentic cadence (V–I)":["pac","iac"], "Perfect authentic cadence (PAC)":["pac"], "Imperfect authentic cadence (IAC)":["iac"], "Half cadence (ends on V)":["half"], "Plagal cadence (IV–I)":["plagal"], "Deceptive cadence (V–vi)":["deceptive"], "Phrygian half cadence (iv6–V in minor)":["phrygian"] }[it.a];
        if(!want || !want.includes(actual)) fail(k, `${it.a} heard=${actual} dl=${dl} dp=${dp}`);
        // voice-leading sanity: 4 voices, bass lowest, upper within an octave
        voiceLeading(k, c); stats.leadins.add(c.chords.slice(0,-2).map(x=>x.x+':'+x.inv).join(' ')); if(c.chords.some(x=>x.inv===2&&x.x===0)) stats.cad64++; if(c.chords.some(x=>x.seventh)) stats.v7++;
        ch.forEach(cc=>{ if(cc.length!==4) fail(k,'voicing '+cc); });
        for(let q=1;q<ch.length;q++){ const a=ch[q-1], b=ch[q]; for(let i=0;i<4;i++) for(let j=i+1;j<4;j++){ const i1=mod(a[j]-a[i],12), i2=mod(b[j]-b[i],12);
          if(((i1===7&&i2===7)||(i1===0&&i2===0)) && a[i]!==b[i] && Math.sign(b[i]-a[i])===Math.sign(b[j]-a[j])) fail(k+'-parallels', `${a} -> ${b}`); } }
        // every chord complete (has its 3rd)
        ch.forEach(cc=>{ const pcs=new Set(cc.map(m=>mod(m,12))); if(pcs.size<2) fail(k+'-incomplete', cc); });
        // a 5th may be left out, but never the 3rd: every chord needs a pair of pcs a 3rd apart
        ch.forEach(cc=>{ const pcs=[...new Set(cc.map(m=>mod(m,12)))]; if(!pcs.some(a=>pcs.some(b=>[3,4].includes(mod(b-a,12))))) fail(k+'-no3rd', cc); });
        break; }
      case "progressionChord": { voiceLeading(k, c); const ch=chordsOf(it.media.events); const ton=mod(ch[0][0],12);
        const pos = it.q.split(":")[1].split("–").findIndex(s=>s.includes("?")); const cc=[...new Set(ch[pos].map(m=>mod(m-ton,12)))].sort((a,b)=>a-b);
        const NUM={"2,5,9":"ii","0,5,9":"IV","0,4,9":"vi"}; const got = NUM[cc.join(",")]; if(got!==it.a) fail(k, cc+' '+it.a); break; }
      case "scaleDegreeEnd": { const ev=it.media.events; const ton=mod(ev[0].midi,12); const last=ev[ev.length-1].midi; const deg=[0,2,4,5,7,9,11].indexOf(mod(last-ton,12));
        if(!it.a.startsWith(String(deg+1)+" ")) fail(k, deg+' '+it.a); break; }
      case "errorDetect2": case "errorDetect3": case "errorDetect4": {
        const st=it.media.staff; const ks=sigN[st.keySig]; const written=st.notes.filter(x=>!x.bar).map(x=>parse(x.keys[0])).map(p=>12*(Math.floor(p.d/7)+1)+PC[p.L]+sigAcc(p.L,ks));
        const heard=it.media.events.filter(e=>e.t>=1.3).map(e=>e.midi);
        const diff=written.map((w,i)=>w!==heard[i]?i:-1).filter(i=>i>=0);
        if(diff.length!==1 || !it.a.startsWith(`Note ${diff[0]+1} `)) fail(k, diff+' '+it.a);
        else if((heard[diff[0]]>written[diff[0]]) !== it.a.includes("higher")) fail(k,'dir '+it.a);
        break; }
      case "keyMajorMinor": { const m={0:"C major or A minor",1:"G major or E minor",2:"D major or B minor",3:"A major or F♯ minor",4:"E major or C♯ minor","-1":"F major or D minor","-2":"B♭ major or G minor","-3":"E♭ major or C minor","-4":"A♭ major or F minor"}[sigN[it.media.keySig]]; if(m!==it.a) fail(k,it.a); break; }
      case "triadQuality": case "triadQuality2": { const [r,t,f]=keys; const q=triQ(t.midi-r.midi,f.midi-r.midi); if(!it.a.toLowerCase().startsWith(q) || t.d-r.d!==2 || f.d-r.d!==4) fail(k,it.a);
        if(k==="triadQuality2" && !["major","minor"].includes(q)) fail(k,'Theory 2 should be major/minor only'); break; }
      case "triadQualityEar2": { const ch=it.media.events.slice(0,3).map(e=>e.midi); const q=triQ(ch[1]-ch[0],ch[2]-ch[0]); if(q[0].toUpperCase()+q.slice(1)!==it.a || !["major","minor"].includes(q)) fail(k,it.a); break; }
      case "timeSigType2": { if(!["2/4","3/4","4/4","2/2","6/8"].includes(it.media.timeSig)) fail(k, it.media.timeSig); break; }
      case "seventhChord": { const ms=keys.map(p=>p.midi); const q=sevQ(ms); if(!it.a.includes("("+SEVN[q].match(/\((.*)\)/)[1]+")") || keys[1].d-keys[0].d!==2 || keys[3].d-keys[0].d!==6) fail(k,it.a); break; }
      case "triadInversion": stats.inv[k+'@'+lvl]=(stats.inv[k+'@'+lvl]||new Set()); { const ms=keys.map(p=>p.midi); const rootPc=mod(c.rootMidi,12); stats.inv[k+'@'+lvl].add(mod(ms[0]-rootPc,12)); }
      { const ms=keys.map(p=>p.midi); const rootPc=mod(c.rootMidi,12); const inv = mod(ms[0],12)===rootPc?0:mod(ms[0]-rootPc,12)<=4?1:2;
        if(!it.a.includes(["root position","first inversion","second inversion"][inv])) fail(k,inv+' '+it.a); break; }
      case "timeSigType": { const ts=it.media.timeSig; const [top]=ts.split("/").map(Number); const comp = top%3===0 && top>3 && ts!=="3/4"&&ts!=="3/8"? true:false;
        const beats = comp ? top/3 : top; const nm=(comp?"Compound ":"Simple ")+({2:"duple",3:"triple",4:"quadruple"}[beats]); if(!it.a.startsWith(nm)) fail(k, ts+' '+it.a); break; }
      case "scaleDegreeName": { const ks=sigN[it.media.keySig]; const p=keys[0]; const midi=12*(Math.floor(p.d/7)+1)+PC[p.L]+sigAcc(p.L,ks);
        const ton = {C:0,G:7,D:2,A:9,E:4,F:5,Bb:10,Eb:3,Ab:8}[it.media.keySig]; const deg=[0,2,4,5,7,9,11].indexOf(mod(midi-ton,12));
        if(!it.a.endsWith(`(${deg+1})`)) fail(k, deg+' '+it.a); break; }
      case "romanMajor": case "romanMinor": case "romanInversion": {
        if(k==="romanInversion"){ stats.rinv[c.inv]=(stats.rinv[c.inv]||0)+1; }
        const ks=sigN[it.media.keySig]; const acc=notes[0].acc;
        const ms=keys.map((p,i)=>{ const a = acc[i]; const sa = a==="#"?1:a==="b"?-1:a==="n"?0:a==="##"?2:sigAcc(p.L,ks); return 12*(Math.floor(p.d/7)+1)+PC[p.L]+sa; });
        const majT = {C:0,G:7,D:2,A:9,E:4,F:5,Bb:10,Eb:3,Ab:8}[it.media.keySig]; const minor = /minor/.test(it.q) || it.q.includes(" minor."); const ton = minor ? mod(majT+9,12) : majT;
        // find the root: the pc whose stack of 3rds covers the chord
        const pcs=ms.map(m=>mod(m,12)); let root=null, quality=null;
        // root = the note whose LETTER has the others a 3rd, 5th (and 7th) above it (spelling, like a student would)
        const lets = keys.map(p=>p.d%7); const ri_ = lets.findIndex(L0=>lets.every(L1=>[0,2,4,6].includes(mod(L1-L0,7))));
        const rootPcs = ri_>=0 ? [pcs[ri_]] : pcs;
        for(const r of rootPcs){ const rel=pcs.map(p=>mod(p-r,12)).sort((a,b)=>a-b); const s=rel.join(",");
          const map={"0,4,7":"M","0,3,7":"m","0,3,6":"d","0,4,8":"A","0,4,7,10":"Mm7","0,3,7,10":"mm7","0,3,6,10":"hd7","0,3,6,9":"fd7","0,4,7,11":"MM7"};
          if(map[s]){ root=r; quality=map[s]; break; } }
        const degs = minor ? {0:0,2:1,3:2,5:3,7:4,8:5,10:6,11:6} : {0:0,2:1,4:2,5:3,7:4,9:5,11:6};
        const x = degs[mod(root-ton,12)]; const R=["I","II","III","IV","V","VI","VII"][x];
        const base = quality==="M"||quality==="Mm7"||quality==="MM7" ? R : quality==="A" ? R+"+" : quality==="d" ? R.toLowerCase()+"°" : quality==="hd7" ? R.toLowerCase()+"ø" : quality==="fd7" ? R.toLowerCase()+"°" : R.toLowerCase();
        const bassRel = mod(pcs[0]-root,12); const isSev = quality.length>1;
        const thirds = quality==="M"||quality==="Mm7"||quality==="MM7"||quality==="A" ? 4 : 3, fifthS = quality==="d"||quality==="hd7"||quality==="fd7" ? 6 : quality==="A" ? 8 : 7;
        const inv = bassRel===0?0: bassRel===thirds?1: bassRel===fifthS?2:3;
        const fig = isSev ? ["7","6/5","4/3","4/2"][inv] : ["","6","6/4"][inv];
        const want = base + fig;
        if(want!==it.a) fail(k, `want ${want} got ${it.a} key ${it.media.keySig} ${minor?'minor':''} ${ms}`);
        // the staff must not show an accidental the key signature already implies, and must show raised LT in minor V/vii
        break; }
      case "secondaryDominant": {
        const ks=sigN[it.media.keySig]; const acc=notes[0].acc;
        const ms=keys.map((p,i)=>{ const a=acc[i]; const sa = a==="#"?1:a==="b"?-1:a==="n"?0:sigAcc(p.L,ks); return 12*(Math.floor(p.d/7)+1)+PC[p.L]+sa; });
        const ton={C:0,G:7,D:2,A:9,E:4,F:5,Bb:10,Eb:3,Ab:8}[it.media.keySig];
        const rel=ms.map(m=>mod(m-ms[0],12)).sort((a,b)=>a-b).join(",");
        if(!(rel==="0,4,7"||rel==="0,4,7,10")) fail(k,'not a dominant '+rel);
        const targetPc = mod(ms[0]-7,12); const tdeg = {2:"ii",5:"IV",7:"V",9:"vi"}[mod(targetPc-ton,12)];
        const want = (rel.length>5?"V7":"V")+"/"+tdeg; if(want!==it.a) fail(k, want+' '+it.a);
        // it must actually be chromatic (not just a diatonic chord)
        if(!acc.some(a=>a)) fail(k,'no accidental shown '+it.a);
        break; }
      case "parallels": {
        const [a,b]=notes.map(x=>x.keys.map(parse)); const s1=a[1].midi-a[0].midi, s2=b[1].midi-b[0].midi;
        const same = Math.sign(b[0].midi-a[0].midi)===Math.sign(b[1].midi-a[1].midi) && b[0].midi!==a[0].midi;
        const actual = same && s1===7&&s2===7 ? "Parallel 5ths" : same && s1===12&&s2===12 ? "Parallel octaves" : "No error";
        if(actual!==it.a) fail(k, `${s1}->${s2} ${it.a}`); break; }
    }
  }
}
for(const [kk,v] of Object.entries(stats.inv)) if(v.size<3) fail('triadInversion-variety', kk+' only '+[...v]);
if(Object.keys(stats.rinv).length<4) fail('romanInversion-variety', JSON.stringify(stats.rinv));
console.log('cadence lead-in patterns:', stats.leadins.size, '| with cadential 6/4:', stats.cad64, '| with V7:', stats.v7, '| romanInversion inversions:', JSON.stringify(stats.rinv));
console.log('checked', n, 'generated theory questions; failures:', bad, JSON.stringify(fails));
for(let l=1;l<=4;l++){ console.log('--- Theory', l); for(const kind of ["listen","staff"]) MUSIC.make(kind,l,8,"theory").forEach(x=>console.log('  ', kind, x.media.kind, '|', x.q, '→', x.a)); }
