const M = require('../src/music.js'); const T = M._test;
let bad = 0; const fail = (m)=>{bad++; console.log("FAIL", m);};
const PCN = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const LET="CDEFGAB";
// parse vf key "f#/4"
function parse(k){ const [n,o]=k.split("/"); const L=n[0].toUpperCase(); const acc = n.slice(1)==="#"?1:n.slice(1)==="b"?-1:0; return {L, acc, oct:+o, midi:12*(+o+1)+PCN[L]+acc, d:+o*7+LET.indexOf(L)}; }
const semisName = {"Major 2nd":[2,2],"Minor 3rd":[3,3],"Major 3rd":[3,4],"Perfect 4th":[4,5],"Perfect 5th":[5,7],"Major 6th":[6,9],"Perfect octave":[8,12]};
const keySig = {C:[0,"A minor"],F:[-1,"D minor"],Bb:[-2,"G minor"],Eb:[-3,"C minor"],Ab:[-4,"F minor"],G:[1,"E minor"],D:[2,"B minor"],A:[3,"F♯ minor"],E:[4,"C♯ minor"]};
for(let lvl=1;lvl<=4;lvl++) for(let rep=0;rep<400;rep++){
  for(const kind of ["staff","listen"]) for(const it of M.make(kind,lvl,4)){
    const m = it.media, k = m.kind;
    if(!it.q||!it.a) fail("empty "+k);
    if(kind==="staff"){
      const keys=(m.notes||[]).flatMap(n=>n.keys).map(parse);
      if(k==="noteName"){ const p=keys[0]; const exp=p.L+(p.acc===1?"♯":p.acc===-1?"♭":""); if(it.a!==exp) fail(`noteName ${JSON.stringify(m.notes)} -> ${it.a}`);
        const r = m.clef==="treble"?[28,41]:[14,28]; if(p.d<r[0]||p.d>r[1]) fail("range "+p.d+m.clef);
        if(lvl===1 && (p.acc!==0 || (m.clef==="treble"?(p.d<30||p.d>38):(p.d<18||p.d>26)))) fail("lvl1 note outside staff"); }
      if(k==="genericInterval"){ const g = keys[keys.length-1].d-keys[0].d+1; const exp = g===8?"An octave":"A "+({2:"2nd",3:"3rd",4:"4th",5:"5th",6:"6th"})[g]; if(it.a!==exp) fail("generic "+it.a+" "+g); }
      if(k==="qualityInterval"){ const [lo,hi]=keys; const [g,s]=semisName[it.a]; if(hi.d-lo.d+1!==g||hi.midi-lo.midi!==s) fail(`quality ${it.a} ${JSON.stringify(keys)}`); }
      if(k==="triad"){ const [r,t,f]=keys; const minor=it.a.endsWith("minor"); if(t.d-r.d!==2||f.d-r.d!==4||t.midi-r.midi!==(minor?3:4)||f.midi-r.midi!==7) fail("triad "+it.a);
        const nm=r.L+(r.acc===1?"♯":r.acc===-1?"♭":""); if(!it.a.startsWith(nm+" ")) fail("triad name "+it.a); }
      if(k==="keyName"||k==="countKeySig"){ const [n,rel]=keySig[m.keySig]; if(k==="countKeySig"&&it.a!==String(Math.abs(n))) fail("count");
        if(k==="keyName"){ const disp = m.keySig.replace("b","♭")+" major"; if(!(it.a===disp || it.a===`${rel} (relative of ${disp})`)) fail("keyName "+m.keySig+" "+it.a);} }
      if(k==="beats"){ const B={w:4,h:2,hd:3,q:1,qd:1.5,"8":.5,"16":.25,qr:1,hr:2}; const tot=m.notes.reduce((s,n)=>s+B[n.dur],0); if(it.a!==tot+" beats") fail("beats "+tot+" "+it.a); }
    } else {
      const ev=m.events, cl=m.clicks;
      if(k==="highLow"){ if((ev[1].midi>ev[0].midi)!==(it.a==="The second note")) fail("highlow"); }
      if(k==="majorMinorChord"){ const iv=ev[1].midi-ev[0].midi; if((iv===3)!==(it.a==="Minor")) fail("mm"); }
      if(k==="chordQuality"){ const a=ev[1].midi-ev[0].midi,b=ev[2].midi-ev[0].midi; const q=a===4?"Major":b===7?"Minor":"Diminished"; if(q!==it.a) fail("cq"); }
      if(k==="qualityIntervalEar"){ if(ev[1].midi-ev[0].midi!==semisName[it.a][1]) fail("qie"); }
      if(k==="meter"){ const per = cl.findIndex((c,i)=>i>0&&c.accent); if(String(per)!==it.a[0]) fail("meter"); }
      if(k==="scaleMajorMinor"){ const st=ev.map(e=>e.midi-ev[0].midi); const t = st.length===13?"Chromatic scale":st[2]===4?"Major scale":"Minor scale"; if(t!==it.a) fail("scale"); }
      if(ev.some(e=>e.midi<36||e.midi>90)) fail("midi range "+k);
    }
  }
}
console.log("theory checks done, failures:", bad);
for(let l=1;l<=4;l++){ console.log("L"+l); [...M.make("staff",l,3),...M.make("listen",l,3)].forEach(x=>console.log("  ",x.media.kind,"|",x.q,"→",x.a)); }
