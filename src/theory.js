/* ============================================================
   THEORY TRACK — generated ear-training and staff questions, Theory 1–4.
   Theory 4 follows AP Music Theory aural/written skills.
   Every chord, interval and Roman numeral is SPELLED note by note and its answer is
   DERIVED from those notes (never typed by hand), so the answer always matches what is shown/played.
============================================================ */
(function(){
  if(typeof MUSIC==="undefined") return;
  const K = MUSIC.kit, { rnd, ri, shuffle, LET, nameOf, midiOf, vfKey, dLetter, spellAbove, KEYS, seq, block, lis } = K;
  const ROMAN = ["I","II","III","IV","V","VI","VII"];
  const SOLF = ["do","re","mi","fa","sol","la","ti"];
  const DEGREE_NAMES = ["Tonic","Supertonic","Mediant","Subdominant","Dominant","Submediant","Leading tone"];
  const SHARP_ORDER = "FCGDAEB", FLAT_ORDER = "BEADGCF";
  const ACC_CODE = {"-2":"bb","-1":"b","0":"n","1":"#","2":"##"};
  const sigAcc = (letter, n) => n>0 && SHARP_ORDER.slice(0,n).includes(letter) ? 1 : n<0 && FLAT_ORDER.slice(0,-n).includes(letter) ? -1 : 0;
  const mod = (a, m) => ((a % m) + m) % m;

  /* ---------- keys: spell any scale degree in a major or (harmonic/natural) minor key ---------- */
  function keyOf(k, minor){
    // k: a KEYS entry (major key + its signature). minor = the relative minor of that signature.
    const tl = k.vf[0];
    let tonicD = 28 + LET.indexOf(tl);           // tonic letter in octave 4
    if(minor) tonicD += 5;                         // relative minor = 6th degree
    if(tonicD > 33) tonicD -= 7;                   // keep the tonic around C4–A4
    const name = minor ? k.rel : k.name;
    // degree x (0-based; may be negative or > 6). raiseLT: harmonic-minor leading tone (degree 7)
    function deg(x, raiseLT){
      const d = tonicD + x, L = dLetter(d); let acc = sigAcc(L, k.n);
      if(minor && raiseLT && mod(x,7)===6) acc += 1;
      return {d, acc, midi:midiOf(d, acc), show: acc!==sigAcc(L, k.n) ? ACC_CODE[acc] : 0};
    }
    return { k, minor, name, sig:k.vf, n:k.n, tonicD, deg };
  }
  const majorKeys = maxAcc => KEYS.filter(k=>Math.abs(k.n)<=maxAcc);

  /* ---------- chord quality from real pitches ---------- */
  function triadQuality(r, t, f){ const a = t-r, b = f-r;
    return a===4&&b===7 ? "major" : a===3&&b===7 ? "minor" : a===3&&b===6 ? "diminished" : a===4&&b===8 ? "augmented" : "?"; }
  function seventhQuality(r, t, f, s){ const q = triadQuality(r,t,f), sv = s-r;
    return q==="major"&&sv===11 ? "MM7" : q==="major"&&sv===10 ? "Mm7" : q==="minor"&&sv===10 ? "mm7" : q==="diminished"&&sv===10 ? "hd7" : q==="diminished"&&sv===9 ? "fd7" : "?"; }
  const SEVENTH_NAMES = { MM7:"Major 7th (MM7)", Mm7:"Dominant 7th (Mm7)", mm7:"Minor 7th (mm7)", hd7:"Half-diminished 7th (ø7)", fd7:"Fully diminished 7th (°7)" };
  const FIG_TRIAD = ["", "6", "6/4"], FIG_SEV = ["7", "6/5", "4/3", "4/2"];
  // Roman numeral for scale degree x whose (ascending, root-first) pitches are ms
  function romanOf(x, ms, inv){
    const base = ROMAN[mod(x,7)];
    if(ms.length===3){
      const q = triadQuality(ms[0], ms[1], ms[2]);
      const r = q==="major" ? base : q==="minor" ? base.toLowerCase() : q==="diminished" ? base.toLowerCase()+"°" : base+"+";
      return r + FIG_TRIAD[inv||0];
    }
    const q = seventhQuality(ms[0], ms[1], ms[2], ms[3]);
    const r = q==="Mm7"||q==="MM7" ? base : q==="mm7" ? base.toLowerCase() : q==="hd7" ? base.toLowerCase()+"ø" : base.toLowerCase()+"°";
    const fig = FIG_SEV[inv||0];
    return q==="MM7" ? r + "M" + fig.replace(/^7$/, "7") : r + fig;
  }
  // order chord tones for the staff: chosen tone in the bass, the rest stacked above it (close)
  function stackFrom(tones, inv){
    const out = []; let prevD = -Infinity;
    for(let i=0;i<tones.length;i++){
      const t = Object.assign({}, tones[(inv+i) % tones.length]);
      while(t.d <= prevD){ t.d += 7; t.midi += 12; }
      out.push(t); prevD = t.d;
    }
    return out;
  }
  const keysOf = tones => tones.map(t=>vfKey(t.d, t.acc));
  const inRange = (tones, lo=26, hi=40) => tones.every(t=>t.d>=lo && t.d<=hi);
  // drop a chord an octave if it sits too high on the treble staff
  const fitRange = st => (Math.max(...st.map(t=>t.d))>40 && Math.min(...st.map(t=>t.d))-7>=26) ? st.map(t=>({...t, d:t.d-7, midi:t.midi-12})) : st;

  /* ---------- 4-part (SATB) voicing with common-practice voice leading (audio for progressions) ----------
     Hard rules: no parallel 5ths/octaves (any pair), no direct 5ths/8ves in the outer voices with a soprano leap,
     no voice crossing/overlap, spacing ≤ an octave between upper voices, SATB ranges, never double the leading tone,
     the leading tone resolves UP to tonic (V/vii° → I or vi), the chordal 7th resolves DOWN by step.
     Preferences (cost): small motion, double the root (3rd in vi after V), complete chords. */
  const RANGES = { b:[40,60], t:[48,67], a:[55,74], s:[60,79] };
  function voiceChord(KEY, c, tones, prev, topPc){
    const pcs = tones.map(t=>mod(t.midi,12)), inv = c.inv||0, bassPc = pcs[inv];
    const [rPc, tPc, fPc, sPc] = pcs;
    const ltPc = mod(KEY.deg(6, true).midi, 12), tonicPc = mod(KEY.deg(0).midi, 12);
    const prevDom = prev && (mod(prev.c.x,7)===4 || mod(prev.c.x,7)===6);
    const resolvesLT = prevDom && pcs.includes(tonicPc) && mod(c.x,7)!==4;
    // triads must be complete, except root-position I right after V7 (the textbook incomplete tonic)
    const mayOmit5 = pcs.length===3 && mod(c.x,7)===0 && inv===0 && prev && prev.c.seventh;
    const sub6Pc = mod(KEY.deg(5).midi, 12);
    const deceptive = prevDom && mod(c.x,7)===5;
    // upper-voice note sets (multisets)
    let sets;
    if(pcs.length===4){
      sets = [pcs.filter((p,i)=>i!==inv)];                       // complete
      if(inv===0) sets.push([rPc, tPc, sPc]);                     // root position: may omit the 5th (double the root)
    }else{
      sets = [[rPc,tPc,fPc],[rPc,tPc,rPc],[tPc,fPc,fPc],[rPc,fPc,rPc],[rPc,tPc,tPc],[tPc,fPc,tPc],[rPc,rPc,tPc]];
      sets = sets.filter(st=> st.includes(tPc) || bassPc===tPc);  // the 3rd must be somewhere
    }
    const perms = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
    const bassOpts = []; for(let b=RANGES.b[0]; b<=RANGES.b[1]-5; b++) if(mod(b,12)===bassPc) bassOpts.push(b);
    let best = null;
    for(const bass of bassOpts) for(const st of sets) for(const pm of perms){
      const want = pm.map(i=>st[i]);
      for(let t=RANGES.t[0]; t<=RANGES.t[1]; t++){ if(mod(t,12)!==want[0] || t<bass) continue;
      for(let a=t+1; a<=Math.min(t+12, RANGES.a[1]); a++){ if(mod(a,12)!==want[1] || a<RANGES.a[0]) continue;
      for(let so=a+1; so<=Math.min(a+12, RANGES.s[1]); so++){ if(mod(so,12)!==want[2] || so<RANGES.s[0]) continue;
        if(topPc!=null && mod(so,12)!==topPc) continue;
        const v = [bass, t, a, so], all = v.map(m=>mod(m,12));
        if(all.filter(p=>p===ltPc).length>1 && pcs.includes(ltPc)) continue;                 // never double the leading tone
        if(pcs.length===3 && !mayOmit5 && !pcs.every(p=>all.includes(p))) continue;            // complete triads
        let cost = 0;
        if(prev){
          const p = prev.v;
          let bad = false;
          for(let i=0;i<4 && !bad;i++) for(let j=i+1;j<4;j++){                                  // parallels
            const i1 = mod(p[j]-p[i],12), i2 = mod(v[j]-v[i],12);
            // parallel (or contrary "antiparallel") 5ths/octaves: a perfect 5th/8ve moving to the same interval in the same voices
            if((i1===7&&i2===7)||(i1===0&&i2===0)){ if(p[i]!==v[i] && p[j]!==v[j]){ bad = true; break; } }
          }
          if(bad) continue;
          // direct 5ths/8ves in the outer voices (soprano leaps into them in similar motion)
          if([0,7].includes(mod(so-bass,12)) && Math.sign(bass-p[0])===Math.sign(so-p[3]) && bass!==p[0] && Math.abs(so-p[3])>2) continue;
          // crossing / overlap with the previous chord
          if(t>=p[2] || a<=p[1] || a>=p[3] || so<=p[2]) continue;
          // leading tone up to tonic; chordal 7th down by step
          for(let i=1;i<4 && !bad;i++){
            if(resolvesLT && mod(p[i],12)===ltPc && v[i]-p[i]!==1) bad = true;
            if(prev.c.seventh && mod(p[i],12)===prev.sPc && !(p[i]-v[i]>=1 && p[i]-v[i]<=2) && mod(c.x,7)!==mod(prev.c.x,7)) bad = true;
            if(Math.abs(v[i]-p[i])>7) bad = true;                                             // no big leaps in upper voices
          }
          // melodic intervals in every voice: no tritone (A4/d5) leaps, no augmented 2nd (♭6–raised 7 in minor);
          // bass: no 7ths or leaps beyond an octave
          for(let i=0;i<4 && !bad;i++){
            const mv = Math.abs(v[i]-p[i]);
            if(mv===6) bad = true;
            if(KEY.minor && mv===3 && [mod(v[i],12), mod(p[i],12)].sort().join()===[sub6Pc, ltPc].sort().join()) bad = true;
          }
          const bm = Math.abs(bass-p[0]); if(bm===10 || bm===11 || bm>12) bad = true;
          if(bad) continue;
          cost += Math.abs(t-p[1]) + Math.abs(a-p[2]) + 1.3*Math.abs(so-p[3]) + 0.25*Math.abs(bass-p[0]);
        }else cost += Math.abs(so-72) + Math.abs(a-66) + Math.abs(t-59) + 0.5*Math.abs(bass-48);
        // doubling preferences
        const cnt = pc => all.filter(x=>x===pc).length;
        if(pcs.length===3){
          if(deceptive){ if(cnt(tPc)<2) cost += 4; }
          else if(inv===0){ if(cnt(tPc)>1) cost += 5; if(cnt(fPc)>1) cost += 2; if(!all.includes(fPc)) cost += 2; }
          else if(inv===1){ if(cnt(tPc)>1) cost += 3; }
        }else if(!all.includes(fPc)) cost += 1.5;
        if(!best || cost<best.cost) best = {cost, v};
      }}}
    }
    return best ? {bass:best.v[0], upper:best.v.slice(1), v:best.v, c, sPc} : null;
  }
  // chords: [{x (degree), inv, seventh, raise, top (degree of soprano, optional)}] in key KEY
  function progression(KEY, chords, step=0.95){
    const evs = []; let prev = null; const spelled = [];
    for(const [i,c] of chords.entries()){
      const n = c.seventh ? 4 : 3;
      const tones = Array.from({length:n}, (_,j)=>KEY.deg(c.x + 2*j, c.raise!==false));
      const v = voiceChord(KEY, c, tones, prev, c.top!=null ? mod(KEY.deg(c.top, true).midi,12) : null);
      if(!v) return null;
      v.sPc = n===4 ? mod(tones[3].midi,12) : null;
      evs.push({t:i*step, midi:v.bass, dur:step*0.92, vel:0.62});
      v.upper.forEach(m=>evs.push({t:i*step, midi:m, dur:step*0.92, vel:0.5}));
      prev = v; spelled.push({tones, voicing:v, c});
    }
    return {events:evs, spelled, end:chords.length*step};
  }

  /* =================== LISTENING =================== */
  const L = {};
  const B = K.band.L;
  const INT_ALL = [["Minor 2nd",1],["Major 2nd",2],["Minor 3rd",3],["Major 3rd",4],["Perfect 4th",5],["Tritone (A4 / d5)",6],["Perfect 5th",7],["Minor 6th",8],["Major 6th",9],["Minor 7th",10],["Major 7th",11],["Perfect octave",12]];
  const INT_BASIC = INT_ALL.filter(x=>[1,2,3,4,5,7,9,12].includes(x[1]));
  function intervalEar(list, dirs){
    const [name, semis] = rnd(list), dir = rnd(dirs), r = ri(55, 66);
    const lo = dir==="down" ? r+semis : r, hi = dir==="down" ? r : r+semis;
    const ev = dir==="harmonic" ? block([r, r+semis], 0, 1.8, 0.6).concat(block([r, r+semis], 2.1, 1.6, 0.6))
                                : seq([lo, hi], 0.85, 0.8).concat(seq([lo, hi], 0.85, 0.8).map(e=>({...e, t:e.t+2.1})));
    const how = dir==="harmonic" ? "played together" : dir==="down" ? "going down" : "going up";
    return Object.assign(lis(`Name this interval (${how}).`, name, ev), {_check:{semis, dir}});
  }
  L.intervalBasic = () => intervalEar(INT_BASIC, ["up","up","down","harmonic"]);
  L.intervalAll = () => intervalEar(INT_ALL, ["up","down","harmonic"]);
  // Theory 4: no octaves; extra weight on the intervals students confuse (2nds, 6ths, 7ths, tritone)
  const INT_AP = INT_ALL.filter(x=>x[1]!==12).concat(INT_ALL.filter(x=>[1,2,6,8,9,10,11].includes(x[1])));
  L.intervalAP = () => intervalEar(INT_AP, ["up","down","harmonic"]);
  const TRIADS = { major:[0,4,7], minor:[0,3,7], diminished:[0,3,6], augmented:[0,4,8] };
  L.triadQualityEar2 = () => { const q = rnd(["major","minor"]), r = ri(55,63), ch = TRIADS[q].map(x=>r+x);
    return Object.assign(lis("Is this triad MAJOR or MINOR?", q[0].toUpperCase()+q.slice(1), seq(ch,0.42,0.4).concat(block(ch,1.45,1.5))), {_check:{q, ch}}); };
  L.triadQualityEar = () => { const q = rnd(Object.keys(TRIADS)), r = ri(55,63), ch = TRIADS[q].map(x=>r+x);
    return Object.assign(lis("Is this triad MAJOR, MINOR, DIMINISHED or AUGMENTED?", q[0].toUpperCase()+q.slice(1), seq(ch,0.42,0.4).concat(block(ch,1.45,1.5))), {_check:{q, ch}}); };
  const SEVENTHS = { MM7:[0,4,7,11], Mm7:[0,4,7,10], mm7:[0,3,7,10], hd7:[0,3,6,10], fd7:[0,3,6,9] };
  L.seventhEar = () => { const q = rnd(Object.keys(SEVENTHS)), r = ri(53,60), ch = SEVENTHS[q].map(x=>r+x);
    return Object.assign(lis("Name this seventh chord: major 7th, dominant 7th, minor 7th, half-diminished or fully diminished?", SEVENTH_NAMES[q], seq(ch,0.4,0.38).concat(block(ch,1.75,1.6))), {_check:{q, ch}}); };
  L.triadInversionEar = () => { const q = rnd(["major","minor"]), inv = ri(0,2), r = ri(55,62), base = TRIADS[q].map(x=>r+x);
    const bass = base[inv] - 12, upper = [base[0]+12*(inv>0?1:0), base[1], base[2]].sort((a,b)=>a-b);
    const ch = [bass].concat(upper.filter(m=>m>bass));
    const ans = ["Root position", "First inversion (6)", "Second inversion (6/4)"][inv];
    return Object.assign(lis("Listen to the LOWEST note. Is this chord in root position, first inversion or second inversion?", ans, seq(ch,0.42,0.4).concat(block(ch,ch.length*0.42+0.25,1.6))), {_check:{inv, bassPc:mod(bass,12), rootPc:mod(r,12), q}}); };
  const SCALES = { "Major":[0,2,4,5,7,9,11,12], "Natural minor":[0,2,3,5,7,8,10,12], "Harmonic minor":[0,2,3,5,7,8,11,12], "Melodic minor (ascending)":[0,2,3,5,7,9,11,12],
    "Chromatic":[0,1,2,3,4,5,6,7,8,9,10,11,12], "Whole tone":[0,2,4,6,8,10,12], "Major pentatonic":[0,2,4,7,9,12] };
  function scaleEar(names, q){ const nm = rnd(names), r = ri(57,63), st = SCALES[nm];
    return Object.assign(lis(q, nm + " scale", seq(st.map(x=>r+x), st.length>8?0.24:0.34, st.length>8?0.22:0.32)), {_check:{steps:st}}); }
  L.scaleType2 = () => scaleEar(["Major","Natural minor","Harmonic minor","Chromatic"], "Which scale: major, natural minor, harmonic minor or chromatic?");
  L.scaleType3 = () => scaleEar(["Major","Natural minor","Harmonic minor","Melodic minor (ascending)","Whole tone","Major pentatonic"], "Which scale is this? (major, natural/harmonic/melodic minor, whole tone or pentatonic)");
  const MODES = { Ionian:[0,2,4,5,7,9,11,12], Dorian:[0,2,3,5,7,9,10,12], Phrygian:[0,1,3,5,7,8,10,12], Lydian:[0,2,4,6,7,9,11,12], Mixolydian:[0,2,4,5,7,9,10,12], Aeolian:[0,2,3,5,7,8,10,12] };
  L.modeEar = () => { const nm = rnd(Object.keys(MODES)), r = ri(57,62), st = MODES[nm];
    const up = st.map(x=>r+x), ev = seq(up, 0.32, 0.3).concat(seq(up.slice().reverse().slice(1), 0.32, 0.3).map(e=>({...e, t:e.t+up.length*0.32})));
    return Object.assign(lis("Which mode? (Ionian, Dorian, Phrygian, Lydian, Mixolydian or Aeolian)", nm + (nm==="Ionian"?" (major)":nm==="Aeolian"?" (natural minor)":""), ev), {_check:{steps:st}}); };
  // meter: clicks — downbeat (loud/high), other beats (medium), subdivisions (soft/low)
  const METERS = { "Simple duple":[2,2], "Simple triple":[3,2], "Simple quadruple":[4,2], "Compound duple":[2,3], "Compound triple":[3,3], "Compound quadruple":[4,3] };
  const METER_SIG = { "Simple duple":"2/4", "Simple triple":"3/4", "Simple quadruple":"4/4", "Compound duple":"6/8", "Compound triple":"9/8", "Compound quadruple":"12/8" };
  function meterEar(names, q){
    const nm = rnd(names), [beats, sub] = METERS[nm], subDur = sub===2 ? 0.27 : 0.22;
    const clicks = []; let t = 0;
    for(let m=0;m<3;m++) for(let b=0;b<beats;b++) for(let s=0;s<sub;s++){ clicks.push({t, accent: s>0 ? 0 : b===0 ? 2 : 1}); t += subDur; }
    return Object.assign(lis(q, `${nm} (like ${METER_SIG[nm]})`, [], clicks), {_check:{beats, sub}});
  }
  L.meterSimpleCompound = () => meterEar(["Simple duple","Compound duple"], "Listen to how each beat divides. Simple duple (beats split in 2) or compound duple (beats split in 3)?");
  L.meterFull = () => meterEar(Object.keys(METERS), "Name the meter: simple or compound — and duple, triple or quadruple? (loud click = beat 1)");
  // cadences in real 4-part harmony, with varied lead-ins (so the whole phrase matters, not just the last chord)
  const C_ = (x, inv=0, seventh=false, top) => ({x, inv, seventh, top, raise:true});
  const PRE = lvl => [ [C_(0),C_(3)], [C_(0),C_(1,1)], [C_(0),C_(5),C_(1,1)], [C_(0),C_(5),C_(3)], [C_(0),C_(0,1),C_(3)] ]
    .concat(lvl>=4 ? [[C_(0),C_(3),C_(0,2)], [C_(0),C_(1,1),C_(0,2)]] : []);      // Theory 4: cadential 6/4 before V
  const V_ = lvl => C_(4, 0, lvl>=3 && Math.random()<0.5);
  const CAD = {
    authentic: { name:"Authentic cadence (V–I)", make:l=>rnd(PRE(l)).concat([V_(l), C_(0,0,false,0)]) },
    pac:       { name:"Perfect authentic cadence (PAC)", make:l=>rnd(PRE(l)).concat([V_(l), C_(0,0,false,0)]) },
    iac:       { name:"Imperfect authentic cadence (IAC)", make:l=>rnd(PRE(l)).concat([V_(l), C_(0,0,false,rnd([2,4]))]) },
    half:      { name:"Half cadence (ends on V)", make:l=>rnd(PRE(l)).concat([C_(4)]) },
    plagal:    { name:"Plagal cadence (IV–I)", make:()=>rnd([[C_(0),C_(5),C_(3),C_(0)], [C_(0),C_(0,1),C_(3),C_(0)], [C_(0),C_(1,1),C_(3),C_(0)]]) },
    deceptive: { name:"Deceptive cadence (V–vi)", make:l=>rnd(PRE(l)).concat([V_(l), C_(5)]) },
    phrygian:  { name:"Phrygian half cadence (iv6–V in minor)", make:()=>rnd([[C_(0),C_(3,1),C_(4)], [C_(0),C_(5),C_(3,1),C_(4)], [C_(0),C_(0,1),C_(3,1),C_(4)]]), minor:true }
  };
  function cadenceEar(types, q, lvl){
    for(let tries=0; tries<40; tries++){
      const t = rnd(types), spec = CAD[t];
      const KEY = keyOf(rnd(majorKeys(3)), !!spec.minor);
      const chords = spec.make(lvl);
      const pr = progression(KEY, chords); if(!pr) continue;
      return Object.assign(lis(q, spec.name, pr.events), {_check:{type:t, key:KEY.name, minor:!!spec.minor, ltPc:mod(KEY.deg(6,true).midi,12),
        chords:pr.spelled.map(s=>({x:s.c.x, inv:s.c.inv||0, seventh:!!s.c.seventh, v:s.voicing.v, sPc:s.voicing.sPc}))}});
    }
  }
  L.cadenceBasic = l => cadenceEar(["authentic","half"], "Listen to the end. Authentic cadence (ends V–I) or half cadence (ends on V)?", 2);
  L.cadence3 = l => cadenceEar(["authentic","half","plagal","deceptive"], "Name the cadence at the end: authentic, half, plagal or deceptive?", 3);
  L.cadenceAP = l => cadenceEar(["pac","iac","half","plagal","deceptive","phrygian"], "Name the cadence: PAC, IAC, half, plagal, deceptive or Phrygian half?", 4);
  // name a chord inside a progression
  L.progressionChord = () => {
    for(let tries=0; tries<20; tries++){
      const KEY = keyOf(rnd(majorKeys(3)), false);
      const form = rnd([{pos:1, opts:[1,3,5], prog:x=>[[0],[x],[4],[0]]}, {pos:2, opts:[1,3], prog:x=>[[0],[5],[x],[4]]}, {pos:1, opts:[1,3,5], prog:x=>[[0],[x],[4,0,undefined,true],[0]]}]);
      const x = rnd(form.opts);
      const chords = form.prog(x).map(([d, inv, top, sev])=>({x:d, inv:inv||0, seventh:!!sev, raise:true}));
      const pr = progression(KEY, chords); if(!pr) continue;
      const ms = pr.spelled[form.pos].tones.map(t=>t.midi);
      const num = romanOf(x, ms, 0);
      const labels = pr.spelled.map((s,i)=> i===form.pos ? "?" : romanOf(s.c.x, s.tones.map(t=>t.midi), 0) + (s.c.seventh ? "" : "")).map(l=>l.replace(/^V7$/,"V7"));
      return Object.assign(lis(`Major key: ${labels.join(" – ")}. What is the "?" chord: ${form.opts.map(o=>romanOf(o, KEY_TRIAD(KEY,o),0)).join(", ")}?`, num, pr.events),
        {_check:{x, ms, key:KEY.name, ltPc:mod(KEY.deg(6,true).midi,12), chords:pr.spelled.map(s=>({x:s.c.x, inv:s.c.inv||0, seventh:!!s.c.seventh, v:s.voicing.v, sPc:s.voicing.sPc}))}});
    }
  };
  const KEY_TRIAD = (KEY, x) => [0,2,4].map(j=>KEY.deg(x+j, true).midi);
  // the melody ends on which scale degree? (after a tonic chord)
  L.scaleDegreeEnd = () => {
    const KEY = keyOf(rnd(majorKeys(3)), false), target = ri(0,6);
    const I = [0,2,4].map(j=>KEY.deg(j).midi);
    let cur = rnd([0,2,4]); const path = [cur];
    for(let i=0;i<3;i++){ cur += rnd([-2,-1,1,2]); cur = Math.max(-2, Math.min(9, cur)); path.push(cur); }
    let last = target; while(Math.abs(last-cur) > 3) last += last < cur ? 7 : -7;
    if(last===cur) path[path.length-1] = cur + (cur<5 ? 1 : -1);
    path.push(last);
    const mel = path.map(x=>KEY.deg(x).midi);
    const ev = block(I.map(m=>m-12).concat(I), 0, 1.2, 0.5).concat(seq(mel, 0.55, 0.5).map(e=>({...e, t:e.t+1.6})));
    return Object.assign(lis("After the key chord, the melody ENDS on which scale degree? (1–7 or do–ti)", `${target+1} (${SOLF[target]})`, ev), {_check:{tonicMidi:KEY.deg(0).midi, lastMidi:mel[mel.length-1], target}});
  };
  // error detection: the staff shows the melody as written; the audio plays it with one note changed
  function errorDetect(lvl){
    for(let tries=0; tries<40; tries++){
      const KEY = keyOf(rnd(majorKeys(lvl>=4?4:2)), false), n = lvl<=2 ? 6 : 8, per = lvl<=2 ? 3 : 4;
      let cur = rnd([0,2,4]); const path = [cur];
      for(let i=1;i<n-1;i++){ let nx; do{ nx = cur + rnd([-2,-1,-1,1,1,2,3,-3]); }while(nx<-2 || nx>9); cur = nx; path.push(cur); }
      path.push(Math.abs(cur-7) < Math.abs(cur) ? 7 : 0);
      const c = ri(1, n-2), delta = lvl<=2 ? rnd([-2,2]) : rnd([-2,-1,1,2]);
      const played = path.slice(); played[c] += delta;
      if(played[c]<-2 || played[c]>9 || played[c]===path[c-1] || played[c]===path[c+1]) continue;
      const written = path.map(x=>KEY.deg(x)), heard = played.map(x=>KEY.deg(x));
      if(!inRange(written, 26, 40)) continue;
      const notes = [];
      written.forEach((t,i)=>{ notes.push({keys:[vfKey(t.d, t.acc)], dur:"q", label:i+1}); if((i+1)%per===0 && i<n-1) notes.push({bar:true}); });
      const ev = block([0,2,4].map(j=>KEY.deg(j).midi), 0, 1.0, 0.45).concat(seq(heard.map(t=>t.midi), 0.55, 0.5).map(e=>({...e, t:e.t+1.4})));
      const w = written[c], h = heard[c];
      const ans = `Note ${c+1} — played ${h.midi>w.midi?"higher":"lower"} (${nameOf(dLetter(h.d), h.acc)} instead of ${nameOf(dLetter(w.d), w.acc)})`;
      const item = lis(`The staff shows the melody as written. Which note (1–${n}) was PLAYED differently?`, ans, ev);
      item.media.staff = {clef:"treble", keySig:KEY.k.vf, timeSig: per===3 ? "3/4" : "4/4", notes};
      return Object.assign(item, {_check:{c, writtenMidi:written.map(t=>t.midi), heardMidi:heard.map(t=>t.midi)}});
    }
  }
  L.errorDetect2 = () => errorDetect(2); L.errorDetect3 = () => errorDetect(3); L.errorDetect4 = () => errorDetect(4);

  /* =================== STAFF (reading) =================== */
  const S = {};
  const BS = K.band.S;
  // roots students actually meet: C D E F G A B, B♭ E♭ A♭, F♯ (diatonic numbers in octave 4)
  const ROOTS = [[28,0],[29,0],[30,0],[31,0],[32,0],[33,0],[34,0],[27,-1],[30,-1],[33,-1],[31,1]].map(([d,acc])=>({d: d<28 ? d+7 : d, acc}));
  const plain = tones => tones.every(t=>Math.abs(t.acc)<=1 && !(t.acc===-1 && "FC".includes(dLetter(t.d))) && !(t.acc===1 && "EB".includes(dLetter(t.d))));
  S.noteName1 = () => BS.noteName(1); S.noteName3 = () => BS.noteName(3);
  S.noteValue = () => BS.noteValue(2); S.beats2 = () => BS.beats(2); S.beats3 = () => BS.beats(3);
  S.countKeySig = () => BS.countKeySig(2); S.genericInterval = () => BS.genericInterval(); S.qualityInterval = () => BS.qualityInterval();
  S.keyMajorMinor = () => { const k = rnd(KEYS.filter(k=>Math.abs(k.n)<=4)); return { q:"Name BOTH keys that use this key signature (the major key and its relative minor).", a:`${k.name} or ${k.rel}`, media:{type:"staff", clef:rnd(["treble","bass"]), keySig:k.vf, notes:[]}, _check:{n:k.n} }; };
  S.triadQuality = () => {
    for(let i=0;i<60;i++){
      const root = Object.assign({}, rnd(ROOTS)); const q = rnd(S._triadQs || Object.keys(TRIADS)), iv = TRIADS[q];
      const tones = [{d:root.d, acc:root.acc}, spellAbove(root.d, root.acc, 3, iv[1]), spellAbove(root.d, root.acc, 5, iv[2])];
      if(!plain(tones) || tones[2].d>40) continue;
      const ms = tones.map(t=>midiOf(t.d, t.acc));
      return { q:S._triadQs ? "Is this triad major or minor?" : "What quality is this triad: major, minor, diminished or augmented?", a:`${q[0].toUpperCase()+q.slice(1)} (${nameOf(dLetter(root.d), root.acc)} ${q})`,
        media:{type:"staff", clef:"treble", notes:[{keys:tones.map(t=>vfKey(t.d,t.acc)), dur:"w", acc:tones.map(t=>t.acc)}]}, _check:{ms, q} };
    }
  };
  S.seventhChord = () => {
    for(let i=0;i<80;i++){
      const root = Object.assign({}, rnd(ROOTS)); const q = rnd(Object.keys(SEVENTHS)), iv = SEVENTHS[q];
      const tones = [{d:root.d, acc:root.acc}, spellAbove(root.d, root.acc, 3, iv[1]), spellAbove(root.d, root.acc, 5, iv[2]), spellAbove(root.d, root.acc, 7, iv[3])];
      if(!plain(tones) || tones[3].d>40) continue;
      const ms = tones.map(t=>midiOf(t.d, t.acc));
      return { q:"Name this seventh chord (root + type, like G dominant 7th).", a:`${nameOf(dLetter(root.d), root.acc)} ${SEVENTH_NAMES[q].replace(/ \(.*\)/,"").toLowerCase()} (${SEVENTH_NAMES[q].match(/\((.*)\)/)[1]})`,
        media:{type:"staff", clef:"treble", notes:[{keys:tones.map(t=>vfKey(t.d,t.acc)), dur:"w", acc:tones.map(t=>t.acc)}]}, _check:{ms, q} };
    }
  };
  S.triadInversion = () => {
    for(let i=0;i<60;i++){
      const root = Object.assign({}, rnd(ROOTS)); const q = rnd(["major","minor"]), iv = TRIADS[q], inv = ri(0,2);
      const tones = [{d:root.d, acc:root.acc}, spellAbove(root.d, root.acc, 3, iv[1]), spellAbove(root.d, root.acc, 5, iv[2])];
      if(!plain(tones)) continue;
      const st = fitRange(stackFrom(tones.map(t=>({d:t.d, acc:t.acc, midi:midiOf(t.d,t.acc)})), inv));
      if(!inRange(st, 26, 40)) continue;
      return { q:"Name this chord and its position (root position, 6 or 6/4).",
        a:`${nameOf(dLetter(root.d), root.acc)} ${q}, ${["root position","first inversion (6)","second inversion (6/4)"][inv]}`,
        media:{type:"staff", clef:"treble", notes:[{keys:keysOf(st), dur:"w", acc:st.map(t=>t.acc)}]}, _check:{inv, q, rootMidi:midiOf(root.d, root.acc), stack:st.map(t=>t.midi)} };
    }
  };
  S.intervalAll = () => {
    const LIST = [["Minor 2nd",2,1],["Major 2nd",2,2],["Minor 3rd",3,3],["Major 3rd",3,4],["Perfect 4th",4,5],["Augmented 4th",4,6],["Diminished 5th",5,6],["Perfect 5th",5,7],["Minor 6th",6,8],["Major 6th",6,9],["Minor 7th",7,10],["Major 7th",7,11]];
    for(let i=0;i<60;i++){
      const [name, g, semis] = rnd(LIST); const root = Object.assign({}, rnd(ROOTS));
      const t = spellAbove(root.d, root.acc, g, semis); if(!plain([root, t]) || t.d>40) continue;
      const harmonic = Math.random()<0.5, keys = [vfKey(root.d, root.acc), vfKey(t.d, t.acc)];
      const notes = harmonic ? [{keys, dur:"w", acc:[root.acc, t.acc]}] : [{keys:[keys[0]], dur:"h", acc:[root.acc]}, {keys:[keys[1]], dur:"h", acc:[t.acc]}];
      return { q:"Name this interval (quality + number, like minor 6th).", a:name, media:{type:"staff", clef:"treble", notes}, _check:{g, semis, lo:[root.d, root.acc], hi:[t.d, t.acc]} };
    }
  };
  const TIME_SIGS = [ ["2/4","Simple duple",[["q",2]]], ["3/4","Simple triple",[["q",3]]], ["4/4","Simple quadruple",[["q",4]]], ["2/2","Simple duple (cut time)",[["h",2]]],
    ["3/8","Simple triple",[["8",3]]], ["6/8","Compound duple",[["8",6]]], ["9/8","Compound triple",[["8",9]]], ["12/8","Compound quadruple",[["qd",4]]], ["6/4","Compound duple",[["hd",2]]] ];
  S.triadQuality2 = () => { S._triadQs = ["major","minor"]; try{ return S.triadQuality(); } finally { S._triadQs = null; } };
  S.timeSigType2 = () => S.timeSigType(["2/4","3/4","4/4","2/2","6/8"]);
  S.timeSigType = only => { const pool = Array.isArray(only) ? TIME_SIGS.filter(x=>only.includes(x[0])) : TIME_SIGS; const [ts, ans, fill] = rnd(pool);
    const notes = []; fill.forEach(([dur, n])=>{ for(let i=0;i<n;i++) notes.push({keys:["b/4"], dur}); });
    return { q:"Is this meter simple or compound — and duple, triple or quadruple?", a:ans,
      media:{type:"staff", clef:"treble", timeSig:ts, notes, beam:true, beamGroups:ts.endsWith("/8") ? [[3,8]] : null}, _check:{ts} }; };
  S.scaleDegreeName = () => { const KEY = keyOf(rnd(majorKeys(4)), false), x = ri(0,6), t = KEY.deg(x);
    return { q:`Key of ${KEY.name}. What scale degree is this note? (tonic, supertonic, mediant…)`, a:`${DEGREE_NAMES[x]} (${x+1})`,
      media:{type:"staff", clef:"treble", keySig:KEY.k.vf, notes:[{keys:[vfKey(t.d, t.acc)], dur:"w"}]}, _check:{x, tonic:KEY.deg(0).midi, midi:t.midi} }; };
  // Roman numerals in a key (minor uses the raised leading tone for V and vii°)
  function romanStaff(minor, inversions){
    for(let i=0;i<80;i++){
      const KEY = keyOf(rnd(majorKeys(3)), minor);
      const seventh = inversions && Math.random()<0.45;
      const x = seventh ? rnd(minor ? [4,6] : [4,4,1,6]) : rnd(minor ? [0,3,4,5,6,1] : [0,1,2,3,4,5,6]);
      const n = seventh ? 4 : 3, raise = minor && (x===4 || x===6);
      const tones = Array.from({length:n}, (_,j)=>KEY.deg(x+2*j, raise));
      if(minor && x===2) continue;   // III+ in harmonic minor — skip
      const inv = inversions ? ri(0, n-1) : 0;
      const st = fitRange(stackFrom(tones, inv)); if(!inRange(st, 26, 40)) continue;
      const num = romanOf(x, tones.map(t=>t.midi), inv);
      if(num.includes("?")) continue;
      return { q:`Key of ${KEY.name}. What is the Roman numeral${inversions?" (with inversion figures)":""} of this chord?`, a:num,
        media:{type:"staff", clef:"treble", keySig:KEY.k.vf, notes:[{keys:keysOf(st), dur:"w", acc:st.map(t=>t.show||0)}]},
        _check:{x, inv, minor, tonic:KEY.deg(0).midi, ms:tones.map(t=>t.midi), stack:st.map(t=>t.midi)} };
    }
  }
  S.romanMajor = () => romanStaff(false, false);
  S.romanMinor = () => romanStaff(true, false);
  S.romanInversion = () => romanStaff(Math.random()<0.35, true);
  // secondary dominants: V/x or V7/x of a diatonic chord in a major key
  S.secondaryDominant = () => {
    const TARGETS = [[1,"ii"],[3,"IV"],[4,"V"],[5,"vi"]];
    for(let i=0;i<60;i++){
      const KEY = keyOf(rnd(majorKeys(3)), false); const [tx, tname] = rnd(TARGETS);
      const seventh = tx===3 ? true : Math.random()<0.5;
      const r = KEY.deg(tx+4);                        // root a 5th above the target (diatonic letter)
      const target = KEY.deg(tx);
      const root = {d:r.d, acc:r.acc};
      // the root must sit a perfect 5th above the target
      if(midiOf(root.d, root.acc) - target.midi !== 7 && midiOf(root.d, root.acc) - target.midi !== -5) continue;
      const tones = [root, spellAbove(root.d, root.acc, 3, 4), spellAbove(root.d, root.acc, 5, 7)].concat(seventh ? [spellAbove(root.d, root.acc, 7, 10)] : []);
      if(tones.some(t=>Math.abs(t.acc)>1)) continue;
      const shown = tones.map(t=>({d:t.d, acc:t.acc, midi:midiOf(t.d,t.acc), show: t.acc!==sigAcc(dLetter(t.d), KEY.n) ? ACC_CODE[t.acc] : 0}));
      const st = fitRange(stackFrom(shown, 0)); if(!inRange(st, 26, 40)) continue;
      return { q:`Key of ${KEY.name}. This is a secondary dominant. Name it (like V/V or V7/vi).`, a:`${seventh?"V7":"V"}/${tname}`,
        media:{type:"staff", clef:"treble", keySig:KEY.k.vf, notes:[{keys:keysOf(st), dur:"w", acc:st.map(t=>t.show||0)}]},
        _check:{ms:shown.map(t=>t.midi), targetMidi:target.midi, seventh, tx} };
    }
  };
  // two-voice voice-leading: parallel 5ths / octaves / no error
  S.parallels = () => {
    for(let i=0;i<200;i++){
      const kind = rnd(["p5","p8","ok","ok"]);
      const lo1 = ri(27, 33), step = rnd([-2,-1,1,2]);
      let gen1, gen2, lo2;
      if(kind==="p5"){ gen1 = 4; gen2 = 4; lo2 = lo1 + step; }
      else if(kind==="p8"){ gen1 = 7; gen2 = 7; lo2 = lo1 + step; }
      else { const pat = rnd([[2,4,-1],[5,7,-1],[4,2,1],[2,2,1],[5,5,-1],[4,5,1]]); gen1 = pat[0]; gen2 = pat[1]; lo2 = lo1 + pat[2]*rnd([1,2]); }
      const hi1 = lo1 + gen1, hi2 = lo2 + gen2;
      if(hi1>40 || hi2>40 || lo2<26) continue;
      const m = d => midiOf(d, 0), s1 = m(hi1)-m(lo1), s2 = m(hi2)-m(lo2);
      const perfect = s => s===7 ? "5" : s===12 ? "8" : null;
      const sameDir = Math.sign(lo2-lo1) === Math.sign(hi2-hi1) && lo2!==lo1;
      const actual = perfect(s1)==="5" && perfect(s2)==="5" && sameDir ? "p5" : perfect(s1)==="8" && perfect(s2)==="8" && sameDir ? "p8"
        : (perfect(s1) && perfect(s1)===perfect(s2) && sameDir) ? "bad" : (kind==="ok" ? "ok" : "bad");
      if(actual!==kind) continue;
      if(kind==="ok" && perfect(s2) && sameDir) continue;      // avoid direct (hidden) 5ths/8ves in the "fine" examples
      const ans = {p5:"Parallel 5ths", p8:"Parallel octaves", ok:"No error"}[kind];
      return { q:"Two voices move from the first chord to the second. Which error: parallel 5ths, parallel octaves, or no error?", a:ans,
        media:{type:"staff", clef:"treble", notes:[{keys:[vfKey(lo1), vfKey(hi1)], dur:"h"}, {keys:[vfKey(lo2), vfKey(hi2)], dur:"h"}]}, _check:{lo1, hi1, lo2, hi2, s1, s2, kind} };
    }
  };

  MUSIC.registerTrack("theory", {
    S, L,
    staff: {
      1: ["noteName1","noteValue","beats2","countKeySig","genericInterval"],
      2: ["keyMajorMinor","qualityInterval","triadQuality2","timeSigType2","scaleDegreeName","noteName3"],
      3: ["seventhChord","triadInversion","triadQuality","romanMajor","intervalAll","timeSigType","keyMajorMinor"],
      4: ["romanInversion","secondaryDominant","parallels","seventhChord","intervalAll","romanMinor"]
    },
    listen: {
      1: ["highLow","sameDiff","upDown","stepsSkips","majorMinorChord","meter","genericIntervalEar","scaleMajorMinor"],
      2: ["intervalBasic","triadQualityEar2","scaleType2","meterSimpleCompound","cadenceBasic","errorDetect2"],
      3: ["intervalAll","triadQualityEar","triadInversionEar","seventhEar","cadence3","scaleType3","meterFull","errorDetect3","scaleDegreeEnd"],
      4: ["intervalAP","seventhEar","cadenceAP","progressionChord","modeEar","meterFull","errorDetect4","scaleDegreeEnd"]
    }
  });
  // band listening generators reused at Theory 1
  ["highLow","sameDiff","upDown","stepsSkips","majorMinorChord","meter","genericIntervalEar"].forEach(k=>{ L[k] = B[k]; });
  L.scaleMajorMinor = () => B.scaleMajorMinor(3);
  MUSIC.theory = { keyOf, romanOf, triadQuality, seventhQuality, progression, sigAcc };
})();
