const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const rnd=(a,b)=>a+Math.random()*(b-a);

/* ---------- cerejas da logo (SVG): par, rosa e vermelha ---------- */
const CH={
  pair:'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M33 49C35 30 46 15 60 9" fill="none" stroke="#a8171c" stroke-width="3.4" stroke-linecap="round"/><path d="M72 57C72 38 67 20 60 9" fill="none" stroke="#a8171c" stroke-width="3.4" stroke-linecap="round"/><circle cx="33" cy="70" r="21" fill="#f8b4be" stroke="#fff" stroke-width="3"/><path d="M20 64a16 16 0 0 1 10-11" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".95"/><path d="M50 74a18 18 0 0 1-14 15" fill="none" stroke="#e8546a" stroke-width="3" stroke-linecap="round" opacity=".7"/><circle cx="72" cy="75" r="18" fill="#b3191f" stroke="#fff" stroke-width="2.6"/><path d="M60 70a13 13 0 0 1 8-8" fill="none" stroke="#f8b4be" stroke-width="3.2" stroke-linecap="round"/></svg>',
  pink:'<svg viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg"><path d="M30 28C30 15 38 8 49 5" fill="none" stroke="#a8171c" stroke-width="3.4" stroke-linecap="round"/><circle cx="30" cy="47" r="19" fill="#f8b4be" stroke="#fff" stroke-width="3"/><path d="M18 43a13 13 0 0 1 9-9" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/></svg>',
  red:'<svg viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg"><path d="M30 28C30 15 38 8 49 5" fill="none" stroke="#a8171c" stroke-width="3.4" stroke-linecap="round"/><circle cx="30" cy="47" r="19" fill="#b3191f" stroke="#fff" stroke-width="2.6"/><path d="M18 43a13 13 0 0 1 9-9" fill="none" stroke="#f8b4be" stroke-width="3.2" stroke-linecap="round"/></svg>'
};
const cherry=(k='pair')=>CH[k];

/* ---------- troca de telas ---------- */
let _t;
function show(id){
  clearTimeout(_t);const nx=$(id),old=$$('.screen.on').filter(e=>e!==nx);
  old.forEach(e=>e.classList.add('out'));
  if(old.length&&window.SFX)SFX.whoosh();
  _t=setTimeout(()=>{$$('.screen').forEach(e=>e!==nx&&e.classList.remove('on','out'));nx.classList.add('on')},old.length?350:0);
}

/* ---------- efeito máquina de escrever suave ---------- */
function T(el,text){
  // fallback rápido para perguntas/opções (não são data-tw)
  el.innerHTML=String(text).split(/\s+/).filter(Boolean).map((w,i)=>`<span class="w" style="--k:${i}">${esc(w)}</span>`).join(' ');
}

function typewriter(el,text,opts={}){
  const{speed=48,jitter=22,delay=1800,loop=false,cursor=true}=opts;
  el.innerHTML='';
  const chars=String(text);
  let i=0,tid;
  const wrap=document.createElement('span');wrap.className='tw-inner';el.appendChild(wrap);
  const cur=document.createElement('span');cur.className='tw-cursor';cur.textContent='|';
  if(cursor)el.appendChild(cur);
  function next(){
    if(i>=chars.length){
      if(cursor)setTimeout(()=>cur.classList.add('tw-done'),200);
      if(loop)tid=setTimeout(()=>{wrap.textContent='';if(cursor)cur.classList.remove('tw-done');i=0;next()},delay);
      return;
    }
    wrap.textContent+=chars[i++];
    tid=setTimeout(next,speed+Math.random()*jitter-jitter/2);
  }
  next();
  return ()=>{clearTimeout(tid);if(cursor)cur.remove();el.textContent=chars;};
}

$$('[data-cine]').forEach(e=>typewriter(e,e.textContent.trim(),{speed:55,jitter:30,delay:2500,loop:false}));

/* ---------- contadores ---------- */
function count(el,to,ms=1000,pre='',suf=''){const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/ms);el.textContent=pre+Math.round(to*(1-Math.pow(1-k,3)))+suf;if(k<1)requestAnimationFrame(f)})(t0)}
// contador de pontos: sobe com "tic tic tic" e fecha com sino
function scoreUp(el,from,to,o={}){
  const{ms=1100,pre='',suf='',silent=false,done,fx}=o,t0=performance.now();let last=-1,lt=0;
  if(from===to){el.textContent=pre+to+suf;done&&done();return}
  (function f(t){
    const k=Math.min(1,(t-t0)/ms),v=Math.round(from+(to-from)*(1-Math.pow(1-k,3)));
    el.textContent=pre+v+suf;
    if(k<1&&v!==last&&t-lt>58){lt=t;if(!silent&&window.SFX)SFX.pointTick(k);fx&&fx()}
    last=v;
    if(k<1)requestAnimationFrame(f);
    else{if(!silent&&window.SFX)SFX.pointDone();el.animate([{transform:'scale(1)'},{transform:'scale(1.3)',offset:.4},{transform:'scale(1)'}],{duration:480,easing:'cubic-bezier(.2,1.5,.4,1)'});done&&done()}
  })(t0);
}

/* ---------- partículas ---------- */
const mid=el=>{const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2,r]};
function spray(x,y,n=16,o={}){
  const{spread=240,up=1,cherries=.4}=o;
  for(let i=0;i<n;i++){
    const s=document.createElement('span'),isC=Math.random()<cherries,sz=isC?rnd(16,28):rnd(12,26);
    s.className='pt';s.style.width=isC?sz+'px':'auto';s.style.fontSize=sz+'px';
    s.innerHTML=isC?cherry(Math.random()<.5?'pink':'red'):'✦';document.body.appendChild(s);
    const a=rnd(0,Math.PI*2),d=rnd(.35,1)*spread,dx=Math.cos(a)*d,dy=Math.sin(a)*d*.8-(up?rnd(30,110):0),r=rnd(-200,200);
    s.animate([
      {transform:`translate(${x}px,${y}px) scale(0) rotate(0)`,opacity:1},
      {transform:`translate(${x+dx}px,${y+dy}px) scale(1) rotate(${r/2}deg)`,opacity:1,offset:.45},
      {transform:`translate(${x+dx*1.12}px,${y+dy+rnd(70,150)}px) scale(.4) rotate(${r}deg)`,opacity:0}
    ],{duration:rnd(900,1500),easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'}).onfinish=()=>s.remove();
  }
}
function floatText(el,text){
  const[x,y]=mid(el),s=document.createElement('span');s.className='flt';s.textContent=text;document.body.appendChild(s);
  s.animate([
    {transform:`translate(${x}px,${y}px) translate(-50%,0) scale(.4)`,opacity:0},
    {transform:`translate(${x}px,${y-30}px) translate(-50%,0) scale(1.25)`,opacity:1,offset:.25},
    {transform:`translate(${x}px,${y-120}px) translate(-50%,0) scale(1)`,opacity:0}
  ],{duration:1500,easing:'cubic-bezier(.2,.8,.3,1)',fill:'forwards'}).onfinish=()=>s.remove();
}
// cerejinhas voam de um elemento até o outro (pontos sendo somados)
function flyTo(a,b,n=9,done){
  const[x0,y0]=mid(a),[x1,y1]=mid(b);
  for(let i=0;i<n;i++){
    const s=document.createElement('span');s.className='fly';s.innerHTML=cherry(Math.random()<.5?'pink':'red');document.body.appendChild(s);
    const dx=rnd(-110,110),dy=-rnd(40,130);
    s.animate([
      {transform:`translate(${x0}px,${y0}px) scale(.2)`,opacity:0},
      {transform:`translate(${x0+dx}px,${y0+dy}px) scale(1.1)`,opacity:1,offset:.38},
      {transform:`translate(${x1}px,${y1}px) scale(.35)`,opacity:.9}
    ],{duration:rnd(850,1050),delay:i*60,easing:'cubic-bezier(.55,0,.25,1)',fill:'both'}).onfinish=()=>{
      s.remove();if(window.SFX)SFX.coin(i/n);
      b.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:220});
      if(i===n-1&&done)done();
    };
  }
}
function flash(color){const f=$('#flash');if(color)f.style.background=`radial-gradient(circle at 50% 50%,#fff,${color} 38%,transparent 75%)`;f.classList.remove('go');f.getBoundingClientRect();f.classList.add('go')}
function shake(el){el.classList.remove('shake');el.getBoundingClientRect();el.classList.add('shake')}

/* contagem regressiva (telão e celular) */
function onCount(n){
  const e=$('#n');e.textContent=n;e.style.animation='none';e.getBoundingClientRect();e.style.animation='';
  const b=e.parentNode;b.querySelectorAll('.flare').forEach(x=>x.remove());b.insertAdjacentHTML('afterbegin','<i class="flare"></i>');
  if(window.SFX)SFX.count(n);show('#cd');
}

/* ---------- atmosfera: fundo, cerejas, vinheta, grão ---------- */
document.body.insertAdjacentHTML('afterbegin','<div class="bg"><i></i><i></i><i></i></div>');
for(let i=0;i<18;i++){const s=document.createElement('span');s.className='sp';s.textContent='✦';
  s.style.cssText=`left:${Math.random()*100}vw;top:${Math.random()*100}vh;font-size:${10+Math.random()*22}px;animation-delay:${-Math.random()*4}s;animation-duration:${2.5+Math.random()*3}s`;document.body.appendChild(s)}
// 3 camadas de profundidade: longe (pequenas), meio, perto (grandes e desfocadas)
[['far',6,26,44,20,30],['mid',6,50,76,14,22],['near',3,120,170,9,14]].forEach(([cls,n,a,b,d1,d2])=>{
  for(let i=0;i<n;i++){const c=document.createElement('span'),k=Math.random();
    c.className='fc '+cls;c.innerHTML=cherry(k<.6?'pair':k<.8?'pink':'red');
    c.style.cssText=`left:${rnd(0,96)}vw;width:${rnd(a,b)}px;animation-duration:${rnd(d1,d2)}s;animation-delay:${-rnd(0,d2)}s`;
    c.firstChild.style.animationDuration=rnd(3,6)+'s';c.firstChild.style.animationDelay=-rnd(0,5)+'s';document.body.appendChild(c)}
});
document.body.insertAdjacentHTML('beforeend','<div class="leak"></div><div class="cine"></div><div class="grain"></div><div id="flash"></div>');

// brilho que segue o cursor nos botões
document.addEventListener('pointermove',e=>{const b=e.target.closest&&e.target.closest('.btn,button.opt');if(b){const r=b.getBoundingClientRect();b.style.setProperty('--mx',e.clientX-r.left+'px');b.style.setProperty('--my',e.clientY-r.top+'px')}});

/* ---------- confete + fogos ---------- */
let _cf;
function confetti(){
  if(_cf)return;_cf=1;const c=$('#cf'),x=c.getContext('2d'),cols=['#f8b4be','#a8171c','#ffd27a','#fff','#e8546a'];
  c.style.display='block';c.width=innerWidth;c.height=innerHeight;let B=[];
  const P=Array.from({length:260},()=>({x:Math.random()*c.width,y:-Math.random()*c.height,r:4+Math.random()*8,v:2+Math.random()*4,s:Math.random()*2-1,c:cols[Math.random()*5|0],a:Math.random()*6,o:Math.random()<.3}));
  const burst=()=>{const bx=c.width*(.15+Math.random()*.7),by=c.height*(.12+Math.random()*.4),col=cols[Math.random()*5|0];if(window.SFX)SFX.firework();for(let i=0;i<55;i++){const a=Math.PI*2*i/55,v=3+Math.random()*5;B.push({x:bx,y:by,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,c:col})}};
  burst();setInterval(burst,900);
  (function f(){x.clearRect(0,0,c.width,c.height);
    P.forEach(p=>{p.y+=p.v;p.x+=Math.sin(p.a+=.05)*2+p.s;if(p.y>c.height){p.y=-10;p.x=Math.random()*c.width}x.fillStyle=p.c;x.beginPath();p.o?x.arc(p.x,p.y,p.r/2,0,7):x.rect(p.x,p.y,p.r,p.r*1.6);x.fill()});
    B=B.filter(b=>b.l>0);B.forEach(b=>{b.x+=b.vx;b.y+=b.vy;b.vy+=.08;b.vx*=.98;b.l-=.015;x.globalAlpha=Math.max(b.l,0);x.fillStyle=b.c;x.beginPath();x.arc(b.x,b.y,2.6,0,7);x.fill()});
    x.globalAlpha=1;requestAnimationFrame(f)})();
}
