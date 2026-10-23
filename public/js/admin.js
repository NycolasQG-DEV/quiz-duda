const sock=io(),PH={lobby:'Sala de espera',question:'Pergunta no ar',reveal:'Mostrando resposta e ranking',countdown:'Contagem regressiva…',finale:'Grande final'};
let tc;
sock.on('state',s=>{
  $('#ph').textContent=PH[s.phase];$('#c1').textContent=s.count;$('#c2').textContent=`${s.answered}/${s.count}`;$('#c3').textContent=s.i<0?'–':`${s.i+1}/${s.total}`;
  $('#qinfo').textContent=s.q;$('#key').hidden=!s.q;$('#key b').textContent=s.ans;
  const g=$('#go');g.textContent=s.btn||'Aguarde…';g.disabled=!s.btn||(s.phase==='lobby'&&!s.count);
  if(s.cool){g.disabled=true;clearTimeout(tc);tc=setTimeout(()=>g.disabled=!s.btn,s.cool)}
  $('#ppl').innerHTML=s.names.map(n=>`<span class="chip">${esc(n)}</span>`).join('');
});
$('#go').onclick=()=>{$('#go').disabled=true;sock.emit('admin:next')};
$('#rs').onclick=()=>confirm('Reiniciar tudo? Os convidados voltam para a sala de espera.')&&sock.emit('admin:reset');
sock.on('reset',()=>location.reload());
