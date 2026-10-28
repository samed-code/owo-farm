const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('discord.js-selfbot-v13');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OwO Selfbot & Türk Şiirleri Paneli</title>
      <style>
        body { background: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 30px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); width: 100%; max-width: 400px; box-sizing: border-box; }
        h2 { margin-top: 0; color: #38bdf8; text-align: center; font-size: 22px; }
        label { display: block; margin-top: 15px; font-size: 14px; color: #94a3b8; }
        input { width: 100%; padding: 12px; margin-top: 5px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; box-sizing: border-box; font-size: 14px; }
        button { width: 100%; margin-top: 20px; padding: 12px; background: #0284c7; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 16px; transition: background 0.2s; }
        button:hover { background: #0ea5e9; }
        #status { margin-top: 15px; text-align: center; font-size: 14px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>OwO Selfbot Kontrol</h2>
        <label>Discord Token</label>
        <input type="password" id="token" placeholder="Token giriniz...">
        <label>Kanal ID</label>
        <input type="text" id="channelId" placeholder="Kanal ID giriniz...">
        <button onclick="startBot()">Botu Başlat & Şiir Modu Aç</button>
        <div id="status">Durum: Bekliyor...</div>
      </div>
      <script src="/socket.io/socket.io.js"></script>
      <script>
        const socket = io();
        function startBot() {
          const token = document.getElementById('token').value;
          const channelId = document.getElementById('channelId').value;
          if(!token || !channelId) {
            alert('Lütfen token ve kanal ID girin!');
            return;
          }
          socket.emit('start-bot', { token, channelId });
          document.getElementById('status').innerText = 'Durum: Başlatma isteği gönderildi...';
        }
        socket.on('bot-status', (data) => {
          document.getElementById('status').innerText = 'Durum: ' + data.message;
          if(data.success) {
            document.getElementById('status').style.color = '#4ade80';
          } else {
            document.getElementById('status').style.color = '#f87171';
          }
        });
      </script>
    </body>
    </html>
  `);
});

io.on('connection', (socket) => {
  console.log('Bir kullanıcı panele bağlandı.');
  let activeClient = null;

  socket.on('start-bot', async (data) => {
    const { token, channelId } = data;
    if (activeClient) {
      try { activeClient.destroy(); } catch(e){}
    }

    const client = new Client({ checkUpdate: false });
    activeClient = client;

    client.on('ready', () => {
      socket.emit('bot-status', { success: true, message: `Giriş yapıldı: ${client.user.tag}` });
      
      setInterval(async () => {
        try {
          const channel = await client.channels.fetch(channelId);
          if (channel) {
            await channel.send('owo hunt');
            setTimeout(async () => {
              await channel.send('owo battle');
            }, 3000);
          }
        } catch (err) {
          console.log('Hunt/Battle hatası:', err.message);
        }
      }, 15000);

      const poems = [
        "Seni düşünmek güzel şey, ümitli şey / Dünyanın en güzel sesini, en güzel şarkısını dinlemek gibi bir şey... (Nazım Hikmet)",
        "Ne hasta bekler sabahı, / Ne taze ölüyü mezar, / Ne de şeytan günahı, / Seni beklediğim kadar. (Necip Fazıl)",
        "Gözlerin doğuyor gecelerime, / Yıldızlar sönüyor birer birer. / Ben seni bir ömür değil, / Mahşere kadar seveceğim.",
        "Ayrılıktan havada bir koku var, / Seni ne kadar sevdiğimi bir ben bilirim, bir de sensizliğe yandığım bu şehir.",
        "Sen benim sarhoşluğumsun, ne anlarsın? / Dinmeyen ağrımsın kalbimde, nereden bileceksin?"
      ];

      setInterval(async () => {
        try {
          const channel = await client.channels.fetch(channelId);
          if (channel) {
            const randomPoem = poems[Math.floor(Math.random() * poems.length)];
            await channel.send(randomPoem);
          }
        } catch (err) {
          console.log('Şiir gönderme hatası:', err.message);
        }
      }, 900000);
    });

    client.login(token).catch(err => {
      socket.emit('bot-status', { success: false, message: 'Giriş Başarısız: Token geçersiz!' });
    });
  });
});

server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda aktif!`);
});
