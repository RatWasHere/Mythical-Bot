const Command = require('../../base/Command.js');
const db = require('quick.db');
const { EmbedBuilder } = require('discord.js');
const hastebin = require('hastebin');
const { DateTime } = require('luxon');

class forceClose extends Command {
  constructor (client) {
    super(client, {
      name: 'force-close',
      description: 'Close your or another ticket',
      usage: 'force-close [ticket-ID] [reason]',
      category: 'Tickets',
      aliases: ['fclose', 'forceclose'],
      guildOnly: true
    });
  }

  async run (msg, args) {
    if (!db.get(`servers.${msg.guild.id}.tickets`)) return msg.channel.send('The ticket system has not been setup in this server.');

    let tName;
    let reason;
    if (msg.channel.name.startsWith('ticket')) {
      if (!args[0]) {
        tName = msg.channel.name;
        reason = 'No reason specified';
      } else if (db.get(`servers.${msg.guild.id}.tickets.${args[0]}`)) {
        tName = args[0];
        args.shift();
        reason = args?.join(' ') || 'No reason specified';
      } else {
        tName = msg.channel.name;
        reason = args?.join(' ') || 'No reason specified';
      }
    } else {
      if (!args[0]) return msg.channel.send(`Incorrect Usage: ${msg.settings.prefix}force-close [ticket-ID] [reason]`);
      tName = args[0];
      args.shift();
      reason = args?.join(' ') || 'No reason specified';
      // not inside tix channel so need tix ID
    }

    const { logID, roleID } = db.get(`servers.${msg.guild.id}.tickets`);

    const owner = db.get(`servers.${msg.guild.id}.tickets.${tName}.owner`);
    const role = msg.guild.roles.cache.get(roleID);

    // Are they inside a ticket channel?
    if (!msg.channel.name.startsWith('ticket')) {
      // Do they have the support role?
      if (!msg.member.roles.cache.some(r => r.id === roleID)) return msg.channel.send(`You need to be a member of ${role.name} to use force-close.`);
      // Did they supply a ticket ID?
      if (!tName && !msg.channel.name.startsWith('ticket')) return msg.channel.send('You need to supply the ticket ID.');

      if (!owner) return msg.channel.send('That is not a valid ticket. Please try again.');
    } else {
      // Do they have the support role or are owner?
      if (owner !== msg.author.id) {
        if (!msg.member.roles.cache.some(r => r.id === roleID)) {
          return msg.channel.send(`You need to be the ticket owner or a member of ${role.name} to use force-close.`);
        }
      }
    }

    const chan = await msg.guild.channels.cache.find(c => c.name === tName);
    if (!chan) return msg.channel.send('That is not a valid ticket, or has already been closed.');

    // Logging info
    const output = `${DateTime.now().toLocaleString(DateTime.DATETIME_FULL)} - ${msg.author.tag} has requested to force-close this ticket. \nTranscript will be sent to ticket owner.`;

    db.push(`servers.${msg.guild.id}.tickets.${tName}.chatLogs`, output);

    let chatLogs = db.get(`servers.${msg.guild.id}.tickets.${tName}.chatLogs`);
    chatLogs ? chatLogs = chatLogs.join('\n') : chatLogs = 'No Transcript available';

    let url;

    await hastebin.createPaste(chatLogs, {
      raw: true,
      contentType: 'text/plain',
      server: 'https://haste.crafters-island.com'
    })
      .then(function (urlToPaste) {
        url = urlToPaste;
      })
      .catch(function (requestError) { this.client.logger.error(requestError); });

    let received;

    const tOwner = await msg.guild.members.cache.get(owner);

    const userEmbed = new EmbedBuilder()
      .setAuthor({ name: msg.member.displayName, iconURL: msg.author.displayAvatarURL() })
      .setTitle('Ticket Closed')
      .setColor('#E65DF4')
      .addFields([
        { name: 'Ticket Name', value: `${tName}`, inLine: false },
        { name: 'Transcript URL', value: url, inLine: false },
        { name: 'Reason', value: reason, inLine: false },
        { name: 'Server', value: msg.guild.name, inLine: false },
        { name: 'Closed By', value: `${msg.author} (${msg.author.id})`, inLine: false }
      ])
      .setFooter({ text: 'Transcripts expire 30 days after last view date.' })
      .setTimestamp();
    await tOwner.send({ embeds: [userEmbed] })
      .catch(() => { received = 'no'; });

    const logEmbed = new EmbedBuilder()
      .setAuthor({ name: msg.member.displayName, iconURL: msg.author.displayAvatarURL() })
      .setTitle('Ticket Closed')
      .addFields([
        { name: 'Author', value: `${tOwner} (${tOwner.id})`, inLine: false },
        { name: 'Channel', value: `${tName}: ${chan.id}`, inLine: false },
        { name: 'Transcript URL', value: url, inLine: false },
        { name: 'Reason', value: reason, inLine: false }
      ])
      .setColor('#E65DF4')
      .setTimestamp();
    if (received === 'no') logEmbed.setFooter({ text: 'Could not message author.' });
    await msg.guild.channels.cache.get(logID).send({ embeds: [logEmbed] });

    db.delete(`servers.${msg.guild.id}.tickets.${tName}`);
    return msg.channel.delete();
  }
}

module.exports = forceClose;
