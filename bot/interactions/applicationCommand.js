const guild = require('../../schemas/guild.js');
const role = require('../../schemas/role.js');
const channel = require('../../schemas/channel.js');
const user = require('../../schemas/user.js');
const {Collection, Permissions} = require('discord.js');

module.exports = {
    name: 'APPLICATION_COMMAND',
    execute: async interaction => {
        if(interaction.guild && !interaction.guild.available) throw new Error('Invalid interaction.');
        var roleDocs;
        var savedChannel;
        if(interaction.guild){
            if(!interaction.client.guildData.has(interaction.guild.id)){
                let guildData = new guild({
                    _id: interaction.guild.id,
                    language: (interaction.guild.preferredLocale === 'pt-BR') ? 'pt' : 'en',
                });
                guildData.save();
                interaction.client.guildData.set(guildData._id, guildData);
            }
            if(!interaction.member) interaction.member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
            roleDocs = await role.find({
                guild: interaction.guild.id,
                roleID: {$in: interaction.guild.roles.cache.map(e => e.id)},
            });
            savedChannel = await channel.findById(interaction.channel.id);
            if(!interaction.member) throw new Error('Member could not be fetched.');
        }
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        if(interaction.channel.partial) await interaction.channel.fetch();
        const userDoc = await user.findById(interaction.user.id);
        if(userDoc && userDoc.blacklisted) return interaction.reply({
            content: channelLanguage.get('blacklisted'),
            ephemeral: true,
        });
        const {commandName} = interaction;
        const subCommandGroupName = interaction.options.getSubcommandGroup(false);
        const subCommandName = interaction.options.getSubcommand(false);
        const command = interaction.isContextMenu() ? interaction.client.commands.find(cmd => (cmd.contextName === commandName)) : interaction.client.commands.get(commandName);
        if(!command) throw new Error('Invalid command.');
        if((command.dev && (interaction.user.id != interaction.client.application.owner.id)) || (command.alpha && !interaction.client.guildData.get(interaction.guild.id).alpha)) return interaction.reply({
            content: channelLanguage.get('invalidCommand'),
            ephemeral: true,
        });
        if(interaction.client.configs.maintenance && (interaction.user.id != interaction.client.application.owner.id)) return interaction.reply({
            content: channelLanguage.get('maintenance'),
            ephemeral: true,
        });
        if(command.guildOnly && !interaction.guild) return interaction.reply({
            content: channelLanguage.get('guildOnly'),
            ephemeral: true,
        });
        if(command.premium && !interaction.client.guildData.get(interaction.guild.id).premiumUntil && !interaction.client.guildData.get(interaction.guild.id).partner) return interaction.reply(channelLanguage.get('premiumCommand', [prefix]));
        if(command.beta && !interaction.client.guildData.get(interaction.guild.id).beta) return interaction.reply({
            content: channelLanguage.get('betaCommand'),
            ephemeral: true,
        });
        if(interaction.guild && !interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)){
            const roles = roleDocs.filter(e => (e.commandPermissions.id(command.name) && interaction.member.roles.cache.has(e.roleID)));
            if((!roles.length && command.perm && !interaction.member.permissions.has(command.perm)) || (roles.length && roles.some(e => !e.commandPermissions.id(command.name).allow) && !roles.some(e => e.commandPermissions.id(command.name).allow))) return interaction.reply({
                content: channelLanguage.get('forbidden'),
                ephemeral: true,
            });
            if(savedChannel && savedChannel.ignoreCommands.includes(command.name) && interaction.guild.me.permissionsIn(interaction.channel).has(Permissions.FLAGS.ADD_REACTIONS)) return interaction.reply({
                content: channelLanguage.get('disabled'),
                ephemeral: true,
            });
        }
        if(!interaction.client.cooldowns.has(command.name)) interaction.client.cooldowns.set(command.name, new Collection());
        const now = Date.now();
        const timestamps = interaction.client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown / (1 + (!!interaction.client.guildData.get(interaction.guild?.id)?.premiumUntil || !!interaction.client.guildData.get(interaction.guild?.id)?.partner))) * 1000;
        if(timestamps.has(interaction.user.id) && (interaction.user.id != interaction.client.application.owner.id)){
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
            if(now < expirationTime){
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply({
                    content: channelLanguage.get('cooldown', [timeLeft.toFixed(1), command.name, prefix, (interaction.client.guildData.get(interaction.guild.id).premiumUntil || interaction.client.guildData.get(interaction.guild.id).partner)]),
                    ephemeral: true,
                });
            }
        }
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
        const args = {};
        let options = interaction.options.data;
        if(subCommandName) options = subCommandGroupName ? interaction.options.data[0].options[0].options : interaction.options.data[0].options;
        if(options?.length > 0) options.forEach(opt => {
            args[opt.name] = opt[opt.type.toLowerCase()] ? opt[opt.type.toLowerCase()] : opt.value;
            if(opt.type === 'USER' && opt.member) args[opt.name].member = opt.member;
        });
        command[`${subCommandName ? `${(subCommandGroupName ?? '')}${subCommandName}` : 'execute'}Slash`](interaction, args).catch(error => {
            console.error(error);
            if(interaction.deferred || interaction.replied){
                interaction.editReply(channelLanguage.get('error', [command.name]));
            }
            else{
                interaction.reply({
                    content: channelLanguage.get('error', [command.name]),
                    ephemeral: true,
                });
            }
            if(process.env.NODE_ENV === 'production') interaction.client.channels.cache.get(interaction.client.configs.errorlog).send({
                content: `Error: *${error.message}*\nMessage Author: ${interaction.user}\nInteraction ID: ${interaction.id}`,
                files: [
                    {
                        name: 'args.json',
                        attachment: Buffer.from(JSON.stringify(interaction.options.data, null, 4)),
                    },
                    {
                        name: 'stack.log',
                        attachment: Buffer.from(error.stack),
                    },
                ],
            }).catch(console.error);
        });
    },
};