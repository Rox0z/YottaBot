const {MessageEmbed, Permissions} = require('discord.js');

module.exports = {
    active: true,
    name: 'support',
    description: lang => lang.get('supportDescription'),
    cooldown: 5,
    categoryID: 1,
    execute: async message => {
        const channelLanguage = message.client.langs[message.guild ? message.client.guildData.get(message.guild.id).language : 'en'];
        if(message.guild && !message.guild.me.permissionsIn(message.channel).has(Permissions.FLAGS.EMBED_LINKS)) return message.reply(channelLanguage.get('botEmbed'));
        const embed = new MessageEmbed()
            .setColor(message.guild?.me.displayColor || 0x8000ff)
            .setDescription(channelLanguage.get('supportEmbedDescription', [message.client.configs.support]));
        message.reply({embeds: [embed]});
    },
    executeSlash: async interaction => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        const embed = new MessageEmbed()
            .setColor(interaction.guild?.me.displayColor || 0x8000ff)
            .setDescription(channelLanguage.get('supportEmbedDescription', [interaction.client.configs.support]));
        interaction.reply({embeds: [embed]});
    },
}