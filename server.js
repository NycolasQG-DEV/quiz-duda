const express=require('express'),http=require('http'),path=require('path'),{Server}=require('socket.io');
const app=express(),srv=http.createServer(app),io=new Server(srv,{maxHttpBufferSize:2e6});
const auth=require('./controllers/authController');
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,'public')));
app.use('/',require('./routes'));
io.use((s,n)=>{s.data.admin=auth.ok(s.handshake.headers.cookie);n();});
require('./controllers/gameController')(io);
srv.listen(process.env.PORT||3000,()=>console.log('Quiz: http://localhost:3000  |  Admin: http://localhost:3000/admin (senha: '+auth.PASS+')'));
