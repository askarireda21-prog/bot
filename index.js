import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';
import QRCode from 'qrcode';

const app = express();
let lastQr = '';
const PORT = process.env.PORT || 3000;

app.get('/', async (req,res)=>{
  try {
    if(!lastQr) return res.send('<h1>البوت كيوجد... عاود ريفريش بعد 30 ثانية</h1><p>Logs فـ Render</p>');
    const img = await QRCode.toDataURL(lastQr);
    res.send(`<h2>سكاني هاد QR بالنمرة الثانية</h2><img src="${img}" width="300"/><br/>واتساب > الاجهزة المرتبطة > ربط جهاز`);
  } catch(e){ res.send('تسناه شوية...'+e.message); }
});
app.listen(PORT, ()=> console.log('Web OK on '+PORT));

if(!process.env.GEMINI_KEY){
  console.log('⚠️ ما كاينش GEMINI_KEY فـ Environment Variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY || 'test');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { 
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--single-process'] 
  }
});

client.on('qr', qr => {
  lastQr = qr;
  console.log('QR جاهز!');
  console.log(qr);
});

client.on('ready', () => console.log('✅ البوت خدام!'));
client.on('auth_failure', m => console.log('Auth fail', m));

client.on('message', async msg => {
  if(msg.fromMe) return;
  if(msg.body.length < 1) return;
  try {
    console.log('جات رسالة: '+msg.body);
    const prompt = `جاوب بالدارجة المغربية باختصار: ${msg.body}`;
    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    await client.sendMessage(msg.from, reply);
  } catch(e){ 
    console.log('Error reply', e.message);
    try{ await client.sendMessage(msg.from, 'ثانية... كانجرب نصلح'); }catch{}
  }
});

client.initialize().catch(e=>console.log('Init error', e));
