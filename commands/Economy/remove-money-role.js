const Command = require('../../base/Command.js');
const { getRole } = require('../../base/Util.js');
const db = require('quick.db');
const DiscordJS = require('discord.js');
const { stripIndents } = require('common-tags');

module.exports = class addMoneyRole extends Command {
  constructor (client) {
    super(client, {
      name: 'remove-money-role',
      category: 'Economy',
      description: 'Remove money to a role\'s members cash or bank balance. \nIf the cash or bank argument isn\'t given, it will be added to the cash part.',
      usage: 'remove-money-role <cash | bank> <role> <amount>',
      aliases: ['removemoneyrole', 'removebalrole'],
      guildOnly: true
    });
  }

  run (msg, args) {
    const usage = `Incorrect Usage: ${msg.settings.prefix}remove-money-role <cash | bank> <role> <amount>`;

    const errEmbed = new DiscordJS.MessageEmbed()
      .setColor('#EC5454')
      .setAuthor(msg.author.tag, msg.author.displayAvatarURL());

    if (!msg.member.permissions.has('MANAGE_GUILD')) {
      errEmbed.setDescription('You are missing the **Manage Guild** permission.');
      return msg.channel.send(errEmbed);
    }

    let type = 'cash';
    let role;
    let amount;

    if (!args || args.length < 2) {
      errEmbed.setDescription(usage);
      return msg.channel.send(errEmbed);
    }

    if (args.length === 2) {
      role = getRole(msg, args[0]);
      amount = parseInt(args[1]);
    } else {
      role = getRole(msg, args[1]);
      amount = parseInt(args[2]);
    }

    if (['cash', 'bank'].includes(args[0].toLowerCase())) {
      type = args[0].toLowerCase();
    }

    if (isNaN(amount)) {
      errEmbed.setDescription(usage);
      return msg.channel.send(errEmbed);
    }

    if (!role) {
      errEmbed.setDescription(stripIndents`
      :x: Invalid role given.

      Usage: ${msg.settings.prefix}remove-money=role <cash | bank> <role> <amount>
      `);
      return msg.channel.send(errEmbed);
    }

    const members = role.members.array();
    const cs = db.get(`servers.${msg.guild.id}.economy.symbol`) || '$';

    if (type === 'bank') {
      members.forEach(mem => {
        if (!mem.user.bot) db.subtract(`servers.${msg.guild.id}.users.${mem.id}.economy.bank`, amount);
      });
    } else {
      members.forEach(mem => {
        if (!mem.user.bot) {
          const cash = db.get(`servers.${msg.guild.id}.users.${mem.id}.economy.cash`) || db.get(`servers.${msg.guild.id}.economy.startBalance`) || 0;
          const newAmount = cash - amount;
          db.set(`servers.${msg.guild.id}.users.${mem.id}.economy.cash`, newAmount);
        }
      });
    }

    const embed = new DiscordJS.MessageEmbed()
      .setAuthor(msg.author.tag, msg.author.displayAvatarURL())
      .setColor('#0099CC')
      .setDescription(`:white_check_mark: Removed **${cs}${amount.toLocaleString()}** to ${type} balance of ${members.length} ${members.length > 1 ? 'members' : 'member'} with the ${role}.`)
      .setTimestamp();
    return msg.channel.send(embed);
  }
};
