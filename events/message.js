// The MESSAGE event runs anytime a message is received
// Note that due to the binding of client to every event, every event
// goes `client, other, args` when this function is run.
const db = require('quick.db');

module.exports = class {
  constructor (client) {
    this.client = client;
  }

  async run (message) {
    let bool = false;
    let tag;

    // It's good practice to ignore other bots. This also makes your bot ignore itself
    //  and not get into a spam loop (we call that "botception").
    if (message.author.bot) return;

    // Cancel any attempt to execute commands if the bot cannot respond to the user.
    if (message.guild && !message.guild.me.permissions.has('SEND_MESSAGES')) return;
    
    // Grab the settings for this server from the Enmap
    // If there is no guild, get default conf (DMs)
    const settings = this.client.getSettings(message.guild);

    // For ease of use in commands and functions, we'll attach the settings
    // to the message object, so `message.settings` is accessible.
    message.settings = settings;

    // Checks if the bot was mentioned, with no message after it, returns the prefix.
    // eslint-disable-next-line no-useless-escape
    const prefixMention = new RegExp(`^(<@!?${this.client.user.id}>)(\s+)?`);
    if (message.content.match(prefixMention)) {
      bool = true;
      tag = String(message.guild.me);
    } else if (message.content.indexOf(settings.prefix) !== 0) {
      // Use this for my chat money event since this is what i check for not existing in it.
      // Don't really know how else I would do it so this works fine for me.
      if (message.channel.type === 'dm') return;
      const msg = message;
      const server = msg.guild;
      const member = msg.member;
      const type = 'chat';
    
      const min = db.get(`servers.${server.id}.economy.${type}.min`) || 10;
      const max = db.get(`servers.${server.id}.economy.${type}.max`) || 100;
    
      const now = Date.now();
      const cooldown = db.get(`servers.${server.id}.economy.${type}.cooldown`) || 60; //get cooldown from database or set to 60 seconds (1 minute)
      let userCooldown = db.get(`servers.${server.id}.users.${member.id}.economy.${type}.cooldown`) || {};
    
      if (userCooldown.active) {
        const timeleft = userCooldown.time - now;
        if (timeleft < 0 || timeleft > (cooldown * 1000)) {
          // this is to check if the bot restarted before their cooldown was set.
          userCooldown = {};
          userCooldown.active = false;
          db.set(`servers.${server.id}.users.${member.id}.economy.${type}.cooldown`, userCooldown);
        } else {
          return;
        }
      }
    
      const amount = Math.floor(Math.random() * (max - min + 1) + min);
      db.add(`servers.${server.id}.users.${member.id}.economy.cash`, amount);
      userCooldown.time = now + (cooldown * 1000);
      userCooldown.active = true;
      db.set(`servers.${server.id}.users.${member.id}.economy.${type}.cooldown`, userCooldown);
    
      return setTimeout(() => {
        userCooldown = {};
        userCooldown.active = false;
        db.set(`servers.${server.id}.users.${member.id}.economy.${type}.cooldown`, userCooldown);
      }, cooldown * 1000);
    } else {
      bool = true;
      tag = settings.prefix;
    }

    // Here we separate our "command" name, and our "arguments" for the command.
    // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
    // command = say
    // args = ["Is", "this", "the", "real", "life?"]
    if (!bool) return;
    const args = message.content.slice(tag.length).trim().split(/ +/g);
    let command = args.shift().toLowerCase();
    if (tag === String(message.guild.me)) {
      command = args.shift().toLowerCase();
    }

    // If the member on a guild is invisible or not cached, fetch them.
    if (message.guild && !message.member) await message.guild.fetchMember(message.author);

    // Get the user or member's permission level from the elevation
    const level = this.client.permlevel(message);

    // Check whether the command, or alias, exist in the collections defined
    // in app.js.
    const cmd = this.client.commands.get(command) || this.client.commands.get(this.client.aliases.get(command));
    // using this const varName = thing OR otherthign; is a pretty efficient
    // and clean way to grab one of 2 values!
    if (!cmd) return;

    // Some commands may not be useable in DMs. This check prevents those commands from running
    // and return a friendly error message.
    if (cmd && !message.guild && cmd.conf.guildOnly)
      return message.channel.send('This command is unavailable via private message. Please run this command in a guild.');

    if (level < this.client.levelCache[cmd.conf.permLevel]) {
      if (settings.systemNotice === 'true') {
        return message.channel.send(`You do not have permission to use this command.
Your permission level is ${level} (${this.client.config.permLevels.find(l => l.level === level).name})
This command requires level ${this.client.levelCache[cmd.conf.permLevel]} (${cmd.conf.permLevel})`);
      } else {
        return;
      }
    }
      
    // To simplify message arguments, the author's level is now put on level (not member, so it is supported in DMs)
    // The "level" command module argument will be deprecated in the future.
    message.author.permLevel = level;

    message.flags = [];
    while (args[0] &&args[0][0] === '-') {
      message.flags.push(args.shift().slice(1));
    }
    
    // If the command exists, **AND** the user has permission, run it.
    db.add('global.commands', 1);
    cmd.run(message, args, level);
  }
};