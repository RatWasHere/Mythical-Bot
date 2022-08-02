const db = require('quick.db');
const { EmbedBuilder } = require('discord.js');

module.exports = class {
  constructor (client) {
    this.client = client;
  }

  async run (channel) {
    const logChan = db.get(`servers.${channel.guild.id}.logs.channel`);
    if (!logChan) return;

    const logSys = db.get(`servers.${channel.guild.id}.logs.log_system.channel-deleted`);
    if (logSys !== 'enabled') return;
    if (channel.name.startsWith('ticket-')) return;

    const chans = db.get(`servers.${channel.guild.id}.logs.noLogChans`) || [];
    if (chans.includes(channel.id)) return;

    const logChannel = channel.guild.channels.cache.get(logChan);
    if (!logChannel.permissionsFor(this.client.user.id).has('SendMessages')) return;

    const embed = new EmbedBuilder()
      .setTitle('Channel Deleted')
      .setColor('RED')
      .addFields([
        { name: 'Name', value: channel.name },
        { name: 'Category', value: channel.parent?.name || 'None' }
      ])
      .setFooter({ text: `ID: ${channel.id}` })
      .setTimestamp();
    channel.guild.channels.cache.get(logChan).send({ embeds: [embed] });

    db.add(`servers.${channel.guild.id}.logs.channel-deleted`, 1);
    db.add(`servers.${channel.guild.id}.logs.all`, 1);
  }
};
