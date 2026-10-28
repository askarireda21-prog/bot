const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
let lastQR = null;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: '/tmp/wabot' }),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  }
});

client.on('qr', async (qr) => {
  console.log('QR جاهز!');
  lastQR = await qrcode.toDataURL(qr);
});

client.on('ready', () => {
  console.log('✅ البوت مربوط واجد!');
  lastQR = null;
});

client.on('message', async msg => {
  if(msg.fromMe) return;
  if(msg.from.includes('@g.us')) return;
  console.log('📩 جات رسالة:', msg.body);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(msg.body);
    const reply = result.response.text();
    console.log('🤖 الرد:', reply);
    await msg.reply(reply);
  } catch(e) {
    console.log('❌ إيرور Gemini:', e.message);
  }
});

app.get('/', (req, res) => {
  if(lastQR) {
    res.send(`<html><body style="text-align:center"><h1>سكاني هاد QR دابا</h1><img src="${lastQR}" style="width:300px"/><script>setTimeout(()=>location.reload(), 15000)</script></body></html>`);
  } else {
    res.send('<h1>✅ البوت خدام ومربوط! صيفط ميساج للهاتف الثاني دابا</h1>');
  }
});

app.listen(10000, () => console.log('Server on 10000'));
client.initialize();
