const r=require('express').Router(),path=require('path'),auth=require('../controllers/authController');
const v=f=>(q,s)=>s.sendFile(path.join(__dirname,'../views',f));
r.get('/',v('player.html'));            // convidados (celular)
r.get('/tela',v('screen.html'));        // telão: só exibe resultados
r.get('/admin',auth.page);              // painel de controle (com senha)
r.post('/admin/login',auth.login);
module.exports=r;
