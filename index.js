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
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-extensions'
    ]
  }
});

client.on('qr', async qr => {
  lastQR = await qrcode.toDataURL(qr);
  console.log('QR جاهز');
});

client.on('ready', () => {
  console.log('✅ البوت مربوط!');
  lastQR = null;
});

client.on('message', async msg => {
  if(msg.fromMe) return;
  if(msg.from.includes('@g.us')) return;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(msg.body);
    await msg.reply(result.response.text());
  } catch(e) {
    console.log('Gemini error:', e.message);
  }
});

// باش ما يبقاش عامر فالميموار
client.on('disconnected', () => {
  client.destroy();
  client.initialize();
});

app.get('/', (req, res) => {
  if(lastQR) {
    res.send(`<center><h2>سكاني QR</h2><img src="${lastQR}" width="300"/><script>setTimeout(()=>location.reload(),15000)</script></center>`);
  } else {
    res.send('<h1>✅ البوت خدام! صيفط ميساج دابا</h1>');
  }
});

app.listen(10000);
client.initialize();
