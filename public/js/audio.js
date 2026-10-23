/* Motor de som do Quiz da Duda — 100% sintetizado com Web Audio (sem arquivos de áudio).
   - Telão (data-music="1"): efeitos + música de fundo por cena.
   - Celulares (data-music="0"): só efeitos, para não competir com a música do telão.
     Para ligar música nos celulares, troque data-music para "1" em views/player.html. */
window.SFX=(()=>{
const D=document.body.dataset,MUSIC=D.music==='1',GATE=D.gate!==undefined,BASE=.5;
let ctx,master,sfx,mus,rev,comp,nb,muted=localStorage.mute==='1',want=null,cur=null,mbus=null,pumpId=null,step=0,nextT=0,hv=0;
const mtof=m=>440*Math.pow(2,(m-69)/12),now=()=>ctx.currentTime,R=(a,b)=>a+Math.random()*(b-a),ok=()=>ctx&&!muted;

function init(){
  if(ctx)return true;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
  try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
  ctx=new AC();
  comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=20;comp.ratio.value=5;comp.attack.value=.004;comp.release.value=.22;
  master=ctx.createGain();master.gain.value=muted?0:.9;comp.connect(master);master.connect(ctx.destination);
  sfx=ctx.createGain();sfx.gain.value=.95;sfx.connect(comp);
  mus=ctx.createGain();mus.gain.value=BASE;mus.connect(comp);
  const len=ctx.sampleRate*2.4,ir=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.7)}
  const cv=ctx.createConvolver();cv.buffer=ir;const rf=ctx.createBiquadFilter();rf.type='lowpass';rf.frequency.value=5200;
  rev=ctx.createGain();rev.gain.value=.55;rev.connect(cv);cv.connect(rf);rf.connect(comp);
  nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
  return true;
}

/* ---------- blocos básicos ---------- */
function tone(f,t,d,o={}){
  const{type='sine',v=.15,a=.004,r=.15,to=0,det=0,dest=sfx,rv=0,lp=0,pan=0,hold=0}=o;
  const os=ctx.createOscillator(),g=ctx.createGain();
  os.type=type;os.frequency.setValueAtTime(f,t);if(to)os.frequency.exponentialRampToValueAtTime(to,t+d);os.detune.value=det;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+a);
  if(hold){g.gain.setValueAtTime(v,t+Math.max(a,d-r));g.gain.exponentialRampToValueAtTime(.0001,t+d)}else g.gain.exponentialRampToValueAtTime(.0001,t+d);
  let n=os;if(lp){const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;os.connect(fl);n=fl}
  n.connect(g);let out=g;
  if(pan&&ctx.createStereoPanner){const p=ctx.createStereoPanner();p.pan.value=pan;g.connect(p);out=p}
  out.connect(dest);if(rv){const s=ctx.createGain();s.gain.value=rv;out.connect(s);s.connect(rev)}
  os.start(t);os.stop(t+d+.05);
}
function noise(t,d,o={}){
  const{v=.15,type='bandpass',f=1000,to=0,q=1,a=.003,dest=sfx,rv=0,rise=0}=o;
  const s=ctx.createBufferSource();s.buffer=nb;s.loop=true;
  const fl=ctx.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f,t);if(to)fl.frequency.exponentialRampToValueAtTime(to,t+d);fl.Q.value=q;
  const g=ctx.createGain();g.gain.setValueAtTime(.0001,t);
  if(rise){g.gain.exponentialRampToValueAtTime(v,t+d)}else{g.gain.linearRampToValueAtTime(v,t+Math.min(a,d*.5));g.gain.exponentialRampToValueAtTime(.0001,t+d)}
  s.connect(fl);fl.connect(g);g.connect(dest);if(rv){const x=ctx.createGain();x.gain.value=rv;g.connect(x);x.connect(rev)}
  s.start(t,R(0,1.5));s.stop(t+d+.05);
}
const kick=(t,v=.3,dest=sfx)=>{tone(150,t,.2,{to:42,v,a:.002,dest});noise(t,.02,{v:v*.25,type:'lowpass',f:900,dest})};
const hat=(t,v=.04,dest=sfx,d=.04)=>noise(t,d,{v,type:'highpass',f:7500,q:.7,dest});
const clap=(t,v=.1,dest=sfx)=>[0,.011,.022].forEach(o=>noise(t+o,.1,{v,f:1500,q:.9,dest}));
const timp=(t,f=90,v=.35,dest=sfx)=>{tone(f*1.5,t,.5,{to:f,v,a:.003,dest,rv:.3});tone(f,t,1.2,{v:v*.8,dest,rv:.3});noise(t,.06,{v:v*.3,type:'lowpass',f:500,dest})};
const crash=(t,v=.16)=>{noise(t,1.8,{v,type:'highpass',f:4500,q:.5,rv:.5,a:.005});noise(t,1.1,{v:v*.6,f:9000,q:.4,rv:.4})};
const brass=(notes,t,d,v=.08,dest=sfx)=>notes.forEach((m,k)=>[-6,5].forEach(dt=>tone(mtof(m),t,d,{type:'sawtooth',v:v/2,a:.04,hold:1,r:.3,lp:2500,det:dt+k,dest,rv:.35})));
const applause=(sec,v)=>{const t=now();for(let i=0;i<sec*70;i++){const x=Math.random()*sec,env=Math.min(1,x/.4)*Math.min(1,(sec-x)/.9);noise(t+x,R(.025,.07),{v:v*env*R(.4,1),f:R(1200,3600),q:.8,rv:.15})}};
function duck(sec,depth=.3){if(!mus)return;const g=mus.gain,t=now();g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(BASE*depth,t+.08);g.setValueAtTime(BASE*depth,t+sec);g.linearRampToValueAtTime(BASE,t+sec+.9)}

/* ---------- música de fundo (gerada ao vivo) ---------- */
const C=(b,n)=>({b,n});
const SC={
  lobby:{bpm:86,ch:[C(36,[60,64,67,71]),C(33,[57,60,64,67]),C(41,[60,64,65,69]),C(43,[59,62,67,71])],
    step(i,t,d,c,B){const s=i%16;
      if(s===0){c.n.forEach((m,k)=>tone(mtof(m),t,d*16,{type:'triangle',v:.05,a:.7,hold:1,r:.8,dest:B,rv:.6,lp:1800,det:k*4-6}));tone(mtof(c.b),t,d*15,{type:'sine',v:.15,a:.03,hold:1,r:.4,dest:B})}
      if(s%2===0){const m=c.n[[0,2,1,3,2,1,3,2][s/2]]+12;tone(mtof(m),t,.32,{type:'triangle',v:.05,dest:B,rv:.55,pan:R(-.5,.5)})}
      if(s===0||s===8)kick(t,.16,B);if(s%4===2)hat(t,.022,B);if(s===12)tone(mtof(c.n[3]+24),t,.8,{v:.025,dest:B,rv:.8})}},
  question:{bpm:116,ch:[C(33,[57,60,64,69]),C(38,[62,65,69,74]),C(41,[60,65,69,72]),C(40,[56,59,64,68])],
    step(i,t,d,c,B){const s=i%16;
      if(s===0)c.n.forEach((m,k)=>tone(mtof(m-12),t,d*16,{type:'sawtooth',v:.02,a:.3,hold:1,r:.5,dest:B,lp:900,det:k*5,rv:.3}));
      if(s%2===0)tone(mtof(c.b+(s%8===6?7:0)),t,d*1.9,{type:'sawtooth',v:.075,lp:520,dest:B});
      tone(mtof(c.n[[0,1,2,1][s%4]]+12),t,.12,{type:'triangle',v:.032,dest:B,rv:.3,pan:(s%8-4)/8});
      if(s%4===0)kick(t,.2,B);if(s===4||s===12)clap(t,.06,B);if(s%2===1)hat(t,.028,B)}},
  reveal:{bpm:108,ch:[C(36,[60,64,67,72]),C(43,[59,62,67,71]),C(33,[57,60,64,69]),C(41,[60,65,69,72])],
    step(i,t,d,c,B){const s=i%16;
      if(s===0)c.n.forEach((m,k)=>tone(mtof(m),t,d*16,{type:'triangle',v:.04,a:.2,hold:1,r:.5,dest:B,rv:.5,lp:2200,det:k*4}));
      if(s%4===0)tone(mtof(c.b),t,d*3.5,{type:'sine',v:.15,dest:B});
      if(s%2===0)tone(mtof(c.n[[0,1,2,3,2,1,2,3][s/2]]+12),t,.2,{type:'triangle',v:.05,dest:B,rv:.4,pan:R(-.4,.4)});
      if(s===0||s===8)kick(t,.17,B);if(s===4||s===12)clap(t,.07,B);if(s%2===1)hat(t,.022,B)}},
  finale:{bpm:72,ch:[C(33,[57,60,64,69]),C(41,[57,60,65,69]),C(36,[55,60,64,67]),C(40,[56,59,64,68])],
    step(i,t,d,c,B){const s=i%16;
      if(s===0){c.n.forEach((m,k)=>{tone(mtof(m-12),t,d*16,{type:'sawtooth',v:.03,a:1.1,hold:1,r:1,dest:B,lp:800,det:k*6-9,rv:.7});tone(mtof(m),t,d*16,{type:'triangle',v:.03,a:1.4,hold:1,r:1,dest:B,rv:.8})});tone(mtof(c.b-12),t,d*16,{v:.18,a:.4,hold:1,r:.8,dest:B});timp(t,55,.28,B)}
      if(s===8)timp(t,50,.14,B);if(s===12)timp(t,50,.08,B);
      if(s%3===0&&Math.random()<.5)tone(mtof(c.n[(Math.random()*4)|0]+24),t,.9,{v:.02,dest:B,rv:.9,pan:R(-.7,.7)})}},
  win:{bpm:126,ch:[C(36,[60,64,67,72]),C(41,[60,65,69,72]),C(43,[59,62,67,71]),C(36,[60,64,67,76])],
    step(i,t,d,c,B){const s=i%16;
      if(s%4===0)kick(t,.26,B);if(s===4||s===12)clap(t,.1,B);if(s%2===0)hat(t,.035,B);if(s%4===2)hat(t,.05,B,.1);
      if(s%2===0)tone(mtof(c.b+(s%8===4?12:0)),t,d*1.8,{type:'sawtooth',v:.08,lp:600,dest:B});
      if(s===0||s===6||s===10)brass(c.n,t,d*3,.055,B);
      tone(mtof(c.n[[0,1,2,3][s%4]]+12),t,.14,{type:'triangle',v:.04,dest:B,rv:.4,pan:R(-.5,.5)})}}
};
function pump(){
  if(!ctx||!mbus||!SC[cur])return;const sc=SC[cur],dur=60/sc.bpm/4;
  while(nextT<now()+.5){sc.step(step,nextT,dur,sc.ch[Math.floor(step/16)%sc.ch.length],mbus);step++;nextT+=dur}
}
function scene(name){
  want=name;if(!ctx||!MUSIC||name===cur)return;cur=name;
  if(mbus){const o=mbus,t=now();o.gain.cancelScheduledValues(t);o.gain.setValueAtTime(o.gain.value,t);o.gain.linearRampToValueAtTime(0,t+.9);setTimeout(()=>{try{o.disconnect()}catch(e){}},1600)}
  if(!name){mbus=null;return}
  mbus=ctx.createGain();mbus.gain.setValueAtTime(0,now());mbus.gain.linearRampToValueAtTime(1,now()+1.2);mbus.connect(mus);
  step=0;nextT=now()+.08;if(!pumpId)pumpId=setInterval(pump,40);
}

/* ---------- efeitos ---------- */
const A={
  hover(){if(!ok())return;const n=performance.now();if(n-hv<70)return;hv=n;tone(1500,now(),.05,{to:2000,v:.035})},
  click(){if(!ok())return;const t=now();tone(540,t,.08,{type:'triangle',v:.13,to:250});tone(1080,t,.05,{v:.06});noise(t,.02,{v:.07,type:'highpass',f:3500})},
  select(){if(!ok())return;const t=now();tone(380,t,.13,{v:.22,to:950,rv:.2});tone(1500,t+.05,.16,{v:.07,to:2300,rv:.45});tone(190,t,.1,{type:'triangle',v:.12,to:100})},
  blip(){if(!ok())return;tone(920,now(),.07,{type:'triangle',v:.06,to:1250,rv:.2})},
  whoosh(){if(!ok())return;const t=now();noise(t,.55,{v:.13,f:260,to:3600,q:1.3,a:.22,rv:.25});noise(t+.08,.4,{v:.05,type:'highpass',f:3000,to:800,a:.15})},
  join(){if(!ok())return;const t=now();[784,988,1175,1568].forEach((f,i)=>tone(f,t+i*.06,.4,{type:'triangle',v:.1,rv:.55}));tone(200,t,.12,{v:.12,to:90})},
  joined(){if(!ok())return;const t=now();[523,659,784,1047,1319].forEach((f,i)=>tone(f,t+i*.07,.55,{type:'triangle',v:.11,rv:.6}));tone(2093,t+.35,.8,{v:.04,rv:.8})},
  go(){if(!ok())return;const t=now();noise(t,.9,{v:.22,f:180,to:6000,q:1.1,a:.25,rv:.35});kick(t+.12,.5);kick(t+.28,.3);[523,659,784].forEach((f,i)=>tone(f,t+.12,.65,{type:'sawtooth',v:.06,lp:3400,det:i*4,rv:.45}));tone(1047,t+.12,.9,{v:.09,rv:.55})},
  optIn(i){if(!ok())return;const f=[659,784,988,1175][i%4],t=now();tone(f,t,.22,{type:'triangle',v:.12,rv:.4,pan:(i-1.5)/3});tone(f*2,t,.15,{v:.035,rv:.5})},
  tick(s,urgent){if(!ok())return;const t=now();
    if(s<=5||urgent){const f=s<=3?1600:1250;tone(f,t,.05,{type:'square',v:.05,lp:3200});noise(t,.025,{v:.08,f:2400,q:2});kick(t+.02,.1+(5-Math.min(s,5))*.03);if(s<=3)tone(f*1.5,t+.07,.06,{type:'square',v:.03,lp:3000})}
    else{tone(820,t,.04,{type:'triangle',v:.04});noise(t,.02,{v:.04,f:2200,q:2})}},
  count(n){if(!ok())return;const t=now(),f={3:392,2:523,1:659}[n]||523;kick(t,.5);tone(f,t,.4,{type:'sawtooth',v:.14,lp:2800,rv:.5});tone(f*2,t,.32,{v:.07,rv:.55});noise(t,.35,{v:.12,f:280,to:2800,q:1.1,a:.1});if(n===1){tone(f*3,t+.06,.6,{v:.05,rv:.75});kick(t+.12,.2)}},
  correct(){if(!ok())return;const t=now();[523,659,784,1047,1319].forEach((f,i)=>{tone(f,t+i*.065,.85,{type:'triangle',v:.16,rv:.6});tone(f*2,t+i*.065,.6,{v:.045,rv:.65})});[2093,2637,3136].forEach((f,i)=>tone(f,t+.32+i*.09,.7,{v:.05,rv:.85}));kick(t,.35);noise(t,.25,{v:.1,f:300,to:3000,q:1,a:.05});duck(1.4)},
  wrong(){if(!ok())return;const t=now();tone(280,t,.7,{type:'sawtooth',lp:800,v:.16,to:165});tone(210,t+.22,.9,{type:'sawtooth',lp:600,v:.14,to:120});timp(t,75,.28);noise(t+.1,.35,{v:.06,f:400,to:100,q:1.2,a:.04});duck(1.5)},
  timeout(){if(!ok())return;const t=now();timp(t,110,.3);timp(t+.24,82,.3);tone(180,t+.5,.5,{type:'triangle',v:.08,to:120})},
  fall(){if(!ok())return;const t=now();noise(t,.7,{v:.15,f:3000,to:180,q:1.4,a:.05,rv:.2});tone(320,t,.6,{v:.12,to:70})},
  suspense(sec=2.6){if(!ok())return;const t=now();noise(t,sec,{v:.16,f:200,to:5500,q:.9,rise:1});tone(150,t,sec,{type:'sawtooth',v:.05,lp:700,to:600,a:sec*.7});for(let x=0;x<sec-.1;x+=.45){kick(t+x,.18+x*.06);if(x>.8)kick(t+x+.18,.1+x*.04)}duck(sec+.1,.18)},
  reveal(){if(!ok())return;const t=now();kick(t,.7);timp(t,58,.55);noise(t,1.8,{v:.15,type:'highpass',f:4000,rv:.55,a:.01});[60,64,67,72].forEach((m,i)=>tone(mtof(m),t+i*.04,.9,{type:'triangle',v:.14,rv:.55}));[84,88,91,96].forEach((m,i)=>tone(mtof(m),t+.12+i*.09,1,{v:.055,rv:.85}));tone(mtof(96),t+.55,.8,{v:.06,rv:.9});duck(2.2)},
  podium(){if(!ok())return;const t=now();noise(t,.8,{v:.12,f:300,to:4200,q:1.2,a:.35,rv:.3});[1047,1319,1568,2093].forEach((f,i)=>tone(f,t+.25+i*.09,.6,{type:'triangle',v:.08,rv:.6}))},
  rise(n){if(!ok())return;const t=now(),f={1:523,2:440,3:392}[n]||440;kick(t,.34);tone(f,t,.5,{type:'triangle',v:.12,rv:.5});tone(f*1.5,t+.06,.45,{type:'triangle',v:.06,rv:.5})},
  pointTick(k=0){if(!ok())return;tone(650+k*1100,now(),.04,{type:'square',v:.04,lp:4200})},
  pointDone(){if(!ok())return;const t=now();[1568,2093,2637].forEach((f,i)=>tone(f,t+i*.07,.8,{v:.09-i*.015,rv:.6}))},
  pointRoll(sec=1.5){if(!ok())return;const t=now();let x=0;while(x<sec){const k=x/sec;tone(600+k*1300,t+x,.04,{type:'square',v:.04,lp:4200});x+=.06}tone(1568,t+sec,.7,{v:.09,rv:.6});tone(2093,t+sec+.07,.8,{v:.08,rv:.6})},
  coin(k=0){if(!ok())return;const t=now(),m=1+k*.6;tone(988*m,t,.07,{type:'square',v:.05,lp:4500});tone(1319*m,t+.055,.22,{type:'square',v:.05,lp:4800,rv:.25})},
  secret(){if(!ok())return;const t=now();[196,247,294,370].forEach((f,i)=>tone(f,t,1.8,{type:'triangle',v:.08,a:.7,hold:1,r:.8,lp:900,rv:.7,det:i*3}));for(let i=0;i<7;i++)tone(R(1800,3600),t+R(.2,1.6),.35,{v:.025,rv:.8,pan:R(-.8,.8)})},
  curtain(){if(!ok())return;const t=now();noise(t,2.8,{v:.3,type:'lowpass',f:120,to:500,q:.8,a:1.1,rv:.3});noise(t+.3,2.2,{v:.1,f:400,to:2500,q:.7,a:1,rv:.3});timp(t,50,.35)},
  drumroll(sec=2.8){if(!ok())return;const t=now()+.02;let x=0,i=0;while(x<sec){const k=x/sec;noise(t+x,.065,{v:.06+.22*k,f:2400,q:.6,rv:.1});if(i%3===0)tone(110-k*25,t+x,.1,{v:.06+.12*k,to:75});x+=.07-.05*k;i++}noise(t,sec,{v:.14,f:280,to:6000,q:.8,rise:1});crash(t+sec-.05,.25);duck(sec+.3,.18)},
  place(n){if(!ok())return;const t=now()+.01;crash(t,.15);kick(t,.5);timp(t,65,.4);
    const ch={3:[[55,59,62],[59,62,67]],2:[[57,61,64],[61,64,69]],1:[[60,64,67],[64,67,72]]}[n]||[[60,64,67],[64,67,72]];
    brass(ch[0],t,.28,.1);brass(ch[1],t+.22,1.4,.12);duck(2.2,.25)},
  winner(){if(!ok())return;const t=now()+.02;crash(t,.22);crash(t+.5,.14);kick(t,.6);timp(t,60,.55);
    brass([60,64,67,72],t+.05,.5,.1);brass([62,67,71,74],t+.55,.5,.1);brass([64,67,72,76],t+1.05,2.6,.13);
    [72,76,79,84].forEach((m,i)=>tone(mtof(m),t+.1,3.4,{type:'triangle',v:.05,a:.7,hold:1,r:1,rv:.8,det:i*3}));
    for(let i=0;i<16;i++)tone(mtof(84+[0,4,7,12][i%4]),t+.2+i*.12,.55,{v:.05,rv:.65,pan:R(-.7,.7)});
    applause(4.5,.7);duck(5,.3)},
  finalOther(){if(!ok())return;const t=now();[523,659,784].forEach((f,i)=>tone(f,t+i*.1,1,{type:'triangle',v:.09,rv:.6}));applause(2.5,.4)},
  firework(){if(!ok())return;const t=now();tone(R(450,700),t,.4,{to:R(1700,2300),v:.035,rv:.3});const b=t+.4;noise(b,.6,{v:.15,type:'lowpass',f:1800,to:200,a:.005,rv:.5});for(let i=0;i<7;i++)noise(b+.08+R(0,.5),.03,{v:.05,type:'highpass',f:4000})},
  sparkle(){if(!ok())return;const t=now();for(let i=0;i<5;i++)tone(R(2000,4200),t+i*.05,.3,{v:.035,rv:.7,pan:R(-.7,.7)})}
};

/* ---------- liberação do áudio, botão de mudo, aviso do telão ---------- */
function unlock(){
  if(!ctx){if(!init())return}
  if(ctx.state!=='running')ctx.resume();
  if(MUSIC&&want&&cur!==want){const w=want;cur=null;scene(w)}
}
const SVG_VOL_ON='<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M11 5L6 9H2v6h4l5 4V5Z" fill="currentColor"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M18.36 5.64a9 9 0 0 1 0 12.72" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const SVG_VOL_OFF='<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M11 5L6 9H2v6h4l5 4V5Z" fill="currentColor"/><line x1="18" y1="9" x2="23" y2="14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="23" y1="9" x2="18" y2="14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
function icon(){const b=document.getElementById('mute');if(b)b.innerHTML=muted?SVG_VOL_OFF:SVG_VOL_ON}
function setMute(m){muted=m;localStorage.mute=m?'1':'0';if(master)master.gain.setTargetAtTime(m?0:.9,ctx.currentTime,.05);icon()}
document.body.insertAdjacentHTML('beforeend','<button id="mute" class="mute" aria-label="Ligar ou desligar o som"></button>');icon();
if(GATE)document.body.insertAdjacentHTML('beforeend',`<div id="snd"><div><span class="big-ch">${cherry('pair')}</span><h1>Quiz da Duda</h1><p class="sub">Para a experiência completa, ative o som do telão</p><button class="btn big" id="sndgo">${SVG_VOL_ON} Ativar som</button><button class="btn sm ghost" id="sndno">Continuar sem som</button></div></div>`);
const off=()=>{const s=document.getElementById('snd');s&&s.classList.add('off')};
document.getElementById('mute').onclick=e=>{e.stopPropagation();unlock();setMute(!muted);if(!muted)A.click()};
const sg=document.getElementById('sndgo');if(sg){sg.onclick=()=>{unlock();if(muted)setMute(false);off();A.joined()};document.getElementById('sndno').onclick=()=>{setMute(true);off()}}
addEventListener('keydown',e=>{if(e.key==='m'||e.key==='M'){unlock();setMute(!muted)}});
['pointerup','click','touchend','keydown'].forEach(ev=>addEventListener(ev,function f(e){
  const was=!!ctx;unlock();
  if(ctx&&ctx.state==='running'&&!was&&ev==='click'&&e.target.closest&&e.target.closest('.btn:not(#sndgo),button:not(.opt):not(#mute)'))A.click();
},true));
addEventListener('pointerdown',e=>{if(!ctx)return;const t=e.target.closest&&e.target.closest('.btn,button:not(.opt):not(#mute)');if(t&&!t.disabled&&t.id!=='sndgo')A.click()},true);
addEventListener('pointerover',e=>{if(e.pointerType!=='mouse')return;const t=e.target.closest&&e.target.closest('.btn,button.opt,.mute');if(t&&!t.disabled&&!t.contains(e.relatedTarget))A.hover()},true);

return Object.assign({scene,duck,unlock},A);
})();
