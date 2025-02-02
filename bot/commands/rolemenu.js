const menu = require('../../schemas/menu.js');
const guild = require('../../schemas/guild.js');
const {MessageEmbed, Permissions} = require('discord.js');
const {parse} = require('twemoji-parser');

module.exports = {
    active: true,
    name: 'rolemenu',
    description: lang => lang.get('rolemenuDescription'),
    aliases: ['rolesmenu'],
    usage: lang => [lang.get('rolemenuUsage0'), lang.get('rolemenuUsage1')],
    example: ['create #colors @Red 🔴 @Green 🟢 @Blue 🔵 toggle', 'edit 7 @Red 🔴 @Green 🟢 @Blue 🔵 @Yellow 🟡 toggle'],
    cooldown: 10,
    categoryID: 2,
    args: true,
    perm: Permissions.FLAGS.MANAGE_ROLES,
    guildOnly: true,
    execute: async function(message){
        const channelLanguage = message.client.langs[message.client.guildData.get(message.guild.id).language];
        const args = message.content.split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/g).slice(1);
        if((args.length < 4) || !['create', 'edit'].includes(args[0])) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        var toggle;
        if(toggle = (args[args.length - 1] === 'toggle')) args.splice(-1, 1);
        if((args.length % 2) != 0) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
        if(args.length > 42) return message.reply(channelLanguage.get('maxRolesMenu'));
        if(args[0] === 'create'){
            let discordChannel = message.guild.channels.cache.get((args[1].match(/^(?:<#)?(\d{17,19})>?$/) || [])[1]);
            if(!discordChannel || !discordChannel.isText()) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
            if(!message.guild.me.permissionsIn(discordChannel).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.viewable) return message.reply(channelLanguage.get('sendMessages'));
            if(!message.guild.me.permissionsIn(discordChannel).has(Permissions.FLAGS.ADD_REACTIONS)) return message.reply(channelLanguage.get('botReactions'));
            if(!message.guild.me.permissionsIn(discordChannel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
            let menus = await menu.find({
                guild: message.guild.id,
                channelID: {$in: message.client.channels.cache.map(e => e.id)},
            });
            for(let menuDoc of menus) await message.client.channels.cache.get(menuDoc.channelID).messages.fetch(menuDoc.messageID).catch(() => null);
            if((menus.filter(e => message.client.channels.cache.get(e.channelID).messages.cache.has(e.messageID)) >= 10) && !message.client.guildData.get(message.guild.id).premiumUntil && !message.client.guildData.get(message.guild.id).partner) return message.reply(channelLanguage.get('maxRolemenus', [message.client.guildData.get(message.guild.id).prefix]));
            let roles = args.slice(2).filter((e, i) => ((i % 2) === 0)).map(e => (message.guild.roles.cache.get(e.match(/^(?:<@&)?(\d{17,19})>?$/)?.[1]) ?? message.guild.roles.cache.find(ee => (ee.name.toLowerCase() === e.toLowerCase().replace(/"/g, ''))) ?? message.guild.roles.cache.find(ee => ee.name.toLowerCase().startsWith(e.toLowerCase().replace(/"/g, ''))) ?? message.guild.roles.cache.find(ee => ee.name.toLowerCase().includes(e.toLowerCase().replace(/"/g, '')))));
            if(roles.some(e => (!e || (e.id === message.guild.id)))) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
            if(roles.some(e => (!e.editable || e.managed))) return message.reply(channelLanguage.get('manageRole'));
            if(roles.some(e => (e.position >= message.member.roles.highest.position))) return message.reply(channelLanguage.get('memberManageRole'));
            let emojis = args.slice(2).filter((e, i) => ((i % 2) != 0)).map(e => (message.guild.emojis.cache.get(e.match(/^(?:<a?:\w+:)?(\d{17,19})>?$/)?.[1]) ?? message.guild.emojis.cache.find(ee => (ee.name.toLowerCase() === e.toLowerCase())) ?? message.guild.emojis.cache.find(ee => ee.name.toLowerCase().startsWith(e.toLowerCase())) ?? message.guild.emojis.cache.find(ee => ee.name.toLowerCase().includes(e.toLowerCase())) ?? parse(e)[0]?.text));
            if(emojis.some(e => (!e || (e.id && (!e.available || e.managed))))) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
            if(emojis.some(e => (emojis.filter(ee => ((ee.id || ee) === (e.id || e))).length > 1))) return message.reply(channelLanguage.get('uniqueEmoji'));
            let loadmsg = await message.reply(channelLanguage.get('loading'));
            await guild.findByIdAndUpdate(message.guild.id, {$inc: {counterMenus: 1}});
            let newMenu = new menu({
                id: ++message.client.guildData.get(message.guild.id).counterMenus,
                guild: message.guild.id,
                channelID: discordChannel.id,
                toggle: toggle,
                emojis: emojis.map((e, i) => ({
                    _id: (e.identifier || encodeURIComponent(e)),
                    roleID: roles[i].id,
                })),
            });
            let embed = new MessageEmbed()
                .setColor(message.guild.me.displayColor || 0x8000ff)
                .setAuthor({
                    name: channelLanguage.get('rolemenuEmbedAuthor'),
                    iconURL: message.guild.iconURL({
                        size: 4096,
                        dynamic: true,
                    }),
                })
                .setDescription(roles.map((e, i) => `${emojis[i]} - ${e}`).join('\n'))
                .setFooter({text: `ID: ${newMenu.id}`})
                .setTimestamp();
            let msg = await discordChannel.send({embeds: [embed]});
            newMenu.messageID = msg.id;
            await newMenu.save();
            for(let emoji of emojis) await msg.react(emoji);
            loadmsg.edit(channelLanguage.get('rolemenuCreated'));
        }
        else{
            if(isNaN(parseInt(args[1], 10)) || !isFinite(parseInt(args[1], 10))) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
            let menuDoc = await menu.findOne({
                id: parseInt(args[1], 10),
                guild: message.guild.id,
                channelID: {$in: message.client.channels.cache.map(e => e.id)},
            });
            if(!menuDoc) return message.reply(channelLanguage.get('menu404'));
            let msg = await message.client.channels.cache.get(menuDoc.channelID).messages.fetch(menuDoc.messageID).catch(() => null);
            if(!msg) return message.reply(channelLanguage.get('menu404'));
            let discordChannel = message.client.channels.cache.get(menuDoc.channelID);
            if(!message.guild.me.permissionsIn(discordChannel).has(Permissions.FLAGS.SEND_MESSAGES)) return message.reply(channelLanguage.get('sendMessages'));
            if(!message.guild.me.permissionsIn(discordChannel).has(Permissions.FLAGS.ADD_REACTIONS)) return message.reply(channelLanguage.get('botReactions'));
            if(!message.guild.me.permissionsIn(discordChannel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
            if(!message.guild.me.permissionsIn(discordChannel).has(Permissions.FLAGS.MANAGE_MESSAGES)) return message.reply(channelLanguage.get('botManageMessages'));
            let roles = args.slice(2).filter((e, i) => ((i % 2) === 0)).map(e => (message.guild.roles.cache.get(e.match(/^(?:<@&)?(\d{17,19})>?$/)?.[1]) ?? message.guild.roles.cache.find(ee => (ee.name.toLowerCase() === e.toLowerCase().replace(/"/g, ''))) ?? message.guild.roles.cache.find(ee => (ee.name.toLowerCase().startsWith(e.toLowerCase().replace(/"/g, '')))) ?? message.guild.roles.cache.find(ee => (ee.name.toLowerCase().includes(e.toLowerCase().replace(/"/g, ''))))));
            if(roles.some(e => (!e || (e.id === message.guild.id)))) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
            if(roles.some(e => (!e.editable || e.managed))) return message.reply(channelLanguage.get('manageRole'));
            if(roles.some(e => (e.position >= message.member.roles.highest.position))) return message.reply(channelLanguage.get('memberManageRole'));
            let emojis = args.slice(2).filter((e, i) => ((i % 2) != 0)).map(e => (message.guild.emojis.cache.get(e.match(/^(?:<a?:\w+:)?(\d{17,19})>?$/)?.[1]) ?? message.guild.emojis.cache.find(ee => (ee.name.toLowerCase() === e.toLowerCase())) ?? message.guild.emojis.cache.find(ee => ee.name.toLowerCase().startsWith(e.toLowerCase())) ?? message.guild.emojis.cache.find(ee => ee.name.toLowerCase().includes(e.toLowerCase())) ?? parse(e)[0]?.text));
            if(emojis.some(e => (!e || (e.id && (!e.available || e.managed))))) return message.reply(channelLanguage.get('invArgs', [message.client.guildData.get(message.guild.id).prefix, this.name, this.usage(channelLanguage)]));
            if(emojis.some(e => (emojis.filter(ee => ((ee.id || ee) === (e.id || e))).length > 1))) return message.reply(channelLanguage.get('uniqueEmoji'));
            let loadmsg = await message.reply(channelLanguage.get('loading'));
            menuDoc.toggle = toggle;
            menuDoc.emojis = emojis.map((e, i) => ({
                _id: (e.identifier || encodeURIComponent(e)),
                roleID: roles[i].id,
            }));
            let embed = new MessageEmbed()
                .setColor(message.guild.me.displayColor || 0x8000ff)
                .setAuthor({
                    name: channelLanguage.get('rolemenuEmbedAuthor'),
                    iconURL: message.guild.iconURL({
                        size: 4096,
                        dynamic: true,
                    }),
                })
                .setDescription(roles.map((e, i) => `${emojis[i]} - ${e}`).join('\n'))
                .setFooter({text: `ID: ${menuDoc.id}`})
                .setTimestamp();
            await msg.reactions.removeAll();
            await msg.edit({embeds: [embed]});
            for(let emoji of emojis) await msg.react(emoji);
            await menuDoc.save();
            loadmsg.edit(channelLanguage.get('rolemenuEdited'));
        }
    },
};