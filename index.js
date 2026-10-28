const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');

const app = express();
let lastQR = null;

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: '/tmp/wabot' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process']
  }
});

client.on('qr', async qr => {
  lastQR = await qrcode.toDataURL(qr);
  console.log('QR جاهز');
});
client.on('ready', () => { console.log('✅ مربوط!'); lastQR=null; });

client.on('message', async msg => {
  console.log('📩 جا ميساج:', msg.body, ' من:', msg.from);
  if(msg.fromMe) return;
  try {
    await msg.reply('✅ البوت خدام! وصلني: ' + msg.body);
    console.log('🤖 جاوبنا');
  } catch(e){ console.log('Error reply:', e.message); }
});

app.get('/', (req,res)=>{
  if(lastQR) res.send(`<img src="${lastQR}" width="300"><script>setTimeout(()=>location.reload(),10000)</script>`);
  else res.send('<h1>✅ البوت مربوط وخدّام</h1>');
});

app.listen(10000);
client.initialize();
