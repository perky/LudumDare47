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
const rooms = ['🌼', '🌵', '🏰'];
const channelIds = {
    '🌼': '761910391861149697',
    '🌵': '761945372179955792',
    '🏰': '761945788107980821'
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
    setInterval(ServerTick, 5);
});

function ServerTick() {
    cache.tick++;
    if (cache.tick === 3) {
        const channel = GetChannelByName('🌼');
        channel.send('8 Goblins appear!! They are agressive and start attacking you.');
        cache.enemies.push({
            type: 'goblin',
            name: 'Goblin',
            plural: 'Goblins',
            amount: 8,
            room: '🌼'
        });
    }
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
    rooms.forEach(room => RemoveRoleFromMember(message, room));
    AddRoleToMember(message.member, room);
    SetNickname(message.member, `[🔥] ${message.author.username}`);
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

const msgCommands = {
    '🚶‍♂️': {
        '🌼': function (message) { GotoRoom(message, '🌼'); },
        '🌵': function (message) { GotoRoom(message, '🌵'); },
        '🏰': function (message) { GotoRoom(message, '🏰'); },
    },
    '⚔': {
        '🪓': function (message) {
            AttackRoomEnemy(message, 'goblin', 1, '<:Test:761943769695518730> A goblin is cleaved in half.');
        },
        '🔥': function (message) {
            AttackRoomEnemy(message, 'goblin', 3, 'BOOM! The goblins explode in a fiery blast.');
        },
        'default': function(message) {

        }
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
        for (const [cmd, cmdArgs] of Object.entries(msgCommands)) {
            if (msg.startsWith(cmd)) {
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
    }
});
client.login(secrets.botToken);