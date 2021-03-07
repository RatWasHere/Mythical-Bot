const Command = require('../../base/Command.js');
const { getMember } = require('../../base/Util.js');
const db = require('quick.db');
const DiscordJS = require('discord.js');

module.exports = class BalanceCommand extends Command {
  constructor (client) {
    super(client, {
      name: 'give-money',
      description: 'Pay another user',
      category: 'Economy',
      usage: 'Give-Money <user> <amount | all>',
      aliases: ['givemoney', 'pay', 'send'],
      guildOnly: true
    });
  }

  run (msg, text) {
    const member = msg.member;
    const p = msg.settings.prefix;
    let mem;

    const usage = `${p}Give-Money <user> <amount | all>`;
    const errEmbed = new DiscordJS.MessageEmbed()
      .setColor('#EC5454')
      .setAuthor(msg.author.tag, msg.author.displayAvatarURL());

    if (!text || text.length < 1) {
      errEmbed.setDescription(`Incorrect Usage: ${usage}`);
      return msg.channel.send(errEmbed);
    } else {
      mem = getMember(msg, text[0]);
    }

    if (!mem) {
      errEmbed.setDescription(`That user was not found. \nUsage: ${usage}`);
      return msg.channel.send(errEmbed);
    } else if (mem.id === msg.author.id) {
      errEmbed.setDescription('You cannot trade money with yourself. That would be pointless.');
      return msg.channel.send(errEmbed);
    }

    const cs = db.get(`servers.${msg.guild.id}.economy.symbol`) || '$';
    const authCash = db.get(`servers.${msg.guild.id}.users.${member.id}.economy.cash`) || 0;

    let amount = text[1];
    amount = amount.replace(/,/g, '');
    amount = amount.replace(cs, '');
    if (isNaN(amount)) {
      if (amount.toLowerCase() === 'all') {
        amount = authCash;

        if (amount > authCash) {
          errEmbed.setDescription(`You don't have that much money to give. You currently have ${cs}${authCash}`);
          return msg.channel.send(errEmbed);
        } else if (amount < 0) {
          errEmbed.setDescription('You can\'t give negative amounts of money.');
          return msg.channel.send(errEmbed);
        } else if (amount === 0) {
          errEmbed.setDescription('You can\'t give someone nothing.');
          return msg.channel.send(errEmbed);
        }

        db.subtract(`servers.${msg.guild.id}.users.${member.id}.economy.cash`, amount);
        db.add(`servers.${msg.guild.id}.users.${mem.id}.economy.cash`, amount);

        const embed = new DiscordJS.MessageEmbed()
          .setColor('#04ACF4')
          .setAuthor(msg.author.tag, msg.author.displayAvatarURL())
          .setDescription(`${mem} has recieved your ${cs}${amount.toLocaleString()}.`);
        return msg.channel.send(embed);
      } else {
        const embed = new DiscordJS.MessageEmbed()
          .setColor('#EC5454')
          .setAuthor(msg.author.tag, msg.author.displayAvatarURL())
          .setDescription(`Incorrect Usage: ${usage}`);
        return msg.channel.send(embed);
      }
    }
    amount = parseInt(amount);

    if (amount > authCash) {
      errEmbed.setDescription(`You don't have that much money to give. You currently have ${cs}${authCash.toLocaleString()}`);
      return msg.channel.send(errEmbed);
    } else if (amount < 0) {
      errEmbed.setDescription('You can\'t give negative amounts of money.');
      return msg.channel.send(errEmbed);
    } else if (amount === 0) {
      errEmbed.setDescription('You can\'t give someone nothing.');
      return msg.channel.send(errEmbed);
    }

    db.subtract(`servers.${msg.guild.id}.users.${member.id}.economy.cash`, amount);
    db.add(`servers.${msg.guild.id}.users.${mem.id}.economy.cash`, amount);

    const embed = new DiscordJS.MessageEmbed()
      .setColor('#04ACF4')
      .setAuthor(msg.author.tag, msg.author.displayAvatarURL())
      .setDescription(`${mem} has recieved your ${cs}${amount.toLocaleString()}.`);
    return msg.channel.send(embed);
  }
};
