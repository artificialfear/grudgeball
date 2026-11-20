// Every listening (🎧) question, both tracks, every level: recompute the answer from the notes/clicks
// that are actually PLAYED and compare it with the answer the host sees.
// Run:  node tests/listening_audit.js
global.window = {};
const MUSIC = require('../src/music.js'); global.MUSIC = MUSIC;
require('../src/theory.js');
const mod = (a, n) => ((a % n) + n) % n;
let bad = 0, n = 0; const seen = {};
const fail = (k, msg, it) => { bad++; if(bad <= 30) console.log('FAIL', k, '|', msg, '|', it.q, '→', it.a); };

const INTN = {1:"Minor 2nd",2:"Major 2nd",3:"Minor 3rd",4:"Major 3rd",5:"Perfect 4th",6:"Tritone (A4 / d5)",7:"Perfect 5th",8:"Minor 6th",9:"Major 6th",10:"Minor 7th",11:"Major 7th",12:"Perfect octave"};
const GEN = {1:"A 2nd",2:"A 2nd",3:"A 3rd",4:"A 3rd",5:"A 4th",6:"?",7:"A 5th",8:"A 6th",9:"A 6th",10:"A 7th",11:"A 7th",12:"An octave"};
// the answer choices named in the question must include the right answer
const offered = (q, a) => {
  const m = /:\s*([^:]+?)\?\s*$/.exec(q); if(!m) return true;
  const list = m[1].split(/,\s*|\s+or\s+/).map(x=>x.trim().toLowerCase().replace(/^an? /, ""));
  const ab = (/\(([^)]+)\)/.exec(a)||[])[1];          // "Perfect authentic cadence (PAC)" -> "PAC"
  const want = [a, ab].filter(Boolean).map(x=>x.toLowerCase().replace(/^an? /, "").replace(/ \(.*$/, "").replace(/ (scale|cadence)$/, ""));
  return list.some(c => want.some(w => c===w || c.startsWith(w+" ") || w.startsWith(c+" ") || c===w.split(" ")[0]));
};
const triQ = (a, b) => a===4&&b===7 ? "major" : a===3&&b===7 ? "minor" : a===3&&b===6 ? "diminished" : a===4&&b===8 ? "augmented" : "?";

for(const track of ["band", "theory"]) for(let lvl = 1; lvl <= 4; lvl++) for(let rep = 0; rep < 60; rep++){
  for(const it of MUSIC.make("listen", lvl, 12, track)){
    n++; const k = it.media.kind, ev = it.media.events || [], cl = it.media.clicks || [];
    seen[k] = (seen[k]||0) + 1;
    if(!it.q || !it.a) fail(k, 'empty', it);
    if(ev.some(e => e.midi < 36 || e.midi > 90)) fail(k, 'out of range', it);
    const iv = ev.length >= 2 ? ev[1].midi - ev[0].midi : 0;
    switch(k){
      case "genericIntervalEar":
        if(GEN[Math.abs(iv)] !== it.a) fail(k, `played ${iv} half steps`, it);
        if(!/2nd|3rd|5th|octave/.test(it.a)) fail(k, 'answer not one of the 4 named choices', it);
        break;
      case "qualityIntervalEar": case "intervalBasic": case "intervalAll": case "intervalAP":
        if(INTN[Math.abs(iv)] !== it.a) fail(k, `played ${iv} half steps`, it); break;
      case "highLow": if((iv > 0) !== (it.a === "The second note") || iv === 0) fail(k, iv, it); break;
      case "sameDiff": if((iv === 0) !== (it.a === "The same")) fail(k, iv, it); break;
      case "upDown": { const up = ev[ev.length-1].midi > ev[0].midi; if(up !== (it.a === "Up")) fail(k, 'direction', it); break; }
      case "stepsSkips": { const mv = ev.slice(1).map((e,i)=>Math.abs(e.midi-ev[i].midi)); const steps = mv.filter(x=>x<=2).length > mv.length/2;
        if(steps !== (it.a === "Steps")) fail(k, mv, it); break; }
      case "majorMinorChord": case "triadQualityEar2": case "triadQualityEar": { const q = triQ(ev[1].midi-ev[0].midi, ev[2].midi-ev[0].midi);
        if(q.toLowerCase() !== it.a.toLowerCase()) fail(k, q, it); break; }
      case "chordQuality": { const q = triQ(ev[1].midi-ev[0].midi, ev[2].midi-ev[0].midi); if(q !== it.a.toLowerCase()) fail(k, q, it); break; }
      case "fastSlow": { const gap = cl[1].t - cl[0].t, fast = gap < 0.5; if(fast !== it.a.startsWith("Fast")) fail(k, gap, it); break; }
      case "crescDecresc": { const up = ev[ev.length-1].vel > ev[0].vel; if(up !== it.a.startsWith("Cresc")) fail(k, 'dynamics', it); break; }
      case "articulation": { const stac = ev[0].dur < (ev[1].t - ev[0].t) * 0.5; if(stac !== it.a.startsWith("Stacc")) fail(k, 'length', it); break; }
      case "accelRit": { const g1 = cl[1].t-cl[0].t, g2 = cl[cl.length-1].t-cl[cl.length-2].t; if((g2 < g1) !== it.a.startsWith("Accel")) fail(k, 'tempo', it); break; }
      case "meter": { const per = cl.findIndex((c,i)=>i>0 && c.accent); if(String(per) !== it.a[0]) fail(k, per, it); break; }
      case "scaleMajorMinor": { const st = ev.map(e=>e.midi-ev[0].midi);
        const t = st.length===13 ? "Chromatic scale" : st[2]===4 && st[5]===9 && st[6]===11 ? "Major scale" : st[2]===3 && st[5]===8 && st[6]===10 ? "Minor scale" : "?";
        if(t !== it.a) fail(k, st, it); break; }
      case "scaleDegreeEnd": { const c = it._check, deg = mod(c.lastMidi - c.tonicMidi, 12);
        const MAJ = [0,2,4,5,7,9,11]; if(MAJ.indexOf(deg) + 1 !== parseInt(it.a)) fail(k, deg, it);
        if(ev[ev.length-1].midi !== c.lastMidi) fail(k, 'last note played is not the checked note', it); break; }
      case "errorDetect2": case "errorDetect3": case "errorDetect4": { const c = it._check; const diffs = c.writtenMidi.map((m,i)=>m!==c.heardMidi[i] ? i : -1).filter(i=>i>=0);
        const playedMel = ev.slice(ev.length - c.heardMidi.length).map(e=>e.midi);
        if(diffs.length !== 1 || !it.a.startsWith(`Note ${diffs[0]+1} `) || JSON.stringify(playedMel) !== JSON.stringify(c.heardMidi)) fail(k, diffs, it);
        const hi = c.heardMidi[diffs[0]] > c.writtenMidi[diffs[0]]; if(hi !== it.a.includes("higher")) fail(k, 'higher/lower', it); break; }
      default: break;   // cadences, progressions, inversions, sevenths, modes, meters: covered by tests/theory_check.js
    }
    if(!offered(it.q, it.a)) fail(k, 'right answer is not among the choices the question names', it);
  }
}
console.log(`listening audit: ${n} questions, ${Object.keys(seen).length} types, failures: ${bad}`);
console.log(Object.entries(seen).map(([k,v])=>`${k}:${v}`).join("  "));
process.exit(bad ? 1 : 0);
