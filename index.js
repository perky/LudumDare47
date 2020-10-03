// Import the discord.js module
const Discord = require('discord.js');
// Create an instance of a Discord client
const client = new Discord.Client();
const secrets = require('./secrets.js');

// VOICE STUFF
const { OpusEncoder } = require('@discordjs/opus');
const fs = require('fs');
// Create the encoder.
// Specify 48kHz sampling rate and 2 channel size.
const encoder = new OpusEncoder(48000, 2);

const guildId = '761906017654538260';
const homeChannelId = '761906017654538264';
const nonEmojiPattern = /[A-Za-z0-9]/u;
const roomRoles = ['🌼', '🌵', '🏰', '💀', '⛏', '🌋', '⚓'];
const clockfaces = ['🕛','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚']
const channelIds = {
    '🌼': '761910391861149697',
    '🌼🎵': '761970667918065704',
    '🌵': '761945372179955792',
    '🌵🎵': '761986095386722344',
    '🏰': '761945788107980821',
    '🏰🎵': '761986231978426411',
    '💀': '761967103434555415',
    '💀🎵': '761986741917581353',
    '⚓': '761985696709214238',
    '⚓🎵': '761986507355455499',
    '⛏': '761985528224022548',
    '⛏🎵': '761986307097493575',
    '🌋': '761985625363578910',
    '🌋🎵': '761986404711530556'
};

let cache = {};
function SetupCache() {
    cache = {
        roles: {},
        teams: {},
        locations: {},
        enemies: [],
        castleLocked: false,
        tick: 0,
        clockIndex: 0
    };
}

const timeline = {
    [1]: function() {
        // LOCK CASTLE
        cache.castleLocked = true;
        SendMessage('🏰', '🏰🔒');
    },
    [2]: () => {
        SendMessage('🌼', '[Boar] 🪓 👉 💀');
    },
    [3]: () => {
        SendMessage('🌼', '30 Wild Boars appear!! They are agressive and start attacking you.');
        cache.enemies.push({
            type: 'boar',
            name: 'Wild Boar',
            plural: 'Wild Boars',
            amount: 30,
            room: '🌼'
        });
        PlaySoundInVoiceChannel('🌵🎵', 'WildBoarHerd.mp3');
    },
    [4]: () => {
        SendMessage('⛏', '25 Goblins appear!! They are agressive and start attacking you.');
        cache.enemies.push({
            type: 'goblin',
            name: 'Goblin',
            plural: 'Goblins',
            amount: 25,
            room: '⛏'
        });
    },
    [5]: () => {

    },
    [6]: () => {
        // TODO: Trader appears.
        SendMessage('⚓', 'The Trader appears.');
    },
    [8]: () => {
        // CASTLE CLUE
        SendMessage('🌵', '🗺 👉 🏰');
    },
    [10]: () => {
        // TODO: send audio clue, in gardens voice,  that everyone dies in the desert at tick 16.
        PlaySoundInVoiceChannel('🌼🎵', 'placeholder.mp3');
    },
    [12]: () => {
        // DESERT CLUE
        SendMessage('🌼', '🗺 👉 🌵');
    },
    [15]: () => {
        // TODO: send audio clue, in gardens voice, that everyone dies in the gardens at tick 26.
        PlaySoundInVoiceChannel('🌼🎵', 'placeholder.mp3');
    },
    [16]: () => {
        // DESERT BOMB
        SendMessage('🌵', '💣👿');
        setTimeout(() => {
            KillAllPlayersWithRole('🌵');
            SendMessage('💀', '💣 👉 💀💀💀');
        }, 1000);
    },
    [20]: () => {
        // UNLOCK CASTLE.
        cache.castleLocked = false;
        SendMessage('🏰', '🏰🔓');
        SendMessage('💀', '🏰🔓');
    },
    [25]: () => {
        // 2/2 clue for volcanoe.
        SendMessage('⛏', '⛓ 👉 🛎');
    },
    [26]: () => {
        // GARDENS BOMB
        SendMessage('🌼', '💣👿');
        setTimeout(() => {
            KillAllPlayersWithRole('🌼');
            SendMessage('💀', '💣 👉 💀💀💀');
        }, 1000);
    },
    [29]: () => {
        // TODO: send audio clue, in desert voice, that everyone dies in the volcanoe at tick 33.
        PlaySoundInVoiceChannel('🌵🎵', 'placeholder.mp3');
    },
    [30]: () => {
        // MINE CLUE
        SendMessage('💀', '🗺 👉 ⛏');
    },
    [33]: () => {
        // VOLCANO BOMB
        SendMessage('🌋', '🌋🔥🔥');
        setTimeout(() => {
            KillAllPlayersWithRole('🌋');
            SendMessage('💀', '🌋🔥🔥 👉 💀💀💀');
        }, 1000);
    },
    [40]: () => {
        SendMessage('🌵', 'A Sand Worm appears!! They are agressive and start attacking you.');
        cache.enemies.push({
            type: 'sandworm',
            name: 'Sand Worm',
            plural: 'Sand Worms',
            amount: 1,
            room: '🌵'
        });
    },
    [50]: () => {
        // TODO: Trader dissapears.
        SendMessage('⚓', 'The Trader has left.');
    },
    [52]: () => {
        // 1/2 clue for volcanoe.
        SendMessage('🏰', '🗺⛓ 👉 🌋');
    },
    [54]: () => {
        SendMessage('🏰', '10 knights appear!! They are agressive and start attacking you.');
        cache.enemies.push({
            type: 'knight',
            name: 'Knight',
            plural: 'Knights',
            amount: 10,
            room: '🏰'
        });
    },
    [55]: () => {
        SendMessage('🏰', 'A Dragon appears!! They are agressive and start attacking you.');
        cache.enemies.push({
            type: 'dragon',
            name: 'Dragon',
            plural: 'Dragons',
            amount: 1,
            room: '🌋'
        });
    },
    [59]: () => {
        roomRoles.forEach(room => SendMessage(room, '💫'));
    }
}

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
client.on('ready', () => {
    console.log('I am ready!');
    OnLoopStart();
    setInterval(ServerTick, 5000);
});

function OnLoopStart() {
    SetupCache();
    // Remove all room roles from members on loop (re)start.
    client.guilds.fetch(guildId).then(guild => {
        guild.members.fetch().then(members => {
            members.forEach(member => {
                roomRoles.forEach(role => { RemoveRoleFromMember(member, role); });
            });
        }).catch(console.error);
    });
    client.channels.cache.get(homeChannelId).send('⏰🌌');
}

function ServerTick() {
    // CLEAR MESSAGES AND UPDATE CLOCK.
    if (cache.tick === 0 || cache.tick % 5 === 0) {
        roomRoles.forEach(room => {
            GetChannelByName(room).bulkDelete(100);
            const clockIcon = clockfaces[Math.floor((cache.tick % 60) / 5)];
            SendMessage(room, clockIcon);
            client.user.setActivity(`${clockIcon}`);
            let enemies = GetEnemiesInRoom(room);
            enemies.forEach(enemy => {
                let enemyName = (enemy.amount === 1) ? enemy.name : enemy.plural;
                SendMessage(room, `There are ${enemy.amount} ${enemyName} still alive.`);
            });
        });
    }

    for (let tick = 0; tick < 60; tick++) {
        if (cache.tick === tick && timeline[tick]) {
            timeline[tick]();
            break;
        }
    }

    cache.tick++;
    if (cache.tick === 60) {
        cache.tick = 0;
        OnLoopStart();
    }
}

function SendMessage(channelName, message) { 
    const channel = GetChannelByName(channelName);
    channel.send(message);
}

function GetChannelByName(channelName) {
    return client.channels.cache.get(channelIds[channelName]);
}

function GetRoleByName(guild, roleName) {
    return guild.roles.cache.find(role => role.name === roleName);
}

function AddRoleToMember(member, roleName) {
    const role = GetRoleByName(member.guild, roleName);
    member.roles.add(role);
}

function RemoveRoleFromMember(member, roleName) {
    const role = GetRoleByName(member.guild, roleName);
    member.roles.remove(role);
}

function KillAllPlayersWithRole(roleName) {
    client.guilds.fetch(guildId).then(guild => {
        const role = GetRoleByName(guild, roleName);
        role.members.forEach(member => {
            RemoveRoleFromMember(member, roleName);
            AddRoleToMember(member, '💀');
        });
    });
}

function SetNickname(member, name) {
    member.setNickname(name);
}

function MemberHasRole(member, roleName) {
    return member.roles.cache.find(role => role.name === roleName);
}

function GotoRoom(message, room) {
    if (MemberHasRole(message.member, '💀')) {
        return;
    }
    if (MemberHasRole(message.member, '🏰') && cache.castleLocked) {
        message.channel.send('🏰🔒');
        return;
    }
    roomRoles.forEach(role => RemoveRoleFromMember(message.member, role));
    AddRoleToMember(message.member, room);
    message.member.voice.setChannel(GetChannelByName('🌼🎵')).catch(()=>{});
}

function AttackRoomEnemy(message, enemyType, damage, optionalMessage = '') {
    let channelName = message.channel.name;
    let enemy = cache.enemies.find(el => {
        return (el.room === channelName) && (el.type === enemyType);
    });
    if (enemy) {
        enemy.amount -= damage;
        if (enemy.amount <= 0) {
            let idx = cache.enemies.indexOf(enemy);
            cache.enemies.splice(idx, 1);
            message.channel.send(`The ${enemy.plural} have been defeated!`);
        } else {
            let enemyNameText = (enemy.amount === 1) ? enemy.name : enemy.plural;
            let prefix = (optionalMessage === '') ? '' : `${optionalMessage}\n`;
            message.channel.send(`${prefix}${enemy.amount} ${enemyNameText} remain.`);
        }
    }
}

function GetEnemiesInRoom(room) {
    let enemies = cache.enemies.filter(el => {
        return (el.room === room);
    });
    return enemies;
}

function CheckToKillPlayer(message, killChance = 0.5) { 
    let enemies = GetEnemiesInRoom(message.channel.name);
    let doDie = (Math.random() < killChance);
    if (enemies.length > 0 && doDie) {
        GotoRoom(message, '💀');
        SendMessage('💀', `Welcome to the dead, ${message.author}`);
    }
}

function PlaySoundInVoiceChannel(channelName, soundPath) {
    GetChannelByName(channelName).join().then(connection => {
        const dispatcher = connection.play(`assets/${soundPath}`);
        dispatcher.on('error', console.error);
    });
}

const msgCommands = {
    '🚶‍♂️': {
        '🌼': function (message) { GotoRoom(message, '🌼'); },
        '🌵': function (message) { GotoRoom(message, '🌵'); },
        '🏰': function (message) {
            if (cache.castleLocked) {
                message.channel.send("🏰🔒");
            } else {
                GotoRoom(message, '🏰'); 
            }
        },
        '⚓': function (message) { GotoRoom(message, '⚓'); },
        '⛏': function (message) { GotoRoom(message, '⛏'); },
        '🌋🛎': function (message) { GotoRoom(message, '🌋'); },
        '🌋': function (message) { message.channel.send('🚶‍♂️🌋❓'); },
        'default': function (message) {
            CheckToKillPlayer(message);
        }
    },
    '⚔': {
        '🪓': function (message) {
            AttackRoomEnemy(message, 'goblin', 1, 'A goblin is cleaved in half.');
            AttackRoomEnemy(message, 'boar', 1, 'boar killed [placeholder]');
            AttackRoomEnemy(message, 'knight', 1, 'knight killed [placeholder]');
            AttackRoomEnemy(message, 'sandworm', 1, 'knight killed [placeholder]');
            AttackRoomEnemy(message, 'dragon', 1, 'knight killed [placeholder]');
        },
        '🔥': function (message) {
            AttackRoomEnemy(message, 'goblin', 3, 'BOOM! The goblins explode in a fiery blast.');
        },
        '🗡️': function (message) {},
        '🔫': function (message) {},
        '🔪': function (message) {},
        '💣': function (message) {},
        '🥄': function (message) {
            CheckToKillPlayer(message, 1);
        },
        '🚀': function (message) {},
        '✂': function (message) {},
        'default': function(message) {
            CheckToKillPlayer(message);
        }
    },
    '🖐': {
        '🎲': function (message) {
            const roll = Math.floor(Math.random() * 6) + 1;
            message.channel.send(`🎲 👉 ${roll}`);
        }
    },
    '📃':{
        '🎶': function (message){
            JoinAllVoiceChannels(message);
        }
    },
    'default': function (message) {
        CheckToKillPlayer(message);
    }
};

client.on('message', message => {
    if (message.author.bot) return;

    let validMessage = !nonEmojiPattern.test(message.content);
    if (!validMessage) {
        message.delete();
    }
    if (validMessage) {
        // Command parser.
        let msg = message.content.replace(/\s/, '');
        let foundCmd = false;
        for (const [cmd, cmdArgs] of Object.entries(msgCommands)) {
            if (msg.startsWith(cmd)) {
                foundCmd = true;
                msg = msg.replace(cmd, '').replace(' ', '');
                let foundArg = false;
                for (const [cmdArg, func] of Object.entries(cmdArgs)) {
                    if (msg.includes(cmdArg)) {
                        func(message);
                        foundArg = true;
                        break;
                    }
                }
                if (!foundArg && msgCommands[cmd]['default']) {
                    msgCommands[cmd]['default'](message);
                }
                break;
            }
        }
        if (!foundCmd && msgCommands['default']) {
            msgCommands['default'](message);
        }
    }
});
client.login(secrets.botToken);