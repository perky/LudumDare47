// Import the discord.js module
const Discord = require('discord.js');
// Create an instance of a Discord client
const client = new Discord.Client();
const secrets = require('./secrets.js');

// VOICE STUFF
const { OpusEncoder } = require('@discordjs/opus');
// Create the encoder.
// Specify 48kHz sampling rate and 2 channel size.
const encoder = new OpusEncoder(48000, 2);

const nonEmojiPattern = /[A-Za-z0-9]/u;
const roomRoles = ['🌼', '🌵', '🏰', '💀', '⛏', '🌋', '⚓'];
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

let cache = {
    roles: {},
    teams: {},
    locations: {},
    enemies: [],
    tick: 0
};

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
client.on('ready', () => {
    console.log('I am ready!');
    setInterval(ServerTick, 5000);
});

function ServerTick() {
    cache.tick++;
    if (cache.tick === 3) {
        SendMessage('🌼', '8 Goblins appear!! They are agressive and start attacking you.')
        cache.enemies.push({
            type: 'goblin',
            name: 'Goblin',
            plural: 'Goblins',
            amount: 8,
            room: '🌼'
        });
    }

    if (cache.tick === 1 || cache.tick % 12 === 0) {
        roomRoles.forEach(room => {
            GetChannelByName(room).bulkDelete(100);
            let enemies = GetEnemiesInRoom(room);
            enemies.forEach(enemy => {
                let enemyName = (enemy.amount === 1) ? enemy.name : enemy.plural;
                SendMessage(room, `There are ${enemy.amount} ${enemyName} still alive.`);
            });
        });
    }
}

function SendMessage(channelName, message) { 
    const channel = GetChannelByName(channelName);
    channel.send(message);
}

function GetChannelByName(channelName) {
    return client.channels.cache.get(channelIds[channelName]);
}

function AddRoleToMember(member, roleName) {
    const role = member.guild.roles.cache.find(role => role.name === roleName);
    member.roles.add(role);
}

function RemoveRoleFromMember(member, roleName) {
    const role = member.guild.roles.cache.find(role => role.name === roleName);
    member.roles.remove(role);
}

function DoesMemberHaveRole(member, roleName) {

}

function SetNickname(member, name) {
    member.setNickname(name);
}

function GotoRoom(message, room) {
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

function CheckToKillPlayer(message) { 
    let enemies = GetEnemiesInRoom(message.channel.name);
    let doDie = (Math.random() < 0.4);
    if (enemies.length > 0 && doDie) {
        GotoRoom(message, '💀');
        SendMessage('💀', `Welcome to the dead, ${message.author}`);
    }
}

function JoinAllVoiceChannels(message)
{
    let flipFlop = true;
    for (let index = 0; index < channelIds.length; index++) {
        flipFlop = !flipFlop;
        if (flipFlop){
           channelIds[index].join();
        }
    }      
}

const msgCommands = {
    '🚶‍♂️': {
        '🌼': function (message) { GotoRoom(message, '🌼'); },
        '🌵': function (message) { GotoRoom(message, '🌵'); },
        '🏰': function (message) { GotoRoom(message, '🏰'); },
        'default': function (message) {
            CheckToKillPlayer(message);
        }
    },
    '⚔': {
        '🪓': function (message) {
            AttackRoomEnemy(message, 'goblin', 1, '<:Test:761943769695518730> A goblin is cleaved in half.');
        },
        '🔥': function (message) {
            AttackRoomEnemy(message, 'goblin', 3, 'BOOM! The goblins explode in a fiery blast.');
        },
        'default': function(message) {
            CheckToKillPlayer(message);
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