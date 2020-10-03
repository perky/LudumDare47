// Import the discord.js module
const Discord = require('discord.js');
// Create an instance of a Discord client
const client = new Discord.Client();

let cache = {
    roles: {},
    teams: {},
    locations: {},
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

const nonEmojiPattern = /[A-Za-z0-9]/u;
const rooms = ['🌼', '🌵','🏰'];

const msgCommands = {
    '🚶‍♂️': {
        '🌼': function (message) { GotoRoom(message, '🌼'); },
        '🌵': function (message) { GotoRoom(message, '🌵'); },
        '🏰': function (message) { GotoRoom(message, '🏰'); },
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
                msg = msg.replace(cmd, '');
                for (const [cmdArg, func] of Object.entries(cmdArgs)) {
                    if (msg.startsWith(cmdArg)) {
                        func(message);
                        break;
                    }
                }
                break;
            }
        }
    }
});
client.login('NzYxNzM5ODMzMDU5MTgwNTU2.X3e_gA.fzKdpM26fVKBzW6OFjjAWVke1gA');