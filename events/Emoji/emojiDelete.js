const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = class {
  constructor(client) {
    this.client = client;
  }

  async run(emoji) {
    const logChan = await db.get(`servers.${emoji.guild.id}.logs.channel`);
    if (!logChan) return;

    const logSys = await db.get(`servers.${emoji.guild.id}.logs.logSystem.emoji`);
    if (logSys !== 'enabled') return;

    const embed = new EmbedBuilder()
      .setTitle('Emoji Deleted')
      .setColor(this.client.getSettings(emoji.guild).embedErrorColor)
      .setThumbnail(emoji.url)
      .addFields([
        { name: 'Name', value: emoji.name, inline: true },
        { name: 'Identifier', value: emoji.identifier, inline: true },
        { name: 'Emoji ID', value: emoji.id, inline: true },
        { name: 'Was Animated?', value: emoji.animated ? 'True' : 'False', inline: true },
      ])
      .setTimestamp();

    emoji.guild.channels.cache
      .get(logChan)
      .send({ embeds: [embed] })
      .catch(() => {});

    await db.add(`servers.${emoji.guild.id}.logs.emoji`, 1);
    await db.add(`servers.${emoji.guild.id}.logs.all`, 1);
  }
};
