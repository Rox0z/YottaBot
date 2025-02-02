const guild = require('../../schemas/guild.js');
const log = require('../../schemas/log.js');
const member = require('../../schemas/member.js');
const {MessageEmbed, Permissions, Collection, GuildAuditLogs} = require('discord.js');

module.exports = {
    name: 'guildBanAdd',
    execute: async ban => {
        if(ban.partial) ban = await ban.fetch().catch(() => null);
        if(!ban) return;
        if(ban.guild.memberCount > 1000){
            let memberDoc = await member.findOne({
                guild: ban.guild.id,
                userID: ban.user.id,
            });
            if(memberDoc){
                if(!memberDoc.autoBanned){
                    memberDoc.relevantBan = true;
                    await memberDoc.save();
                }
            }
            else{
                memberDoc = new member({
                    guild: ban.guild.id,
                    userID: ban.user.id,
                    relevantBan: true,
                });
                await memberDoc.save();
            }
        }
        if((ban.user.id === ban.client.user.id) || !ban.guild.me.permissions.has(Permissions.FLAGS.VIEW_AUDIT_LOG) || !ban.client.guildData.has(ban.guild.id)) return;
        const audits = await ban.guild.fetchAuditLogs({
            limit: 1,
            type: GuildAuditLogs.Actions.MEMBER_BAN_ADD,
        });
        if(!audits.entries.first() || audits.entries.first().executor.bot) return;
        if(ban.client.guildData.get(ban.guild.id).antiMassBan){
            if(ban.client.guildData.get(ban.guild.id).bantimes){
                if(ban.client.guildData.get(ban.guild.id).bantimes.has(audits.entries.first().executor.id)){
                    ban.client.guildData.get(ban.guild.id).bantimes.get(audits.entries.first().executor.id).push(audits.entries.first().createdTimestamp);
                    const notNow = Date.now() - 10000;
                    if((ban.client.guildData.get(ban.guild.id).bantimes.get(audits.entries.first().executor.id).filter(e => (e > notNow)).length > ban.client.guildData.get(ban.guild.id).antiMassBan) && ban.guild.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES)){
                        const executorMember = await ban.guild.members.fetch(audits.entries.first().executor.id);
                        const banRoles = executorMember.roles.cache.filter(e => e.permissions.has(Permissions.FLAGS.BAN_MEMBERS));
                        if(banRoles.every(e => (e.comparePositionTo(ban.guild.me.roles.highest) < 0))) await executorMember.roles.remove(banRoles);
                    }
                }
                else{
                    ban.client.guildData.get(ban.guild.id).bantimes.set(audits.entries.first().executor.id, [audits.entries.first().createdTimestamp]);
                }
            }
            else{
                ban.client.guildData.get(ban.guild.id).bantimes = new Collection([[audits.entries.first().executor.id, [audits.entries.first().createdTimestamp]]]);
            }
        }
        const reason = ban.reason?.slice(0, 500);
        const guildDoc = await guild.findByIdAndUpdate(ban.guild.id, {$inc: {counterLogs: 1}});
        ban.client.guildData.get(ban.guild.id).counterLogs = guildDoc.counterLogs + 1;
        const current = new log({
            id: guildDoc.counterLogs,
            guild: ban.guild.id,
            type: 'ban',
            target: ban.user.id,
            executor: audits.entries.first().executor.id,
            timeStamp:  audits.entries.first().createdAt,
            reason: reason,
        });
        await current.save();
        const discordChannel = ban.guild.channels.cache.get(ban.client.guildData.get(ban.guild.id).modlogs.ban);
        if(!discordChannel || !discordChannel.viewable || !discordChannel.permissionsFor(ban.guild.me).has(Permissions.FLAGS.SEND_MESSAGES) || !discordChannel.permissionsFor(ban.guild.me).has(Permissions.FLAGS.EMBED_LINKS)) return;
        const channelLanguage = ban.client.langs[ban.client.guildData.get(ban.guild.id).language];
        const embed = new MessageEmbed()
            .setColor(0xff0000)
            .setAuthor({
                name: channelLanguage.get('banEmbedAuthor', [audits.entries.first().executor.tag, ban.user.tag]),
                iconURL: ban.user.displayAvatarURL({dynamic: true}),
            })
            .addField(channelLanguage.get('banEmbedTargetTitle'), channelLanguage.get('banEmbedTargetValue', [ban.user]), true)
            .addField(channelLanguage.get('banEmbedExecutorTitle'), audits.entries.first().executor.toString(), true)
            .setTimestamp()
            .setFooter({
                text: channelLanguage.get('banEmbedFooter', [current.id]),
                iconURL: ban.guild.iconURL({dynamic: true}),
            });
        if(reason) embed.addField(channelLanguage.get('banEmbedReasonTitle'), reason);
        const msg = await discordChannel.send({embeds: [embed]});
        current.logMessage = msg.id;
        await current.save();
    },
};