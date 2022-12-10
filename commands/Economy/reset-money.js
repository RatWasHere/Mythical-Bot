const Command = require('../../base/Command.js');
const { getMember, verify } = require('../../util/Util.js');
const db = require('quick.db');
const { EmbedBuilder } = require('discord.js');

class ResetMoney extends Command {
  constructor (client) {
    super(client, {
      name: 'reset-money',
      description: 'Reset the money of a user.',
      category: 'Economy',
      usage: 'Reset-Money [user]',
      aliases: ['resetmoney', 'rm'],
      guildOnly: true
    });
  }

  async run (msg, text, level) {
    let mem;

    if (!text || text.length < 1) {
      await msg.channel.send('Are you sure you want to reset your money? (yes/no)');
      const verification = await verify(msg.channel, msg.author);
      if (verification) {
        const amount = db.get(`servers.${msg.guild.id}.economy.startBalance`) || 0;
        db.set(`servers.${msg.guild.id}.users.${msg.member.id}.economy.cash`, amount);
        db.set(`servers.${msg.guild.id}.users.${msg.member.id}.economy.bank`, 0);
        return msg.channel.send('Your money has been reset.');
      } else {
        return msg.channel.send('Cancelled, your money will not be reset.');
      }
    } else {
      if (level < this.client.levelCache.Moderator) {
        if (this.client.settings.systemNotice === 'true') {
          return msg.channel.send(`You do not have permission to use this command.
  Your permission level is ${level} (${this.client.config.permLevels.find(l => l.level === level).name})
  This command requires level ${this.client.levelCache.Moderator} (Moderator)`);
        } else {
          return;
        }
      }

      mem = await getMember(msg, text.join(' '));

      if (!mem) {
        const fid = text.join(' ').replace('<@', '').replace('>', '');
        try {
          mem = await this.client.users.fetch(fid);
        } catch (err) {
          const embed = new EmbedBuilder()
            .setColor('#EC5454')
            .setAuthor({ name: msg.author.tag, iconURL: msg.author.displayAvatarURL() })
            .setDescription(`That user was not found. \nUsage: ${msg.settings.prefix}Reset-Money <user>`);
          return msg.channel.send({ embeds: [embed] });
        }
      }

      await msg.channel.send(`Are you sure you want to reset ${mem.user?.tag || mem.tag}'s money? (yes/no)`);
      const verification = await verify(msg.channel, msg.author);
      if (verification) {
        const amount = db.get(`servers.${msg.guild.id}.economy.startBalance`) || 0;
        db.set(`servers.${msg.guild.id}.users.${mem.id}.economy.cash`, amount);
        db.set(`servers.${msg.guild.id}.users.${mem.id}.economy.bank`, 0);
        return msg.channel.send(`Successfully reset ${mem.user?.tag || mem.tag}'s money.`);
      } else {
        return msg.channel.send(`Cancelled, ${mem.user?.tag || mem.tag}'s money won't be reset.`);
      }
    }
  }
}

module.exports = ResetMoney;
