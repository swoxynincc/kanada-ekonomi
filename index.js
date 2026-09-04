const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
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

const bakiye = new Map();
const günlükCooldown = new Set();
const whitelist = new Set(['1053561056649297960']);
const slotEmojileri = ['🍆', '🍁', '🍒'];

const app = express();
app.get('/', (req, res) => res.send('Kanada Ekonomi Botu Aktif!'));
app.listen(process.env.PORT || 3000);

client.on('ready', () => {
    console.log(`${client.user.tag} Aktif!`);
    
    // OYNUYOR DURUMU
    client.user.setPresence({
        activities: [{ name: 'Developed By Swoxyn', type: ActivityType.Playing }],
        status: 'online',
    });

    const channelId = '1543153290823475211'; const guildId = '1540484134361636884';   
    const connectToVoice = () => { try { joinVoiceChannel({ channelId, guildId, adapterCreator: client.guilds.cache.get(guildId).voiceAdapterCreator, selfDeaf: true, selfMute: true }); } catch (e) {} };
    connectToVoice(); setInterval(connectToVoice, 15 * 60 * 1000);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

    if (command === 'para' || command === 'bakiye') {
        return message.reply(`💰 **${message.author.username}**, mevcut cüzdanın: **${bakiye.get(userId) || 0} Kanada Coin** 🍁`);
    }
    if (command === 'günlük' || command === 'daily') {
        if (günlükCooldown.has(userId)) return message.reply('⚠️ Bugünlük devlet yardımını aldın zaten!');
        const odul = Math.floor(Math.random() * (1500 - 600 + 1)) + 600;
        bakiye.set(userId, (bakiye.get(userId) || 0) + odul);
        günlükCooldown.add(userId);
        setTimeout(() => günlükCooldown.delete(userId), 24 * 60 * 60 * 1000);
        return message.reply(`🎁 Hesabına **${odul} Kanada Coin** 🍁 eklendi!`);
    }
    if (command === 'slot' || command === 's') {
        const miktar = parseInt(args); if (!miktar || isNaN(miktar) || miktar <= 0 || miktar > 50000) return message.reply('⚠️ Miktar gir! (Max 50k)');
        if ((bakiye.get(userId) || 0) < miktar) return message.reply('⚠️ Yetersiz bakiye!');
        bakiye.set(userId, bakiye.get(userId) - miktar);
        const e1 = slotEmojileri[Math.floor(Math.random() * slotEmojileri.length)];
        const e2 = slotEmojileri[Math.floor(Math.random() * slotEmojileri.length)];
        const e3 = slotEmojileri[Math.floor(Math.random() * slotEmojileri.length)];
        const sm = await message.reply(`**___SLOTS___**\n║ 🔄 ║ 🔄 ║ 🔄 ║  **${message.author.username}** bet 🪙 **${miktar}**...`);
        setTimeout(() => {
            if (e1 === '🍒' && e2 === '🍒' && e3 === '🍒') { bakiye.set(userId, bakiye.get(userId) + Math.floor(miktar * 1.5)); sm.edit(`**___SLOTS___**\n║ 🍒 ║ 🍒 ║ 🍒 ║ won **${Math.floor(miktar * 1.5)}**! 🎉`); }
            else if (e1 === '🍆' && e2 === '🍆' && e3 === '🍆') { bakiye.set(userId, bakiye.get(userId) + miktar); sm.edit(`**___SLOTS___**\n║ 🍆 ║ 🍆 ║ 🍆 ║ iade edildi! 🍆`); }
            else if (e1 === e2 && e2 === e3) { bakiye.set(userId, bakiye.get(userId) + miktar * 2); sm.edit(`**___SLOTS___**\n║ ${e1} ║ ${e2} ║ ${e3} ║ won **${miktar * 2}**! 🍁🎉`); }
            else { sm.edit(`**___SLOTS___**\n║ ${e1} ║ ${e2} ║ ${e3} ║ won nothing... :c`); }
        }, 1500);
    }
    if (command === 'cf' || command === 'coinflip') {
        const miktar = parseInt(args); if (!miktar || isNaN(miktar) || miktar <= 0 || miktar > 100000) return message.reply('⚠️ Miktar gir! (Max 100k)');
        if ((bakiye.get(userId) || 0) < miktar) return message.reply('⚠️ Yetersiz bakiye!');
        bakiye.set(userId, bakiye.get(userId) - miktar);
        const cfm = await message.reply(`<a:owo:1525940141615480874> Para dönüyor...`);
        setTimeout(() => {
            if (Math.random() < 0.5) { bakiye.set(userId, bakiye.get(userId) + miktar * 2); cfm.edit(`🪙 Kazandın! **${miktar * 2} Kanada Coin** 🍁`); }
            else { cfm.edit(`🪙 Hepsini kaybettin kanka... :c`); }
        }, 2000);
    }
    if (command === 'paraekle') {
        if (!whitelist.has(userId)) return message.reply('❌ Yetkin yok!');
        const hedef = message.mentions.users.first(); const eklenecek = parseInt(args);
        if (!hedef || !eklenecek || isNaN(eklenecek) || eklenecek > 10000000) return message.reply('⚠️ Geçerli miktar gir! (Max: 10M)');
        bakiye.set(hedef.id, (bakiye.get(hedef.id) || 0) + eklenecek); return message.reply(`✅ **${hedef.username}** hesabına **${eklenecek} Kanada Coin** 🍁 eklendi!`);
    }
    if (command === 'parasıfırla') {
        if (!whitelist.has(userId)) return message.reply('❌ Yetkin yok!');
        const hedef = message.mentions.users.first(); if (!hedef) return message.reply('⚠️ Birini etiketle.');
        bakiye.set(hedef.id, 0); return message.reply(`🗑️ **${hedef.username}** bakiyesi sıfırlandı.`);
    }
});
client.login(process.env.TOKEN);
