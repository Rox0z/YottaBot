# YottaBot
**[Invite me to your server](https://discord.com/oauth2/authorize?client_id=371902120561082368&permissions=2147483647&scope=bot+applications.commands)**

**[Join the support server](https://discord.gg/eNcsvsy)**

[![DevServer](https://discordapp.com/api/guilds/476244157245947904/widget.png?style=shield)](https://discord.gg/eNcsvsy)

## Get started
Like any other bot, the `help` command will list all the other commands and using `help (command)` will show you the correct usage for a specified command, note that all non slash commands have to be prefixed with your server's prefix ~~(duh)~~ and the default prefix is `y!`

It is recommended to first have a look at the `configs` command so you can customize the bot's behaviour to your liking before using its features

The default permission for any command is usually the closest normal Discord permission you would need to have to do whatever a command does without using the bot, for example, the default required permission for the `rolemenu` command is Manage Roles, because that is the permission you would need to have to manually give roles to a member, however, you might not want to give this dangerous permission to every staff member you want to be able to create selfrole menus, in this case, the `perm` command will let you overwrite the default permission requirements for any command

## Wiki
* [Glossary](https://github.com/HordLawk/YottaBot/wiki/Glossary)
* [Information](https://github.com/HordLawk/YottaBot/wiki/Information)
* [Administration](https://github.com/HordLawk/YottaBot/wiki/Administration)
* [Moderation](https://github.com/HordLawk/YottaBot/wiki/Moderation)
* [Levelling](https://github.com/HordLawk/YottaBot/wiki/Levelling)
* [Miscellaneous](https://github.com/HordLawk/YottaBot/wiki/Miscellaneous)
* [Premium](https://github.com/HordLawk/YottaBot/wiki/Premium)

## Selfhosting
You may selfhost (AKA run your own instance of) this bot under the following circumstances:
- Your instance (referred to as a "clone") must be **private**.
    - As such, your clone must not be listed on any sort of public bot listing.
- You understand that no support will be provided to aid you in self-hosting.
- You agree to not submit any issues, features, or pull requests related to bugs exclusively related to self-hosting.

## W.I.P
- [x] add actionlog for bulkdelete
- [x] update to djs v13
- [x] change mute roles to native timeout and answer commands with replys
- [ ] use slash commands; context menus; buttons; and stuff (on hold until Discord improves slash permissions)
- [ ] apply for messages priviledge intent
- [ ] setup a patreon
- [ ] add rss feeds for youtube notifications
- [ ] `prune` command
- [ ] command to edit slowmode
- [ ] `poll` command
- [ ] command to delete cases
- [ ] command to manage emojis
- [ ] `profile` command
- [ ] add actionlog for edited messages
- [ ] xp multiplier for selected roles
- [ ] mass ban limiter to mitagate damage from compromised mod accounts

## Credits
- [@CripBoy](https://github.com/CripBoy) for helping me with a lot issues I had in the early stages of development (I was dumb(er))
- [@Rox0z](https://github.com/Rox0z) for having coded the base of the slash commands handler I use for YottaBot while I was being lazy