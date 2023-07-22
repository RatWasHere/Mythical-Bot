const Command = require('../../base/Command.js');
const db = require('quick.db');
const { EmbedBuilder } = require('discord.js');

class SetStartBalance extends Command {
  constructor(client) {
    super(client, {
      name: 'set-start-balance',
      category: 'Economy',
      description: 'Set the starting balance for the server',
      usage: 'set-start-balance <amount>',
      aliases: ['setstartbalance'],
      permLevel: 'Moderator',
      requiredArgs: 1,
      guildOnly: true,
    });
  }

  run(msg, args) {
    const currencySymbol = db.get(`servers.${msg.guild.id}.economy.symbol`) || '$';

    const amount = args
      .join('')
      .replace(/[^0-9\\.-]|-/g, '');

    if (amount > 1000000000000) return msg.channel.send('The max starting balance is one trillion.');

    db.set(`servers.${msg.guild.id}.economy.startBalance`, amount);

    const em = new EmbedBuilder()
      .setAuthor({ name: msg.member.displayName, iconURL: msg.author.displayAvatarURL() })
      .setDescription(
        amount > 0
          ? `The starting balance for new members has been set to: ${currencySymbol + amount.toLocaleString()}`
          : 'The starting balance for new members has been disabled.',
      );
    return msg.channel.send({ embeds: [em] });
  }
}

module.exports = SetStartBalance;
