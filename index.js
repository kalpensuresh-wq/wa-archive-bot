const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const pino = require('pino');

const OWNER_ID = 123456789; // ←←← ИЗМЕНИ! Напиши @userinfobot в Telegram
const TG_TOKEN = 'ТОКЕН_ИЗ_BOTFATHER'; // ←←← ИЗМЕНИ!

const VIDEO_PATH = './video.mp4';

const tgBot = new TelegramBot(TG_TOKEN, { polling: true });
const sockets = {};
const archivedChats = { acc1: [], acc2: [], acc3: [] };
const indices = { acc1: 0, acc2: 0, acc3: 0 };
const intervals = {};

// Обфускация текста (анти-бан)
function obfuscate(text) {
  const map = {'а':'a','б':'6','в':'B','г':'r','д':'g','е':'e','ё':'e','ж':'Ж','з':'3','и':'u','й':'u','к':'k','л':'JI','м':'M','н':'H','о':'o','п':'n','р':'p','с':'c','т':'T','у':'y','ф':'Ф','х':'x','ц':'u','ч':'4','ш':'w','щ':'w','ъ':'','ы':'bl','ь':'b','э':'3','ю':'yu','я':'ya','А':'A','Б':'B','В':'B','Г':'r','Д':'g','Е':'E','Ё':'E','З':'3','И':'U','Й':'U','К':'K','Л':'JI','М':'M','Н':'H','О':'O','П':'N','Р':'P','С':'C','Т':'T','У':'Y','Ф':'Ф','Х':'X','Ц':'U','Ч':'4','Ш':'W','Щ':'W','Ы':'Bl','Ь':'b','Э':'3','Ю':'Yu','Я':'Ya'};
  return text.split('').map(c => map[c] || c).join('');
}

// Получить все чаты из архива
function getArchivedChats(sock) {
  if (!sock?.store?.chats) return [];
  return Array.from(sock.store.chats.values())
    .filter(chat => chat.archive === true)
    .map(chat => chat.id);
}

// Запуск WhatsApp аккаунта
async function startWA(name, phone = null) {
  const sessionPath = `./sessions/${name}`;
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const logger = pino({ level: 'silent' });

  const sock = makeWASocket({
    auth: state,
    logger: logger,
    printQRInTerminal: false,
    browser: ['Chrome', 'Safari', '10.15.7'],
    markOnlineOnConnect: false
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => {
    if (update.connection === 'open') {
      console.log(`✅ ${name} подключён`);
      tgBot.sendMessage(OWNER_ID, `✅ ${name} успешно подключён!`);
      refreshArchive(name, sock);
      startSender(name, sock);
    }
  });

  sockets[name] = sock;

  if (phone) {
    const code = await sock.requestPairingCode(phone.replace(/[^0-9]/g, ''));
    tgBot.sendMessage(OWNER_ID, `🔑 Код для \( {name} ( \){phone}):\n\n${code}\n\nWhatsApp → Связанные устройства → Ввести код`);
  }
}

// Обновить список архивных чатов
function refreshArchive(name, sock) {
  archivedChats[name] = getArchivedChats(sock);
  tgBot.sendMessage(OWNER_ID, `📁 ${name}: ${archivedChats[name].length} чатов в архиве`);
}

// Рассылка каждые 10 минут
function startSender(name, sock) {
  if (intervals[name]) clearInterval(intervals[name]);
  intervals[name] = setInterval(() => {
    const chats = archivedChats[name];
    if (chats.length === 0) return;

    const idx = indices[name];
    const jid = chats[idx];
    const rawText = "Привет из архива! Сейчас {time} 🔥".replace('{time}', new Date().toLocaleTimeString('ru-RU'));
    const text = obfuscate(rawText);

    sock.sendMessage(jid, { 
      video: fs.readFileSync(VIDEO_PATH),
      caption: text,
      mimetype: 'video/mp4'
    }).then(() => console.log(`✅ ${name} → чат \( {idx+1}/ \){chats.length}`))
      .catch(e => console.log(`Ошибка ${name}:`, e.message));

    indices[name] = (idx + 1) % chats.length;
  }, 600000);
}

// Telegram команды
tgBot.onText(/\/start/, (msg) => {
  if (msg.from.id !== OWNER_ID) return;
  tgBot.sendMessage(msg.chat.id, `🚀 Бот запущен!\n\nКоманды:\n/connect acc1 +77001234567\n/refresh acc1\n/listarchive acc1\n/status`);
});

tgBot.onText(/\/connect (.+?) (.+)/, async (msg, match) => {
  if (msg.from.id !== OWNER_ID) return;
  const [_, name, phone] = match;
  await startWA(name, phone);
});

tgBot.onText(/\/refresh (.+)/, (msg, match) => {
  if (msg.from.id !== OWNER_ID) return;
  const name = match[1];
  if (sockets[name]) refreshArchive(name, sockets[name]);
});

tgBot.onText(/\/listarchive (.+)/, (msg, match) => {
  if (msg.from.id !== OWNER_ID) return;
  const name = match[1];
  tgBot.sendMessage(msg.chat.id, `📁 ${name}: \( {archivedChats[name].length} чатов\n\n \){archivedChats[name].join('\n')}`);
});

tgBot.onText(/\/status/, (msg) => {
  if (msg.from.id !== OWNER_ID) return;
  let txt = '📊 Статус:\n';
  ['acc1','acc2','acc3'].forEach(n => txt += `${n}: ${sockets[n] ? '✅' : '⛔'} | ${archivedChats[n].length} чатов\n`);
  tgBot.sendMessage(msg.chat.id, txt);
});

// Keep-alive
const app = express();
app.get('/', (req, res) => res.send('✅ Бот работает'));
app.listen(3000);

console.log('🤖 Бот запущен');

startWA('acc1');
startWA('acc2');
startWA('acc3');
