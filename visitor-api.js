const express=require('express');
function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').map(v=>v.trim().split('=')).filter(v=>v.length===2));}
function createVisitorAPI(store,{ephemeral=false}={}){
  const router=express.Router();
  router.use((req,res,next)=>/^\/(?:admin|visitor|flight)\//.test(req.path)?next():next('router'));
  const isAdmin=req=>store.isAdmin(cookies(req).k9_admin);
  const setCookie=(res,req,name,value,maxAge)=>res.cookie(name,value,{httpOnly:true,sameSite:'strict',secure:req.secure,path:'/',maxAge});
  router.use(express.json({limit:'8kb'}));
  router.use((req,res,next)=>{
    res.set('Cache-Control','no-store');
    if(ephemeral)return res.status(503).json({error:'Visitor tracking requires a persistent database host.'});
    const originHost = (req.headers.origin||'').replace(/^https?:\/\//,'');
    if(req.method!=='GET'&&req.headers.origin&&originHost!==req.headers.host)return res.status(403).json({error:'Cross-origin requests are not allowed.'});
    req.visitor=store.identity(req.ip,cookies(req).k9_visitor);
    setCookie(res,req,'k9_visitor',req.visitor.visitor,365*86400000);
    req.admin=isAdmin(req);next();
  });
  router.post('/admin/login',(req,res)=>{
    if(store.loginBlocked(req.visitor.ipHash))return res.status(429).json({error:'Too many failed attempts. Try again in 15 minutes.'});
    if(!store.verifyAdmin(req.body?.username,req.body?.password)){store.loginFailed(req.visitor.ipHash);return res.status(401).json({error:'Invalid admin credentials.'});}
    store.loginSucceeded(req.visitor.ipHash);store.logout(cookies(req).k9_admin);
    const username=req.body.username.toLowerCase(),token=store.login(username);setCookie(res,req,'k9_admin',token,12*3600000);store.log(req.visitor,'admin_login',{username},true);res.json({success:true,isAdmin:true,username});
  });
  router.post('/admin/logout',(req,res)=>{store.logout(cookies(req).k9_admin);res.clearCookie('k9_admin',{path:'/'});store.log(req.visitor,'admin_logout',{},true);res.json({success:true});});
  router.get('/admin/session',(req,res)=>res.json({isAdmin:req.admin,username:store.adminUsername(cookies(req).k9_admin)||null}));
  router.post('/admin/password',(req,res)=>{
    if(!req.admin)return res.status(401).json({error:'Log in as admin first.'});
    if(store.loginBlocked(req.visitor.ipHash))return res.status(429).json({error:'Too many failed attempts. Try again in 15 minutes.'});
    const username=store.adminUsername(cookies(req).k9_admin);
    if(!store.verifyAdmin(username,req.body?.currentPassword)){store.loginFailed(req.visitor.ipHash);return res.status(400).json({error:'Current password is incorrect.'});}
    try{store.changePassword(username,req.body.currentPassword,req.body.newPassword);store.loginSucceeded(req.visitor.ipHash);setCookie(res,req,'k9_admin',store.login(username),12*3600000);store.log(req.visitor,'admin_password_changed',{username},true);res.json({success:true});}catch(e){res.status(400).json({error:e.message});}
  });
  router.post('/admin/users',(req,res)=>{
    if(!req.admin)return res.status(401).json({error:'Log in as admin first.'});
    try{const username=store.addAdmin(req.body?.username,req.body?.password);store.log(req.visitor,'admin_created',{username,by:store.adminUsername(cookies(req).k9_admin)},true);res.status(201).json({success:true,username});}catch(e){res.status(400).json({error:e.message});}
  });
  router.get('/admin/activity',(req,res)=>{if(!req.admin)return res.status(401).json({error:'Log in as admin to view activity.'});res.json({events:store.recent()});});
  router.get('/visitor/state',(req,res)=>{store.log(req.visitor,'page_view',{path:'/'},req.admin);res.json(store.state(req.visitor,req.admin));});
  router.post('/visitor/event',(req,res)=>{
    const allowed=['click','stake_change','currency_change','page_hidden','page_exit','claim_click','popup_open','popup_close'];
    if(!allowed.includes(req.body.type))return res.status(400).json({error:'Unknown activity type.'});
    store.log(req.visitor,req.body.type,{target:String(req.body.target||'').slice(0,100),value:String(req.body.value||'').slice(0,160)},req.admin);res.json({success:true});
  });
  router.post('/flight/start',(req,res)=>{try{res.json(store.start(req.visitor,req.admin,req.body.attemptNumber,Number(req.body.betAmount),req.body.currency));}catch(e){res.status(e.status||500).json({error:e.message,state:store.state(req.visitor,req.admin)});}});
  router.post('/flight/cashout',(req,res)=>{try{res.json(store.cashout(req.visitor,req.body.sessionToken,req.admin));}catch(e){res.status(e.status||500).json({error:e.message});}});
  router.post('/flight/complete',(req,res)=>{store.settle();res.json({success:true,state:store.state(req.visitor,req.admin)});});
  return {router,isAdmin};
}
module.exports={createVisitorAPI};
