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

const millisecondsPerServerTick = 10000;
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
    '🌋🎵': '761986404711530556',
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
        //client.channels.cache.get(homeChannelId).send('🧩  🚶‍♂️🌼');
    },
    [2]: () => {
        SendMessage('🌼', '🧩 ⚔🪓 👉 🐗');
        //client.channels.cache.get(homeChannelId).send('🧩 ⚔🪓 👉 🐗');
    },
    [3]: () => {
        SpawnEnemies({
            type: 'boar',
            name: 'Wild Boar',
            plural: 'Wild Boars',
            icon: '🐗',
            image: 'Boar_Idle.gif',
            reward: '🧩 🚶‍♂️🌵',
            amount: 15,
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
            image: 'Goblin_Idle.gif',
            reward: '🧩 ⚔💰 👉 🛡',
            amount: 10,
            room: '⛏'
        });
        PlaySoundInVoiceChannel('⛏🎵', 'GoblinAppears.mp3');
        //client.channels.cache.get(homeChannelId).send('🧩  🚶‍♂️⚓');
    },
    [5]: () => {
        SendMessage('🌼', '🧩 ⚔🍪 👉⭐ 🐗');
    },
    [6]: () => {
        // TODO: Trader appears.
        cache.trader = true;
        SendMessage('⚓', '👩‍💼👋');
        SendMessage('🌋', '👩‍💼❤♟');
        PlaySoundInVoiceChannel('⚓🎵', 'TraderArrives.mp3');
    },
    [8]: () => {
        // CASTLE CLUE
        SendMessage('🌵', '🧩 🗺🏰');
    },
    [9]: () => {
        SendMessage('⚓', '🧩 ⚔🧊 👉 🐛');
    },
    [10]: () => {
        // audio clue, in gardens voice, that everyone dies in the desert at tick 16.
        PlaySoundInVoiceChannel('🌼🎵', 'desert_bomb_clue.mp3');
    },
    [11]: () => {
        SendMessage('⚓', '🧩 ⚔💰 👉⭐ 🛡');
    },
    [12]: () => {
        // DESERT CLUE
        SendMessage('🌼', '🧩 🗺🌵');
    },
    [14]: () => {
        SendMessage('⚓', '🧩 ⚔🧨 👉⛔ 🛡');
    },
    [15]: () => {
        // audio clue, in harbour voice, that everyone dies in the gardens at tick 26.
        PlaySoundInVoiceChannel('⚓🎵', 'garden_bomb_clue.mp3');
    },
    [16]: () => {
        // DESERT BOMB
        SendMessage('🌵', '🧨⏰');
        setTimeout(() => {
            KillAllPlayersWithRole('🌵');
            SendMessage('💀', '🧩 🧨⏰ 👉 💀💀💀');
        }, 3000);
    },
    [17]: () => {
        SendMessage('🌼', '🧩 ⚔🔥 👉⭐ 👺');
    },
    [20]: () => {
        // UNLOCK CASTLE.
        cache.castleLocked = false;
        SendMessage('🏰', '🏰🔓');
        SendMessage('💀', '🏰🔓');
        PlaySoundInVoiceChannel('🏰🎵', 'CastleGateOpens.mp3');
    },
    [21]: () => {
        SendMessage('🌵', '🧩 ⚔🔪 👉 🛡');
    },
    [25]: () => {
        // 2/2 clue for volcanoe.
        SendMessage('⛏', '🧩 🌋🛎');
    },
    [26]: () => {
        // GARDENS BOMB
        SendMessage('🌼', '🧨⏰');
        PlaySoundInVoiceChannel('🌼🎵', 'WildBoarHerd.mp3');
        setTimeout(() => {
            KillAllPlayersWithRole('🌼');
            SendMessage('💀', '🧩 🧨⏰ 👉 💀💀💀');
        }, 3000);
    },
    [28]: () => {
        // TODO: Trader dissapears.
        cache.trader = false;
        SendMessage('⚓', '👩‍💼✈');
    },
    [29]: () => {
        // audio clue, in mine voice, that everyone dies in the volcanoe at tick 33.
        PlaySoundInVoiceChannel('⛏🎵', 'volcano_eruption_clue.mp3');
    },
    [30]: () => {
        // MINE CLUE
        SendMessage('💀', '🧩 🗺⛏');
        //client.channels.cache.get(homeChannelId).send('🧩  🚶‍♂️🌼');
    },
    [31]: () => {
        // RESURRECT THE DEAD.
        SendMessage('💀', '🧙‍♂️ 💀👉😃');
        setTimeout(() => {
            MoveDeadPlayersToRoom('⚓');
            SendMessage('⚓', '🧩 🖐🧙‍♂️ 💀👉⚓');
        }, 3000);
    },
    [33]: () => {
        // VOLCANO BOMB
        SendMessage('🌋', '🌋🔥🔥');
        PlaySoundInVoiceChannel('🌋🎵', 'VolcanicEruption.mp3');
        setTimeout(() => {
            KillAllPlayersWithRole('🌋');
            SendMessage('💀', '🧩 🌋🔥🔥 👉 💀💀💀');
        }, 3000);
    },
    [34]: () => {
        SendMessage('💀', '🧩 ⚔🪓 👉⛔ 👺');
        setTimeout(() => {
            SendMessage('💀', '🧩 ⚔🍪 👉⛔ 👺');
        }, 2000);
        //client.channels.cache.get(homeChannelId).send('🧩  🚶‍♂️⚓');
    },
    [35]: () => {
        SpawnEnemies({
            type: 'boar',
            name: 'Wild Boar',
            plural: 'Wild Boars',
            icon: '🐗',
            image: 'Boar_Idle.gif',
            reward: '🧩 ⚔🍉 👉 🐛',
            amount: 10,
            room: '🌼'
        });
        PlaySoundInVoiceChannel('🌼🎵', 'WildBoarAppears.mp3');
    },
    [37]: () => {
        SpawnEnemies({
            type: 'slime',
            name: 'Slime',
            plural: 'Slimes',
            icon: '🟩',
            image: 'Slime_Idle.gif',
            reward: '🧩 ⚔🐁 👉 🐉',
            amount: 20,
            room: '⛏'
        });
        PlaySoundInVoiceChannel('⛏🎵', 'SlimeAppears.mp3');
    },
    [39]: () => {
        SpawnEnemies({
            type: 'slime',
            name: 'Slime',
            plural: 'Slimes',
            image: 'Slime_Idle.gif',
            reward: '🧩 ⚔🔥 👉⛔ 🐉',
            icon: '🟩',
            amount: 5,
            room: '🌋'
        });
        PlaySoundInVoiceChannel('🌋🎵', 'SlimeAppears.mp3');
    },
    [40]: () => {
        PlaySoundInVoiceChannel('🌵🎵', 'SandWormAppears.mp3');
        SpawnEnemies({
            type: 'sandworm',
            name: 'Sand Worm',
            plural: 'Sand Worms',
            amount: 1,
            icon: '🏜🐛',
            image: 'Sand_Worm.png',
            reward: '🧩 ⚔🍆 👉⛔ 🟩',
            hp: 25,
            useHp: true,
            room: '🌵'
        });
    },
    [41]: () => {
        SendMessage('💀', '🧩 ⚔💩 👉⛔ 🐗');
        setTimeout(() => {
            SendMessage('💀', '🧩 ⚔🍔 👉⛔ 🐗');
        }, 2000);
        //client.channels.cache.get(homeChannelId).send('🧩 ⚔🪓 👉 🐗');
    },
    [42]: () => {
        SendMessage('⚓', '🧩 ⚔🔫 👉 👺');
        setTimeout(() => {
            SendMessage('⚓', '🧩 ⚔🗡 👉 👺');
        }, 2000);
    },
    [43]: () => {
        SendMessage('🏰', '🧩 ⚔🪓 👉⛔ 🐉');
    },
    [45]: () => {
        //client.channels.cache.get(homeChannelId).send('🧩  🚶‍♂️🌼');
    },
    [46]: () => {
        SendMessage('⛏', '🧩 ⚔🚿 👉⭐ 🐛');
    },
    [50]: () => {
        SpawnEnemies({
            type: 'goblin',
            name: 'Goblin',
            plural: 'Goblins',
            icon: '👺',
            image: 'Goblin_Idle.gif',
            reward: '🧩 🚶‍♂️🏰',
            amount: 7,
            room: '🌵'
        });
        PlaySoundInVoiceChannel('🌵🎵', 'GoblinAppears.mp3');
    },
    [52]: () => {
        // 1/2 clue for volcanoe.
        SendMessage('🏰', '🧩 🗺🌋');
        //client.channels.cache.get(homeChannelId).send('🧩  🚶‍♂️⚓');
    },
    [53]: () => {
        SendMessage('🌼', '🧩  ⚔🎷 👉⛔ 🐛');
    },
    [54]: () => {
        SpawnEnemies({
            type: 'knight',
            name: 'Knight',
            plural: 'Knights',
            icon: '🛡',
            image: 'Knight.png',
            reward: '🧩 🚶‍♂️🌋',
            amount: 5,
            room: '🏰'
        });
        PlaySoundInVoiceChannel('🏰🎵', 'KnightAppears.mp3');
    },
    [55]: () => {
        SpawnEnemies({
            type: 'dragon',
            name: 'Dragon',
            plural: 'Dragons',
            icon: '🐉',
            image: 'Dragon_Idle.gif',
            reward: '👑',
            amount: 1,
            hp: 50,
            useHp: true,
            room: '🌋'
        });
        PlaySoundInVoiceChannel('🌋🎵', 'DragonAppears.mp3');
    },
    [58]: () => {
        SendMessage('🌵', '🧩 ⚔🐁 👉 🐉');
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
    setInterval(ServerTick, millisecondsPerServerTick);
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
    //client.channels.cache.get(homeChannelId).send('⏰🔄');
}

function GetTimeAsEmoji() {
    const clockIcon = clockfaces[Math.floor((cache.tick % 60) / 5)];
    return clockIcon;
}

function ServerTick() {
    // CLEAR MESSAGES AND UPDATE CLOCK.
    if (cache.tick % 15 === 0) {
        roomRoles.forEach(room => {
            GetChannelByName(room).bulkDelete(100);
            let enemies = GetEnemiesInRoom(room);
            enemies.forEach(enemy => {
                SendMessage(room, `😡❗ ${enemy.icon.repeat(enemy.amount)} ❗😡`);
            });
        });
    }
    if (cache.tick === 0 || cache.tick % 5 === 0) {
        roomRoles.forEach(room => {
            const clockIcon = GetTimeAsEmoji();
            SendMessage(room, clockIcon);
            client.user.setActivity(`${clockIcon}`);
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

function SendMessage(channelName, message, attachImage) { 
    const channel = GetChannelByName(channelName);
    if (attachImage !== undefined) {
        const attachment = new Discord.MessageAttachment(fs.readFileSync(`assets/${attachImage}`), attachImage);
        channel.send(message, attachment);
    } else {
        channel.send(message);
    }
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

function MoveDeadPlayersToRoom(roomName) {
    client.guilds.fetch(guildId).then(guild => {
        const deadRole = GetRoleByName(guild, '💀');
        deadRole.members.forEach(member => {
            RemoveRoleFromMember(member, '💀');
            AddRoleToMember(member, roomName);
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
        message.react('❌');
        message.react('💀');
        return;
    }
    if (MemberHasRole(message.member, '🏰') && cache.castleLocked) {
        message.react('❌');
        message.react('🏰');
        message.react('🔒');
        return;
    }
    roomRoles.forEach(role => RemoveRoleFromMember(message.member, role));
    AddRoleToMember(message.member, room);
    message.member.voice.setChannel(GetChannelByName(`${room}🎵`)).catch(()=>{});
    message.channel.send(`${message.author} 🚶‍ 👉 ${room}`);
}

function SpawnEnemies(enemyData) {
    SendMessage(enemyData.room, `😡‼ ${enemyData.icon.repeat(enemyData.amount)} ‼😡`, enemyData.image);
    cache.enemies.push(enemyData);
}

function AttackRoomEnemy(message, enemyType, damage) {
    let channelName = message.channel.name;
    let enemy = cache.enemies.find(el => {
        return (el.room === channelName) && (el.type === enemyType);
    });
    if (enemy) {
        message.react('✅');
        if (damage > 1) {
            message.react('⭐');
        }
        if (enemy.useHp) {
            enemy.hp -= damage;
            if (enemy.hp <= 0) {
                let idx = cache.enemies.indexOf(enemy);
                cache.enemies.splice(idx, 1);
                message.react('💀');
                message.channel.send(`💀 ${enemy.icon} 💀`);
                if (enemy.reward) {
                    message.channel.send(enemy.reward);
                }
                if (enemy.type === 'dragon') {
                    message.react('👑');
                    MakeWinners(message.channel);
                }
            } else {
                if (enemy.hp % 10 === 0) {
                    message.channel.send(`😡‼ ${enemy.icon} ${'♥'.repeat(Math.floor(enemy.hp / 10))} ‼😡`);
                }
            }
        } else {
            enemy.amount -= damage;
            if (enemy.amount <= 0) {
                let idx = cache.enemies.indexOf(enemy);
                cache.enemies.splice(idx, 1);
                message.react('💀');
                message.channel.send(`💀 ${enemy.icon} 💀`);
                if (enemy.reward) {
                    message.channel.send(enemy.reward);
                }
            } else {
                if (enemy.amount % 5 === 0) {
                    message.channel.send(`😡‼ ${enemy.icon.repeat(enemy.amount)} ‼😡`);
                }
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

function KillPlayer(message) {
    GotoRoom(message, '💀');
    SendMessage(message.channel.name, `${message.author} 💀`);
    SendMessage('💀', `${message.author} 💀`);
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

function KillPlayerIfAnyEnemyExists(message, killChance = 0.5) { 
    let enemies = GetEnemiesInRoom(message.channel.name);
    let doDie = (Math.random() < killChance);
    if (enemies.length > 0 && doDie) {
        KillPlayer(message);
    }
}

function KillPlayerIfEnemyExists(message, enemyType, killChance = 1.0) {
    let enemies = GetEnemiesInRoom(message.channel.name);
    if (enemies.find(enemy => (enemy.type === enemyType) && (enemy.amount > 0))) {
        let doDie = (Math.random() < killChance);
        if (enemies.length > 0 && doDie) {
            KillPlayer(message);
        }
    }
}

function PlaySoundInVoiceChannel(channelName, soundPath) {
    let channel = GetChannelByName(channelName);
    if (channel) {
        channel.join().then(connection => {
            const dispatcher = connection.play(`assets/${soundPath}`);
            dispatcher.on('error', console.error);
        });
    } else {
        console.log(`Could not find channel ${channelName}`);
    }
}

function MakeWinners(channel) {
    channel.members.forEach(member => {
        RemoveRoleFromMember(member, channel.name);
        AddRoleToMember(member, '👑');
    });
}

const msgCommands = {
    '🚶‍♂️': {
        '🌼': function (message) { GotoRoom(message, '🌼'); },
        '🌵': function (message) { GotoRoom(message, '🌵'); },
        '🏰': function (message) {
            if (cache.castleLocked) {
                message.react('❌');
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
            message.react('❌');
            KillPlayerIfAnyEnemyExists(message, 0.1);
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
        '🍆': function (message) {
            AttackRoomEnemy(message, 'dragon', 10, '🍆🤕🤕🤕');
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
            KillPlayerIfAnyEnemyExists(message, 0.5);
            message.react('❌');
        }
    },
    '🖐': {
        '🎲': function (message) {
            const roll = Math.floor(Math.random() * 6) + 1;
            message.channel.send(`🎲 👉 ${roll}`);
        },
        '🧙‍♂️': function (message) {
            RemoveRoleFromMember(message.member, '💀');
        },
        '♟': function (message) {
            if (message.channel.name === '⚓' && cache.trader) {
                AddRoleToMember(message.member, '👑');
            }
        },
        '🐗': function (message) {
            message.react('💋');
            message.react('🐗');
        },
        '🐴': function (message) {
            SendMessage('💀', '', 'Hors.png');
        }
    },
    '🐴': {
        'default': function (message) {
            SendMessage('💀', '', 'Hors.png');
        }
    },
    '👋': {
        '⌚': function (message) {
            message.react('✅');
            message.channel.send(GetTimeAsEmoji());
        },
        'default': function (message) {
            if (message.channel.name === '⚓' && cache.trader) {
                message.react('👋');
            }
        }
    },
    '🧩': {
        'default': function (message) {
            const responses = [
                '☠🐲☠',
                '🚶‍♂️🌼',
                '🚶‍♂️⚓',
                '⚔🪓 👉 🐗',
                '⚔🔪 👉 👺'
            ];
            message.react('✅');
            let idx = Math.floor(Math.random() * response.length);
            message.channel.send(response[idx]);
        }
    },
    '📃':{
        '🎶': function (message){
        }
    },
    'default': function (message) {
        message.react('❓');
        KillPlayerIfAnyEnemyExists(message, 0.1);
    }
};

const cmdAliases = {
    '🚶': '🚶‍♂️',
    '🚶‍♀️': '🚶‍♂️',
    '🚗': '🚶‍♂️',
    '🦵': '🚶‍♂️',
    '🚂': '🚶‍♂️',
    '🚅': '🚶‍♂️',
    '🚄': '🚶‍♂️',
    '🚉': '🚶‍♂️',
    '🛸': '🚶‍♂️',
    '🚜': '🚶‍♂️',
    '🚁': '🚶‍♂️',
    '🚓': '🚶‍♂️',
    '🚕': '🚶‍♂️',
    '🛺': '🚶‍♂️',
    '🚙': '🚶‍♂️',
    '🚲': '🚶‍♂️',
    '🛴': '🚶‍♂️',
    '🏍': '🚶‍♂️',
    '✈': '🚶‍♂️',
    '🐎': '🐴',
    '🏇': '🐴',
    '🎠': '🐴',
};
const argAliases = {
    '🌻': '🌼',
    '🥀': '🌼',
    '🌷': '🌼',
    '🌹': '🌼',
    '🌸': '🌼',
    '🌺': '🌼',
    '🏜': '🌵',
    '🏖': '🌵',
    '🗻': '🌋',
    '⛰': '🌋',
    '🏯': '🏰',
    '🐭': '🐁',
    '💣': '🧨',
    '🧙‍♀️': '🧙‍♂️',
    '🐎': '🐴',
    '🏇': '🐴',
    '🎠': '🐴',
};

function IsAlias(aliasList, predicateValue, msg) {
    for (const [alias, value] of Object.entries(aliasList)) {
        if (value === predicateValue && msg.includes(alias)) {
            return true;
        }
    }
    return false;
};

client.on('message', message => {
    if (message.author.bot) return;

    let validMessage = !nonEmojiPattern.test(message.content);
    if (!validMessage && message.channel.name != '👑' && message.channel.name != 'feedback') {
        message.delete();
    }
    if (validMessage) {
        // Command parser.
        let msg = message.content.replace(/\s/, '');
        let foundCmd = false;
        for (const [cmd, cmdArgs] of Object.entries(msgCommands)) {
            if (msg.startsWith(cmd) || IsAlias(cmdAliases, cmd, msg)) {
                foundCmd = true;
                msg = msg.replace(cmd, '').replace(' ', '');
                let foundArg = false;
                for (const [cmdArg, func] of Object.entries(cmdArgs)) {
                    if (msg.includes(cmdArg) || IsAlias(argAliases, cmdArg, msg)) {
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