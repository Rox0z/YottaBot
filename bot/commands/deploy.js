module.exports = {
    active: true,
    name: 'deploy',
    dev: true,
    args: true,
    usage: () => ['<user/message/chat_input> (command name)'],
    addSlash: async (interaction, args) => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        if(!args.name || !['CHAT_INPUT', 'USER', 'MESSAGE'].includes(args.type)) throw new Error('Invalid slash command options');
        const command = interaction.client.commands.get(args.name);
        if(!command) return interaction.reply({
            content: channelLanguage.get('invalidCommand'),
            ephemeral: true,
        });
        try{
            const slash = await (((process.env.NODE_ENV === 'production') && !command.dev) ? interaction.client.application : interaction.guild).commands.create({
                type: args.type,
                ...((args.type === 'CHAT_INPUT') ? {
                    name: command.name,
                    description: command.description(interaction.client.langs['en']),
                    options: command.slashOptions,
                } : {name: command.contextName}),
            });
            interaction.reply(channelLanguage.get('deploySuccess', [slash.name, slash.type]));
        }
        catch(e){
            console.error(e);
            interaction.reply(channelLanguage.get('deployFail', [command.name, args.type]));
        }
    },
    editSlash: async (interaction, args) => {
        const channelLanguage = interaction.client.langs[(interaction.locale === 'pt-BR') ? 'pt' : 'en'];
        if(!args.slash_name || !args.command_name || !['CHAT_INPUT', 'USER', 'MESSAGE'].includes(args.type)) throw new Error('Invalid slash command options');
        const command = interaction.client.commands.get(args.command_name);
        const slash = ((process.env.NODE_ENV === 'production') ? interaction.client.application : interaction.guild).commands.cache.get(args.slash_name);
        if(!command || !slash) return interaction.reply({
            content: channelLanguage.get('invalidCommand'),
            ephemeral: true,
        });
        try{
            await slash.edit((slash.type === 'CHAT_INPUT') ? {
                name: command.name,
                description: command.description(interaction.client.langs['en']),
                options: command.slashOptions,
            } : {name: command.contextName});
            interaction.reply(channelLanguage.get('deploySuccess', [slash.name, slash.type]));
        }
        catch(e){
            console.error(e);
            interaction.reply(channelLanguage.get('deployFail', [slash.name, slash.type]));
        }
    },
    slashOptions: [
        {
            type: 'SUB_COMMAND',
            name: 'add',
            description: 'Add a new command',
            options: [
                {
                    type: 'STRING',
                    name: 'type',
                    description: 'The type of this command',
                    required: true,
                    choices: [
                        {
                            name: 'Chat command',
                            value: 'CHAT_INPUT',
                        },
                        {
                            name: 'User context menu command',
                            value: 'USER',
                        },
                        {
                            name: 'Message context menu command',
                            value: 'MESSAGE',
                        },
                    ],
                },
                {
                    type: 'STRING',
                    name: 'name',
                    description: 'The name of this command',
                    required: true,
                    autocomplete: true,
                },
            ],
        },
        {
            type: 'SUB_COMMAND',
            name: 'edit',
            description: 'Edit an existing command',
            options: [
                {
                    type: 'STRING',
                    name: 'type',
                    description: 'The type of this command',
                    required: true,
                    choices: [
                        {
                            name: 'Chat command',
                            value: 'CHAT_INPUT',
                        },
                        {
                            name: 'User context menu command',
                            value: 'USER',
                        },
                        {
                            name: 'Message context menu command',
                            value: 'MESSAGE',
                        },
                    ],
                },
                {
                    type: 'STRING',
                    name: 'slash_name',
                    description: 'Registered slash command name',
                    required: true,
                    autocomplete: true,
                },
                {
                    type: 'STRING',
                    name: 'command_name',
                    description: 'Internal command name',
                    required: true,
                    autocomplete: true,
                },
            ],
        },
    ],
    addAutocomplete: {
        name: (interaction, value) => interaction.respond(interaction.client.commands.filter(e => e.name.startsWith(value.toLowerCase())).first(25).map(e => ({
            name: e.name,
            value: e.name,
        }))),
    },
    editAutocomplete: {
        slash_name: (interaction, value) => interaction.respond(((process.env.NODE_ENV === 'production') ? interaction.client.application : interaction.client.guilds.cache.get(process.env.DEV_GUILD)).commands.cache.filter(e => e.name.toLowerCase().startsWith(value.toLowerCase()) && (e.type === interaction.options.data[0].options.find(ee => (ee.name === 'type')).value)).first(25).map(e => ({
            name: e.name,
            value: e.id,
        }))),
        command_name: (interaction, value) => interaction.respond(interaction.client.commands.filter(e => e.name.startsWith(value.toLowerCase())).first(25).map(e => ({
            name: e.name,
            value: e.name,
        }))),
    },
};