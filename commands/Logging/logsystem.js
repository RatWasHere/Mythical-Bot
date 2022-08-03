const Command = require('../../base/Command.js');
const Discord = require('discord.js');
const db = require('quick.db');

class LogSystem extends Command {
  constructor (client) {
    super(client, {
      name: 'logsystem',
      description: 'See information about the log system',
      usage: 'logsystem',
      category: 'Logging',
      permLevel: 'Moderator'
    });
  }

  async run (msg) {
    if (!db.get(`servers.${msg.guild.id}.logs.channel`)) return msg.channel.send(`The log system is not set up! Use \`${msg.settings.prefix}setlogchannel <channel>\``);

    const embed = new Discord.EmbedBuilder()
      .setColor('#36393F')
      .addFields([
        {
          name: 'Toggle Status',
          value: `
**Channel Created:** ${db.get(`servers.${msg.guild.id}.logs.log_system.channel-created`) || ':x:'}
**Channel Deleted:** ${db.get(`servers.${msg.guild.id}.logs.log_system.channel-deleted`) || ':x:'}
**Channel Updated:** ${db.get(`servers.${msg.guild.id}.logs.log_system.channel-updated`) || ':x:'}
**Thread Channel Created:** ${db.get(`servers.${msg.guild.id}.logs.log_system.thread-created`) || ':x:'}
**Thread Channel Deleted:** ${db.get(`servers.${msg.guild.id}.logs.log_system.thread-deleted`) || ':x:'}
**Voice Channel Created:** ${db.get(`servers.${msg.guild.id}.logs.log_system.v-channel-created`) || ':x:'}
**Voice Channel Deleted:** ${db.get(`servers.${msg.guild.id}.logs.log_system.v-channel-deleted`) || ':x:'}
**Member Joined:** ${db.get(`servers.${msg.guild.id}.logs.log_system.member-join`) || ':x:'}
**Member Leave:** ${db.get(`servers.${msg.guild.id}.logs.log_system.member-leave`) || ':x:'}
**Message Edited:** ${db.get(`servers.${msg.guild.id}.logs.log_system.message-edited`) || ':x:'}
**Message Deleted:** ${db.get(`servers.${msg.guild.id}.logs.log_system.message-deleted`) || ':x:'}
**Role Created:** ${db.get(`servers.${msg.guild.id}.logs.log_system.role-created`) || ':x:'}
**Role Deleted:** ${db.get(`servers.${msg.guild.id}.logs.log_system.role-deleted`) || ':x:'}
**Role Updated:** ${db.get(`servers.${msg.guild.id}.logs.log_system.role-updated`) || ':x:'}
**Emoji Created:** ${db.get(`servers.${msg.guild.id}.logs.log_system.emoji-created`) || ':x:'}
**Emoji Deleted:** ${db.get(`servers.${msg.guild.id}.logs.log_system.emoji-deleted`) || ':x:'}
**Bulk Messages Deleted:** ${db.get(`servers.${msg.guild.id}.logs.log_system.bulk-messages-deleted`) || ':x:'}
`,
          inline: true
        },
        {
          name: 'System Status',
          value: `
**Channels Created:** ${db.get(`servers.${msg.guild.id}.logs.channel-created`) || '0'}
**Channels Deleted:** ${db.get(`servers.${msg.guild.id}.logs.channel-deleted`) || '0'}
**Channels Updated:** ${db.get(`servers.${msg.guild.id}.logs.channel-updated`) || '0'}
**Thread Channels Created:** ${db.get(`servers.${msg.guild.id}.logs.thread-deleted`) || '0'}
**Thread Channels Deleted:** ${db.get(`servers.${msg.guild.id}.logs.thread-deleted`) || '0'}
**Voice Channels Created:** ${db.get(`servers.${msg.guild.id}.logs.v_channel-created`) || '0'}
**Voice Channels Deleted:** ${db.get(`servers.${msg.guild.id}.logs.v_channel-deleted`) || '0'}
**Members Joined:** ${db.get(`servers.${msg.guild.id}.logs.member-joined`) || '0'}
**Members Left:** ${db.get(`servers.${msg.guild.id}.logs.member-leave`) || '0'}
**Messages Edited:** ${db.get(`servers.${msg.guild.id}.logs.message-edited`) || '0'}
**Messages Deleted:** ${db.get(`servers.${msg.guild.id}.logs.message-deleted`) || '0'}
**Roles Created:** ${db.get(`servers.${msg.guild.id}.logs.role-created`) || '0'}
**Roles Deleted:** ${db.get(`servers.${msg.guild.id}.logs.role-deleted`) || '0'}
**Roles Updated:** ${db.get(`servers.${msg.guild.id}.logs.role-updated`) || '0'}
**Emojis Created:** ${db.get(`servers.${msg.guild.id}.logs.emoji-created`) || '0'}
**Emojis Deleted:** ${db.get(`servers.${msg.guild.id}.logs.emoji-deleted`) || '0'}
**Bulk Messages Deleted:** ${db.get(`servers.${msg.guild.id}.logs.bulk-messages-deleted`) || '0'}
**Total:** ${db.get(`servers.${msg.guild.id}.logs.all`) || '0'}
`,
          inline: true
        }
      ])
      .setFooter({ text: 'Logs System V3.1' });

    if (msg.guild.members.me.permissions.has('ManageMessages')) msg.delete();
    return msg.channel.send({ embeds: [embed] });
  }
}

module.exports = LogSystem;
