const db = require('quick.db');
const DiscordJS = require('discord.js');

module.exports = class {
  constructor (client) {
    this.client = client;
  }

  async run (rolebefore, roleafter) {
    const logChan = db.get(`servers.${roleafter.guild.id}.logs.channel`);
    if (!logChan) return;

    const logSys = db.get(`servers.${roleafter.guild.id}.logs.log_system.role-updated`);
    if (logSys !== 'enabled') return;
    const logChannel = roleafter.guild.channels.cache.get(logChan);
    if (!logChannel.permissionsFor(this.client.user.id).has('SEND_MESSAGES')) return;

    if (rolebefore.name === roleafter.name && rolebefore.hexColor === roleafter.hexColor) return;

    const embed = new DiscordJS.MessageEmbed()
      .setTitle(`Role "${rolebefore.name}" Updated`)
      .setColor(roleafter.hexColor)
      .addField('Name', (rolebefore.name === roleafter.name) ? 'Updated: :x:' : `Updated: ✅ \n New Name: ${roleafter.name}`, true)
      .addField('Color', (rolebefore.hexColor === roleafter.hexColor) ? 'Updated: :x:' : `Updated: ✅ \n New Color: ${roleafter.hexColor}`, true)
      .setFooter(`ID: ${roleafter.id}`)
      .setTimestamp();
    roleafter.guild.channels.cache.get(logChan).send({ embeds: [embed] });

    db.add(`servers.${roleafter.guild.id}.logs.role-updated`, 1);
    db.add(`servers.${roleafter.guild.id}.logs.all`, 1);
  }
};
