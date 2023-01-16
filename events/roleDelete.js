const db = require('quick.db');
const { EmbedBuilder } = require('discord.js');

module.exports = class {
  constructor (client) {
    this.client = client;
  }

  async run (role) {
    const logChan = db.get(`servers.${role.guild.id}.logs.channel`);
    if (!logChan) return;

    const logSys = db.get(`servers.${role.guild.id}.logs.logSystem.role-deleted`);
    if (logSys !== 'enabled') return;

    const embed = new EmbedBuilder()
      .setTitle('Role Deleted')
      .setColor(role.hexColor)
      .addFields([
        { name: 'Name', value: role.name },
        { name: 'Managed', value: role.managed },
        { name: 'Position', value: role.position.toString() }
      ])
      .setFooter({ text: `ID: ${role.id}` })
      .setTimestamp();
    role.guild.channels.cache.get(logChan).send({ embeds: [embed] }).catch(() => {});

    db.add(`servers.${role.guild.id}.logs.role-deleted`, 1);
    db.add(`servers.${role.guild.id}.logs.all`, 1);
  }
};
