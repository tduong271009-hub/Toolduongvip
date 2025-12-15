
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const fetch = (...a)=>import('node-fetch').then(({default:f})=>f(...a));

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO);

const Key = mongoose.model('Key', new mongoose.Schema({
  key:String, expiredAt:Number, createdAt:Number,
  deviceId:String, ip:String, active:Boolean
}));

const ADMIN={user:'duongvip9',pass:'271009@'};

app.post('/admin/create-key',async(req,res)=>{
 const {user,pass,days}=req.body;
 if(user!==ADMIN.user||pass!==ADMIN.pass) return res.sendStatus(403);
 const key='GB68-'+crypto.randomBytes(4).toString('hex').toUpperCase();
 const expiredAt=Date.now()+days*86400000;
 await Key.create({key,expiredAt,createdAt:Date.now(),active:true});
 res.json({key,expiredAt});
});

app.post('/check-key',async(req,res)=>{
 const {key,deviceId}=req.body;
 const ip=req.headers['x-forwarded-for']||req.socket.remoteAddress;
 const k=await Key.findOne({key,active:true});
 if(!k||Date.now()>k.expiredAt) return res.json({ok:false});
 if(!k.deviceId){k.deviceId=deviceId;k.ip=ip;await k.save();}
 if(k.deviceId!==deviceId||k.ip!==ip) return res.json({ok:false});
 res.json({ok:true,remain:k.expiredAt-Date.now()});
});

app.post('/taixiu',async(req,res)=>{
 const {key,deviceId}=req.body;
 const k=await Key.findOne({key,deviceId,active:true});
 if(!k||Date.now()>k.expiredAt) return res.sendStatus(403);
 const r=await fetch('https://six8-api-cug7.onrender.com/api/taixiu');
 res.json(await r.json());
});

app.listen(3000);
