import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';
import QRCode from 'qrcode';

const app = express();
const PORT = process.env.PORT || 3000;
let lastQr = '';

app.get('/', async (req,res)=>{
  if(!lastQr) return res.send('<h1>البوت خدام... تسنى الـ QR يبان فـ Logs</h1>');
  const img = await QRCode.toDataURL(lastQr);
  res.send(`<h2>سكاني هاد الـ QR بالواتساب الثاني</h2><img src="${img}" width="300"/><p>واتساب > الأجهزة المرتبطة > ربط جهاز</p>`);
});
app.listen(PORT, ()=> console.log('Web OK'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox','--disable-setuid-sandbox'] }
});

client.on('qr', qr => {
  lastQr = qr;
  qrcode.generate(qr, {small: true});
  console.log('QR جاهز - شوف / في الموقع');
});

client.on('ready', () => console.log('✅ البوت خدام!'));

client.on('message', async msg => {
  if(msg.fromMe) return;
  try {
    const text = msg.body;
    if(!text) return;
    const prompt = `انت مساعد دراسي ذكي، جاوب بالدارجة المغربية باختصار ومفهوم. السؤال: ${text}`;
    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    client.sendMessage(msg.from, reply);
  } catch(e){ console.log(e); }
});

client.initialize();
