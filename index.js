const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Veritabanları ve Süre Sınırları
const bakiye = new Map();
const günlükCooldown = new Set();

// Sadece Whitelist'teki kişiler sınırsız para basabilir (İlk ID eklendi)
const whitelist = new Set(['1053561056649297960']);

// Slot Emojileri (Patlıcan, Kanada Bayrağı, Kiraz)
const slotEmojileri = ['🍆', '🍁', '🍒'];

// RENDER & UPTIME ROBOT İÇİN WEB SUNUCU
const app = express();
app.get('/', (req, res) => res.send('Kanada Ekonomi Botu V2 7/24 Aktif!'));
app.listen(process.env.PORT || 3000);

client.on('ready', () => {
    console.log(`${client.user.tag} Kanada Ekonomi Botu Aktif!`);
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
            return message.reply('⚠️ Bugünlük devlet yardımını zaten aldın çırak! Yarın tekrar gel. 🍁');
        }

        // 600 ile 1500 arası rastgele Kanada Coin
        const odul = Math.floor(Math.random() * (1500 - 600 + 1)) + 600;
        const mevcutBakiye = bakiye.get(userId) || 0;
        bakiye.set(userId, mevcutBakiye + odul);

        // 24 Saatlik bekleme süresi
        günlükCooldown.add(userId);
        setTimeout(() => günlükCooldown.delete(userId), 24 * 60 * 60 * 1000);

        return message.reply(`🎁 Günlük ödülünü aldın! Hesabına **${odul} Kanada Coin** 🍁 eklendi. Toplam: **${bakiye.get(userId)} Kanada Coin**`);
    }

    // --- !SLOT KOMUTU (!slot <miktar>) ---
    if (command === 'slot' || command === 's') {
        const miktar = parseInt(args[0]);
        const userBakiye = bakiye.get(userId) || 0;

        if (!miktar || isNaN(miktar) || miktar <= 0) {
            return message.reply('⚠️ Slot oynamak için geçerli bir miktar girmeyi dene Örn: `!slot 100`');
        }

        if (userBakiye < miktar) {
            return message.reply(`⚠️ Kanada bankalarında yeterli bakiyen yok! Cüzdanında sadece **${userBakiye} Kanada Coin** 🍁 var.`);
        }

        // Parayı baştan düşelim
        bakiye.set(userId, userBakiye - miktar);

        // Rastgele 3 emoji seçimi
        const e1 = slotEmojileri[Math.floor(Math.random() * slotEmojileri.length)];
        const e2 = slotEmojileri[Math.floor(Math.random() * slotEmojileri.length)];
        const e3 = slotEmojileri[Math.floor(Math.random() * slotEmojileri.length)];

        // İlk animasyonlu mesaj
        const slotMesaj = await message.reply(`🎰 **___ SLOTS ___**\n[ 🔄 | 🔄 | 🔄 ] **${message.author.username}** bet **${miktar}**...`);

        setTimeout(() => {
            // Kazanma veya kaybetme kontrolü (3'ü de aynıysa kazanır)
            if (e1 === e2 && e2 === e3) {
                const kazanc = miktar * 4; // 4 katı ödül
                bakiye.set(userId, bakiye.get(userId) + kazanc);
                slotMesaj.edit(`🎰 **___ SLOTS ___**\n[ ${e1} | ${e2} | ${e3} ] **${message.author.username}** bet **${miktar}** and **WON ${kazanc} KANADA COIN!** 🍁🎉`);
            } else if (e1 === e2 || e2 === e3 || e1 === e3) {
                // 2'si tutarsa parayı amorti eder (Geri iade)
                bakiye.set(userId, bakiye.get(userId) + miktar);
                slotMesaj.edit(`🎰 **___ SLOTS ___**\n[ ${e1} | ${e2} | ${e3} ] **${message.author.username}** bet **${miktar}** (2'si tuttu, Kanada Coin'lerin iade edildi 🍁).`);
            } else {
                slotMesaj.edit(`🎰 **___ SLOTS ___**\n[ ${e1} | ${e2} | ${e3} ] **${message.author.username}** bet **${miktar}** and won nothing... :c`);
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

        // Attığın hareketli para emojisi ID'si
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

    // --- WHITELIST ÖZEL PARA BASMA KOMUTU (!paraekle <@kullanıcı> <miktar>) ---
    if (command === 'paraekle') {
        if (!whitelist.has(userId)) {
            return message.reply('❌ Bu komutu sadece Whitelist (VIP) kişileri kullanabilir kanka!');
        }

        const hedef = message.mentions.users.first();
        const eklenecekMiktar = parseInt(args[1]); // Etiketlemeden sonraki argümanı alıyoruz

        if (!hedef || !eklenecekMiktar || isNaN(eklenecekMiktar)) {
            return message.reply('⚠️ Yanlış kullanım! Örn: `!paraekle @kullanıcı 50000`');
        }

        const hedefBakiye = bakiye.get(hedef.id) || 0;
        bakiye.set(hedef.id, hedefBakiye + eklenecekMiktar);

        return message.reply(`✅ **Whitelist Sistemi**: **${hedef.username}** hesabına havadan **${eklenecekMiktar} Kanada Coin** 🍁 basıldı!`);
    }
});

client.login(process.env.TOKEN);
