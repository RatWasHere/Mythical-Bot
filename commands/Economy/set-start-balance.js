const Command = require('../../base/Command.js');
const db = require('quick.db');
const DiscordJS = require('discord.js');

module.exports = class startBalance extends Command {
  constructor (client) {
    super(client, {
      name: 'set-start-balance',
      category: 'Economy',
      description: 'Set the starting balance for the server',
      usage: 'set-start-balance <amount>',
      aliases: ['setstartbalance', 'ssb'],
      guildOnly: true
    });
  }

  run (msg, args) {
    if (!args || args.length < 1) return msg.channel.send(`Incorrect Usage: ${msg.settings.prefix}set-start-balance <amount>`);

    const cs = db.get(`servers.${msg.guild.id}.economy.symbol`) || '$';

    const amount = parseInt(args.join('').replace(/,/g, '').replace(cs, '').replace(/-/g, ''));

    if (amount > 1000000000000) return msg.channel.send('The max starting balance is one trillion.');

    db.set(`servers.${msg.guild.id}.economy.startBalance`, amount);

    const em = new DiscordJS.MessageEmbed()
      .setAuthor(msg.member.displayName, msg.author.displayAvatarURL())
      .setDescription(amount > 0 ? `The starting balance for new members has been set to: ${cs + amount.toLocaleString()}` : 'The starting balance for new members has been disabled.');
    return msg.channel.send(em);
  }
};