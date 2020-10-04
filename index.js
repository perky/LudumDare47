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
        trader: false,
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
        SendMessage('🌼', '🪓🐗 👉 💀');
    },
    [3]: () => {
        SpawnEnemies({
            type: 'boar',
            name: 'Wild Boar',
            plural: 'Wild Boars',
            icon: '🐗',
            amount: 30,
            room: '🌼'
        });
        PlaySoundInVoiceChannel('🌼🎵', 'WildBoarAppears.mp3');
    },
    [4]: () => {
        SpawnEnemies({
            type: 'goblin',
            name: 'Goblin',
            plural: 'Goblins',
            icon: '👺',
            amount: 25,
            room: '⛏'
        });
    },
    [5]: () => {
        SendMessage('🌼', '🍪🐗 👉 💀💀💀');
    },
    [6]: () => {
        // TODO: Trader appears.
        cache.trader = true;
        SendMessage('⚓', 'The Trader appears.');
    },
    [8]: () => {
        // CASTLE CLUE
        SendMessage('🌵', '🗺 👉 🏰');
    },
    [9]: () => {
        SendMessage('⚓', '🧊🐛 👉 🤕');
    },
    [10]: () => {
        // audio clue, in gardens voice,  that everyone dies in the desert at tick 16.
        PlaySoundInVoiceChannel('🌼🎵', 'desert_bomb_clue.mp3');
    },
    [11]: () => {
        SendMessage('⚓', '💰🛡 👉 💀💀💀');
    },
    [12]: () => {
        // DESERT CLUE
        SendMessage('🌼', '🗺 👉 🌵');
    },
    [14]: () => {
        SendMessage('⚓', '🧨🛡 👉 ⛔');
    },
    [15]: () => {
        // audio clue, in gardens voice, that everyone dies in the gardens at tick 26.
        PlaySoundInVoiceChannel('🌼🎵', 'garden_bomb_clue.mp3');
    },
    [16]: () => {
        // DESERT BOMB
        SendMessage('🌵', '🧨⏰👿');
        setTimeout(() => {
            KillAllPlayersWithRole('🌵');
            SendMessage('💀', '🧨⏰ 👉 💀💀💀');
        }, 2000);
    },
    [17]: () => {
        SendMessage('🌼', '🔥👺 👉 💀💀💀');
    },
    [20]: () => {
        // UNLOCK CASTLE.
        cache.castleLocked = false;
        SendMessage('🏰', '🏰🔓');
        SendMessage('💀', '🏰🔓');
    },
    [21]: () => {
        SendMessage('🌵', '🔪🛡 👉 💀');
    },
    [25]: () => {
        // 2/2 clue for volcanoe.
        SendMessage('⛏', '⛓ 👉 🛎');
    },
    [26]: () => {
        // GARDENS BOMB
        SendMessage('🌼', '🧨⏰👿');
        PlaySoundInVoiceChannel('🌼🎵', 'WildBoarHerd.mp3');
        setTimeout(() => {
            KillAllPlayersWithRole('🌼');
            SendMessage('💀', '🧨⏰ 👉 💀💀💀');
        }, 2000);
    },
    [29]: () => {
        // audio clue, in mine voice, that everyone dies in the volcanoe at tick 33.
        PlaySoundInVoiceChannel('⛏🎵', 'volcano_eruption_clue.mp3');
    },
    [30]: () => {
        // MINE CLUE
        SendMessage('💀', '🗺 👉 ⛏');
    },
    [33]: () => {
        // VOLCANO BOMB
        SendMessage('🌋', '🌋🔥🔥');
        PlaySoundInVoiceChannel('🌋', 'VolcanicEruption.mp3');
        setTimeout(() => {
            KillAllPlayersWithRole('🌋');
            SendMessage('💀', '🌋🔥🔥 👉 💀💀💀');
        }, 2000);
    },
    [34]: () => {
        SendMessage('💀', '🪓👺 👉 ⛔');
        setTimeout(() => {
            SendMessage('💀', '🍪👺 👉 ⛔');
        }, 2000);
    },
    [37]: () => {
        SpawnEnemies({
            type: 'slime',
            name: 'Slime',
            plural: 'Slimes',
            icon: '🟩',
            amount: 40,
            room: '⛏'
        });
        SpawnEnemies({
            type: 'slime',
            name: 'Slime',
            plural: 'Slimes',
            icon: '🟩',
            amount: 15,
            room: '🌋'
        });
    },
    [40]: () => {
        PlaySoundInVoiceChannel('🌵', 'SandWormAppears.mp3');
        SpawnEnemies({
            type: 'sandworm',
            name: 'Sand Worm',
            plural: 'Sand Worms',
            amount: 1,
            icon: '🏜🐛',
            hp: 50,
            useHp: true,
            room: '🌵'
        });
    },
    [41]: () => {
        SendMessage('💀', '💩🐗 👉 ⛔');
        setTimeout(() => {
            SendMessage('💀', '🍔🐗 👉 ⛔');
        }, 2000);
    },
    [42]: () => {
        SendMessage('⚓', '🔫👺 👉 💀');
        setTimeout(() => {
            SendMessage('⚓', '🗡👺 👉 💀');
        }, 2000);
    },
    [43]: () => {
        SendMessage('🏰', '🪓🐉 👉 ⛔');
    },
    [46]: () => {
        SendMessage('⛏', '🚿🐛 👉 🤕🤕🤕');
    },
    [50]: () => {
        // TODO: Trader dissapears.
        cache.trader = false;
        SendMessage('⚓', 'The Trader has left.');
    },
    [52]: () => {
        // 1/2 clue for volcanoe.
        SendMessage('🏰', '🗺 👉 ⛓ 👉 🌋');
    },
    [53]: () => {
        SendMessage('🌼', '🎷🐛 👉 ⛔');
    },
    [54]: () => {
        SpawnEnemies({
            type: 'knight',
            name: 'Knight',
            plural: 'Knights',
            icon: '🛡',
            amount: 10,
            room: '🏰'
        });
    },
    [55]: () => {
        SpawnEnemies({
            type: 'dragon',
            name: 'Dragon',
            plural: 'Dragons',
            icon: '🐉',
            amount: 1,
            hp: 100,
            useHp: true,
            room: '🌋'
        });
    },
    [58]: () => {
        SendMessage('🌵', '🐁🐉 👉 🤕');
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

function SpawnEnemies(enemyData) {
    SendMessage(enemyData.room, `😡‼ ${enemyData.icon.repeat(enemyData.amount)} ‼😡`);
    cache.enemies.push(enemyData);
}

function AttackRoomEnemy(message, enemyType, damage, optionalMessage = '') {
    let channelName = message.channel.name;
    let enemy = cache.enemies.find(el => {
        return (el.room === channelName) && (el.type === enemyType);
    });
    if (enemy) {
        if (enemy.useHp) {
            enemy.hp -= damage;
            if (enemy.hp <= 0) {
                let idx = cache.enemies.indexOf(enemy);
                cache.enemies.splice(idx, 1);
                message.channel.send(`${enemy.icon} 👉 💀`);
            } else {
                let prefix = (optionalMessage === '') ? '' : `${optionalMessage}\n`;
                message.channel.send(`${prefix}${enemy.icon} 👉 ${enemy.hp}♥.`);
            }
        } else {
            enemy.amount -= damage;
            if (enemy.amount <= 0) {
                let idx = cache.enemies.indexOf(enemy);
                cache.enemies.splice(idx, 1);
                message.channel.send(`${enemy.icon} 👉 💀`);
            } else {
                let enemyNameText = (enemy.amount === 1) ? enemy.name : enemy.plural;
                let prefix = (optionalMessage === '') ? '' : `${optionalMessage}\n`;
                message.channel.send(`${prefix}😡 ${enemy.icon.repeat(enemy.amount)} 😡`);
            }
        }
    }
}

function GetEnemiesInRoom(room) {
    let enemies = cache.enemies.filter(el => {
        return (el.room === room);
    });
    return enemies;
}

function KillPlayerIfAnyEnemyExists(message, killChance = 0.5) { 
    let enemies = GetEnemiesInRoom(message.channel.name);
    let doDie = (Math.random() < killChance);
    if (enemies.length > 0 && doDie) {
        GotoRoom(message, '💀');
        SendMessage('💀', `Welcome to the dead, ${message.author}`);
    }
}

function KillPlayerIfEnemyExists(message, enemyType, killChance = 1.0) {
    let enemies = GetEnemiesInRoom(message.channel.name);
    if (enemies.find(enemy => (enemy.type === enemyType) && (enemy.amount > 0))) {
        let doDie = (Math.random() < killChance);
        if (enemies.length > 0 && doDie) {
            GotoRoom(message, '💀');
            SendMessage('💀', `Welcome to the dead, ${message.author}`);
        }
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
            KillPlayerIfAnyEnemyExists(message);
        }
    },
    '⚔': {
        '🪓': function (message) {
            AttackRoomEnemy(message, 'boar', 1, '🪓💀');
            KillPlayerIfEnemyExists(message, 'goblin');
            KillPlayerIfEnemyExists(message, 'dragon');
        },
        '🔨': function (message) {
            AttackRoomEnemy(message, 'boar', 1, '🔨💀');
            KillPlayerIfEnemyExists(message, 'dragon');
        },
        '🍪': function (message) {
            AttackRoomEnemy(message, 'boar', 3, '🍪💀💀💀');
            AttackRoomEnemy(message, 'slime', 1, '🍪💀');
            KillPlayerIfEnemyExists(message, 'goblin');
        },
        '🍫': function (message) {
            AttackRoomEnemy(message, 'boar', 3, '🍫💀💀💀');
            AttackRoomEnemy(message, 'slime', 1, '🍫💀');
            KillPlayerIfEnemyExists(message, 'goblin');
        },
        '💩': function (message) { 
            KillPlayerIfEnemyExists(message, 'boar');
        },
        '🍔': function (message) {
            KillPlayerIfEnemyExists(message, 'boar');
        },
        '🔫': function (message) {
            AttackRoomEnemy(message, 'goblin', 1, '🔫💀');
            AttackRoomEnemy(message, 'dragon', 1, '🔫🤕');
            KillPlayerIfEnemyExists(message, 'knight');
        },
        '🔪': function (message) { 
            AttackRoomEnemy(message, 'goblin', 1, '🔪💀');
            AttackRoomEnemy(message, 'knight', 1, '🔪💀');
            KillPlayerIfEnemyExists(message, 'dragon');
        },
        '🔥': function (message) {
            AttackRoomEnemy(message, 'goblin', 4, '🔥💀💀💀💀');
            AttackRoomEnemy(message, 'knight', 1, '🔥💀');
            KillPlayerIfEnemyExists(message, 'dragon');
        },
        '🧨': function (message) {
            AttackRoomEnemy(message, 'sandworm', 1, '🧨🤕');
            KillPlayerIfEnemyExists(message, 'boar');
            KillPlayerIfEnemyExists(message, 'goblin');
            KillPlayerIfEnemyExists(message, 'knight');
            KillPlayerIfEnemyExists(message, 'slime');
            KillPlayerIfEnemyExists(message, 'dragon');
        },
        '💣': function (message) {
            msgCommands['⚔']['🧨'](message);
        },
        '🧊': function (message) {
            AttackRoomEnemy(message, 'sandworm', 1, '🧊🤕');
            KillPlayerIfEnemyExists(message, 'slime');
        },
        '🚿': function (message) {
            AttackRoomEnemy(message, 'sandworm', 3, '🚿🤕🤕🤕');
        },
        '🌊': function (message) {
            AttackRoomEnemy(message, 'sandworm', 3, '🌊🤕🤕🤕');
        },
        '🍉': function (message) {
            AttackRoomEnemy(message, 'sandworm', 3, '🍉🤕🤕🤕');
            KillPlayerIfEnemyExists(message, 'slime');
        },
        '🎷': function (message) {
            AttackRoomEnemy(message, 'slime', 2, '🎷💀💀');
            KillPlayerIfEnemyExists(message, 'sandworm');
        },
        '🎸': function (message) {
            AttackRoomEnemy(message, 'slime', 2, '🎸💀💀');
            KillPlayerIfEnemyExists(message, 'sandworm');
        },
        '🎻': function (message) {
            AttackRoomEnemy(message, 'slime', 2, '🎻💀💀');
            KillPlayerIfEnemyExists(message, 'sandworm');
        },
        '🎹': function (message) {
            AttackRoomEnemy(message, 'slime', 2, '🎹💀💀');
            KillPlayerIfEnemyExists(message, 'sandworm');
        },
        '🎺': function (message) {
            AttackRoomEnemy(message, 'slime', 2, '🎺💀💀');
            KillPlayerIfEnemyExists(message, 'sandworm');
        },
        '💰': function (message) {
            AttackRoomEnemy(message, 'knight', 2, '💰💀💀');
        },
        '🤺': function (message) {
            KillPlayerIfEnemyExists(message, 'knight');
        },
        '🐁': function (message) {
            AttackRoomEnemy(message, 'dragon', 1, '🐁🤕');
        },
        '🐭': function (message) {
            msgCommands['⚔']['🐁'](message);
        },
        '🍆': function (message) {
            AttackRoomEnemy(message, 'dragon', 3, '🍆🤕🤕🤕');
            KillPlayerIfEnemyExists(message, 'knight');
            KillPlayerIfEnemyExists(message, 'slime');
        },
        '🥄': function (message) {
            KillPlayerIfAnyEnemyExists(message, 1);
        },
        '✂': function (message) {
            KillPlayerIfAnyEnemyExists(message, 1);
        },
        'default': function(message) {
            KillPlayerIfAnyEnemyExists(message);
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
        }
    },
    'default': function (message) {
        KillPlayerIfAnyEnemyExists(message);
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