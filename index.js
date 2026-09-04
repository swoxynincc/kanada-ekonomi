const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const express = require('express');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

// Veritabanları ve Süre Sınırları
const bakiye = new Map();
const günlükCooldown = new Set();

// Whitelist VIP kullanıcılar
const whitelist = new Set(['1053561056649297960']);

// Slot Emojileri (Patlıcan, Kanada Bayrağı, Kiraz)
const slotEmojileri = ['🍆', '🍁', '🍒'];

// RENDER & UPTIME ROBOT İÇİN WEB SUNUCU
const app = express();
app.get('/', (req, res) => res.send('Kanada Ekonomi Botu V2 (Sesli) 7/24 Aktif!'));
app.listen(process.env.PORT || 3000);

client.on('ready', () => {
    console.log(`${client.user.tag} Kanada Ekonomi ve Ses Sistemi Aktif!`);

    const channelId = '1543153290823475211'; 
    const guildId = '1540484134361636884';   

    const connectToVoice = () => {
        try {
            joinVoiceChannel({
                channelId: channelId,
                guildId: guildId,
                adapterCreator: client.guilds.cache.get(guildId).voiceAdapterCreator,
                selfDeaf: true,
                selfMute: true
            });
            console.log("Ekonomi botu ses kanalına başarıyla bağlandı.");
        } catch (error) {
            console.error("Sese bağlanırken hata oluştu:", error);
        }
    };

    connectToVoice();
    setInterval(() => { connectToVoice(); }, 15 * 60 * 1000);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

    // --- !PARA VEYA !BAKİYE KOMUTU ---
    if (command === 'para' || command === 'bakiye') {
        const mevcutBakiye = bakiye.get(userId) || 0;
        return message.reply(`💰 **${message.author.username}**, mevcut cüzdanın: **${mevcutBakiye} Kanada Coin** 🍁`);
    }

    // --- !GÜNLÜK VEYA !DAİLY KOMUTU ---
    if (command === 'günlük' || command === 'daily') {
        if (günlükCooldown.has(userId)) {
            return message.reply('⚠️ Bugünlük devlet yardımını zaten aldın kanka! Yarın tekrar gel. 🍁');
        }

        const odul = Math.floor(Math.random() * (1500 - 600 + 1)) + 600;
        const mevcutBakiye = bakiye.get(userId) || 0;
        bakiye.set(userId, mevcutBakiye + odul);

        günlükCooldown.add(userId);
        setTimeout(() => günlükCooldown.delete(userId), 24 * 60 * 60 * 1000);

        return message.reply(`🎁 Günlük ödülünü aldın! Hesabına **${odul} Kanada Coin** 🍁 eklendi. Toplam: **${bakiye.get(userId)} Kanada Coin**`);
    }

    // --- !SLOT KOMUTU (OwO Kasa Tasarımı) ---
    if (command === 'slot' || command === 's') {
        const miktar = parseInt(args[0]); // İlk argümanı sayıya çeviriyoruz
        const userBakiye = bakiye.get(userId) || 0;

        if (!miktar || isNaN(miktar) || miktar <= 0) {
            return message.reply('⚠️ Slot oynamak için geçerli bir miktar gir kanka! Örn: `!slot 100`');
        }

        if (userBakiye < miktar) {
            return message.reply(`⚠️ Kanada bankalarında yeterli bakiyen yok! Cüzdanında sadece **${userBakiye} Kanada Coin** 🍁 var.`);
        }

        bakiye.set(userId, userBakiye - miktar);

        const e1 = slotEmojileri[Math.floor(Math.random() * slotEmojileri.length)];
        const e2 = slotEmojileri[Math.floor(Math.random() * slotEmojileri.length)];
        const e3 = slotEmojileri[Math.floor(Math.random() * slotEmojileri.length)];

        const slotMesaj = await message.reply(`**___SLOTS___**\n║ 🔄 ║ 🔄 ║ 🔄 ║  **${message.author.username}** bet 🪙 **${miktar}**...\n║        ║        ║        ║`);

        setTimeout(() => {
            if (e1 === '🍒' && e2 === '🍒' && e3 === '🍒') {
                const kazanc = Math.floor(miktar * 1.5);
                bakiye.set(userId, bakiye.get(userId) + kazanc);
                slotMesaj.edit(`**___SLOTS___**\n║ ${e1} ║ ${e2} ║ ${e3} ║  **${message.author.username}** bet 🪙 **${miktar}**\n║        ║        ║        ║  and **won ${kazanc} Kanada Coin!** 🍒🎉`);
            
            } else if (e1 === '🍆' && e2 === '🍆' && e3 === '🍆') {
                bakiye.set(userId, miktar);
                slotMesaj.edit(`**___SLOTS___**\n║ ${e1} ║ ${e2} ║ ${e3} ║  **${message.author.username}** bet 🪙 **${miktar}**\n║        ║        ║        ║  (3 Patlıcan geldi, paran iade edildi 🍆).`);
            
            } else if (e1 === e2 && e2 === e3) {
                const kazanc = miktar * 2;
                bakiye.set(userId, bakiye.get(userId) + kazanc);
                slotMesaj.edit(`**___SLOTS___**\n║ ${e1} ║ ${e2} ║ ${e3} ║  **${message.author.username}** bet 🪙 **${miktar}**\n║        ║        ║        ║  and **won ${kazanc} Kanada Coin!** 🍁🎉`);
            
            } else {
                slotMesaj.edit(`**___SLOTS___**\n║ ${e1} ║ ${e2} ║ ${e3} ║  **${message.author.username}** bet 🪙 **${miktar}**\n║        ║        ║        ║  and won nothing... :c`);
            }
        }, 1500);
    }

    // --- !CF (COİNFLİP) KOMUTU ---
    if (command === 'cf' || command === 'coinflip') {
        const miktar = parseInt(args[0]);
        const userBakiye = bakiye.get(userId) || 0;

        if (!miktar || isNaN(miktar) || miktar <= 0) {
            return message.reply('⚠️ Yazı tura oynamak için miktar gir kanka! Örn: `!cf 100`');
        }

        if (userBakiye < miktar) {
            return message.reply(`⚠️ Yetersiz bakiye! Cüzdanında sadece **${userBakiye} Kanada Coin** 🍁 var.`);
        }

        bakiye.set(userId, userBakiye - miktar);

        const cfMesaj = await message.reply(`<a:owo:1525940141615480874> Para dönüyor...`);

        setTimeout(() => {
            const sonuc = Math.random() < 0.5 ? 'kazandı' : 'kaybetti';

            if (sonuc === 'kazandı') {
                const kazanc = miktar * 2;
                bakiye.set(userId, bakiye.get(userId) + kazanc);
                cfMesaj.edit(`🪙 **${message.author.username}** ${miktar} Kanada Coin ile yazı tura attı ve **${kazanc} Kanada Coin** 🍁 kazandı!`);
            } else {
                cfMesaj.edit(`🪙 **${message.author.username}** ${miktar} Kanada Coin ile yazı tura attı ve **hepsini kaybetti...** :c`);
            }
        }, 2000);
    }

    // --- WHITELIST ÖZEL PARA BASMA KOMUTU ---
    if (command === 'paraekle') {
        if (!whitelist.has(userId)) {
            return message.reply('❌ Bu komutu sadece Whitelist (VIP) kişileri kullanabilir kanka!');
        }

        const hedef = message.mentions.users.first();
        // İkinci kelimeyi (para miktarını) garantiye alıyoruz
        const eklenecekMiktar = parseInt(args[1]); 

        if (!hedef || !eklenecekMiktar || isNaN(eklenecekMiktar)) {
            return message.reply('⚠️ Yanlış kullanım! Örn: `!paraekle @kullanıcı 50000`');
        }

        const hedefBakiye = bakiye.get(hedef.id) || 0;
        bakiye.set(hedef.id, hedefBakiye + eklenecekMiktar);

        return message.reply(`✅ **Whitelist Sistemi**: **${hedef.username}** hesabına havadan **${eklenecekMiktar} Kanada Coin** 🍁 basıldı!`);
    }
});

client.login(process.env.TOKEN);
