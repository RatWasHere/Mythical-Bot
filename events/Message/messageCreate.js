const db = require('quick.db');
const { ChannelType, EmbedBuilder } = require('discord.js');

module.exports = class {
  constructor(client) {
    this.client = client;
  }

  async run(message) {
    let bool = true;

    if (message.author.bot) return;
    if (message.guild && !message.channel.permissionsFor(this.client.user.id).has('SendMessages')) return;
    if (message.guild && !message.guild.members.me.permissions.has('SendMessages')) return;

    const settings = this.client.getSettings(message.guild);
    message.settings = settings;
    let tag = settings.prefix;

    const prefixMention = new RegExp(`^(<@!?${this.client.user.id}>)(\\s+)?`);
    if (message.guild && message.content.match(prefixMention)) {
      tag = String(message.guild.members.me);
    } else if (message.content.indexOf(settings.prefix) !== 0) {
      bool = false;
      // Economy chat money event
      if (message.channel.type === ChannelType.DM) return;

      const min = db.get(`servers.${message.guild.id}.economy.chat.min`) || 10;
      const max = db.get(`servers.${message.guild.id}.economy.chat.max`) || 100;

      const now = Date.now();
      const cooldown = db.get(`servers.${message.guild.id}.economy.chat.cooldown`) || 60; // get cooldown from database or set to 60 seconds (1 minute)
      let userCooldown = db.get(`servers.${message.guild.id}.users.${message.member.id}.economy.chat.cooldown`) || {};

      if (userCooldown.active) {
        const timeleft = userCooldown.time - now;
        if (timeleft < 0 || timeleft > cooldown * 1000) {
          // this is to check if the bot restarted before their cooldown was set.
          userCooldown = {};
          userCooldown.active = false;
          db.set(`servers.${message.guild.id}.users.${message.member.id}.economy.chat.cooldown`, userCooldown);
        } else {
          return;
        }
      }

      const amount = BigInt(Math.floor(Math.random() * (max - min + 1) + min));
      const cash = BigInt(
        db.get(`servers.${message.guild.id}.users.${message.member.id}.economy.cash`) ||
          db.get(`servers.${message.guild.id}.economy.startBalance`) ||
          0,
      );
      const newAmount = cash + amount;
      db.set(`servers.${message.guild.id}.users.${message.member.id}.economy.cash`, newAmount.toString());

      userCooldown.time = now + cooldown * 1000;
      userCooldown.active = true;
      db.set(`servers.${message.guild.id}.users.${message.member.id}.economy.chat.cooldown`, userCooldown);

      return setTimeout(() => {
        userCooldown = {};
        userCooldown.active = false;
        db.set(`servers.${message.guild.id}.users.${message.member.id}.economy.chat.cooldown`, userCooldown);
      }, cooldown * 1000);
    }

    // Here we separate our "command" name, and our "arguments" for the command.
    // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
    // command = say
    // args = ["Is", "this", "the", "real", "life?"]
    if (!bool) return;
    const args = message.content.slice(tag.length).trim().split(/\s+/g);
    const command = args.shift().toLowerCase();
    if (!command && tag === String(message.guild?.me)) {
      if (!args || args.length < 1) return message.channel.send(`The current prefix is: ${message.settings.prefix}`);
    }

    // If the member on a guild is invisible or not cached, fetch them.
    if (message.guild && !message.member) await message.guild.fetchMember(message.author);

    // Get the user or member's permission level from the elevation
    const level = this.client.permlevel(message);

    // Check whether the command, or alias, exist in the collections defined in index.js
    const cmd = this.client.commands.get(command) || this.client.commands.get(this.client.aliases.get(command));
    if (!cmd) return;

    // Check if the member is blacklisted from using commands in this guild.
    if (message.guild) {
      const bl = db.get(`servers.${message.guild.id}.users.${message.member.id}.blacklist`);
      if (bl && level < 4 && cmd.help.name !== 'blacklist') {
        return message.channel.send(
          `Sorry ${message.member.displayName}, you are currently blacklisted from using commands in this server.`,
        );
      }
    }

    if (!message.guild && cmd.conf.guildOnly)
      return message.channel.send(
        'This command is unavailable via private message. Please run this command in a guild.',
      );

    if (cmd.conf.nsfw && !message.channel.nsfw)
      return message.channel.send('This command can only be used in NSFW channels.');

    if (!cmd.conf.enabled) return message.channel.send('This command is currently disabled.');

    if (level < this.client.levelCache[cmd.conf.permLevel]) {
      if (settings.systemNotice === 'true') {
        const authorName = message.author.discriminator === '0' ? message.author.username : message.author.tag;
        const embed = new EmbedBuilder()
          .setTitle('Missing Permission')
          .setAuthor({ name: authorName, iconURL: message.author.displayAvatarURL() })
          .setColor(message.settings.embedErrorColor)
          .addFields([
            {
              name: 'Your Level',
              value: `${level} (${this.client.config.permLevels.find((l) => l.level === level).name})`,
              inline: true,
            },
            {
              name: 'Required Level',
              value: `${this.client.levelCache[cmd.conf.permLevel]} (${cmd.conf.permLevel})`,
              inline: true,
            },
          ]);

        return message.channel.send({ embeds: [embed] });
      } else {
        return;
      }
    }

    if (cmd.conf.requiredArgs > args.length) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
        .setColor(message.settings.embedErrorColor)
        .setTitle('Missing Command Arguments')
        .setFooter({ text: '[] = optional, <> = required' })
        .addFields([
          { name: 'Incorrect Usage', value: message.settings.prefix + cmd.help.usage },
          { name: 'Examples', value: cmd.help.examples?.join('\n') || 'None' },
        ]);
      return message.channel.send({ embeds: [embed] });
    }

    // To simplify message arguments, the author's level is now put on level (not member, so it is supported in DMs)
    message.author.permLevel = level;

    // If the command exists, **AND** the user has permission, run it.
    db.add('global.commands', 1);
    cmd.run(message, args, level);
  }
};