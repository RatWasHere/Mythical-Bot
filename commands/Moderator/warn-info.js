const Command = require('../../base/Command.js');
const db = require('quick.db');
const DiscordJS = require('discord.js');
const moment = require('moment');

class warninfo extends Command {
  constructor (client) {
    super(client, {
      name: 'warn-info',
      description: 'View the information of a specific case.',
      usage: 'warn-info <caseID>',
      category: 'Moderator',
      guildOnly: true,
      permLevel: 'Moderator',
      aliases: ['case', 'warning', 'caseinfo', 'warninginfo', 'warninfo']
    });
  }

  async run (msg, args) {
    if (!args || args.length < 1) return msg.channel.send('incorrect usage please supply caseid');
    const caseID = args.join(' ');
    const warn = db.get(`servers.${msg.guild.id}.warns.warnings.${caseID}`);

    if (!warn) return msg.channel.send('I couldn\'t find any case with that ID.');

    const { mod, points, reason, user, timestamp, messageURL } = warn;
    const victim = await this.client.users.fetch(user);
    const moderator = await this.client.users.fetch(mod);

    const em = new DiscordJS.MessageEmbed()
      .setAuthor(msg.member.displayName, msg.author.displayAvatarURL())
      .setColor('BLUE')
      .addField('Case ID', caseID, true)
      .addField('User', victim, true)
      .addField('Points', points, true)
      .addField('Moderator', moderator, true)
      .addField('Warned on', moment(timestamp).format('LLL'), true)
      .addField('Message URL', messageURL, true)
      .addField('Reason', reason, false);
    msg.channel.send(em);
  }
}

module.exports = warninfo;