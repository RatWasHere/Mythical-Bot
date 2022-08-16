const Command = require('../../base/Command.js');
const Discord = require('discord.js');
const db = require('quick.db');

class logSystem extends Command {
  constructor (client) {
    super(client, {
      name: 'log-system',
      description: 'See information about the log system',
      usage: 'Log-System',
      category: 'Logging',
      permLevel: 'Moderator',
      aliases: ['logsystem'],
      guildOnly: true
    });
  }

  async run (msg) {
    if (!db.get(`servers.${msg.guild.id}.logs.channel`)) return msg.channel.send(`The log system is not set up! Use \`${msg.settings.prefix}Setup Logging <Channel>\``);

    const embed = new Discord.EmbedBuilder()
      .setColor('#36393F')
      .addFields([
        {
          name: 'Toggle Status',
          value: `
**Channel Created:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.channel-created`) || ':x:'}
**Channel Deleted:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.channel-deleted`) || ':x:'}
**Channel Updated:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.channel-updated`) || ':x:'}
**Thread Channel Created:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.thread-created`) || ':x:'}
**Thread Channel Deleted:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.thread-deleted`) || ':x:'}
**Voice Channel Created:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.v-channel-created`) || ':x:'}
**Voice Channel Deleted:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.v-channel-deleted`) || ':x:'}
**Member Joined:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.member-join`) || ':x:'}
**Member Leave:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.member-leave`) || ':x:'}
**Message Edited:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.message-edited`) || ':x:'}
**Message Deleted:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.message-deleted`) || ':x:'}
**Role Created:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.role-created`) || ':x:'}
**Role Deleted:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.role-deleted`) || ':x:'}
**Role Updated:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.role-updated`) || ':x:'}
**Emoji Created:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.emoji-created`) || ':x:'}
**Emoji Deleted:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.emoji-deleted`) || ':x:'}
**Bulk Messages Deleted:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.bulk-messages-deleted`) || ':x:'}
`,
          inline: true
        },
        {
          name: 'System Status',
          value: `
**Channels Created:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.channel-created`) || '0'}
**Channels Deleted:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.channel-deleted`) || '0'}
**Channels Updated:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.channel-updated`) || '0'}
**Thread Channels Created:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.thread-deleted`) || '0'}
**Thread Channels Deleted:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.thread-deleted`) || '0'}
**Voice Channels Created:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.v_channel-created`) || '0'}
**Voice Channels Deleted:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.v_channel-deleted`) || '0'}
**Members Joined:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.member-joined`) || '0'}
**Members Left:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.member-leave`) || '0'}
**Messages Edited:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.message-edited`) || '0'}
**Messages Deleted:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.message-deleted`) || '0'}
**Roles Created:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.role-created`) || '0'}
**Roles Deleted:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.role-deleted`) || '0'}
**Roles Updated:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.role-updated`) || '0'}
**Emojis Created:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.emoji-created`) || '0'}
**Emojis Deleted:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.emoji-deleted`) || '0'}
**Bulk Messages Deleted:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.bulk-messages-deleted`) || '0'}
**Total:** ${db.get(`servers.${msg.guild.id}.logs.logSystem.all`) || '0'}
`,
          inline: true
        }
      ])
      .setFooter({ text: 'logs.logSystem System V3.2' });

    if (msg.guild.members.me.permissions.has('ManageMessages')) msg.delete();
    return msg.channel.send({ embeds: [embed] });
  }
}

module.exports = logSystem;