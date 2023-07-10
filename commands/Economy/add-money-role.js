const Command = require('../../base/Command.js');
const db = require('quick.db');
const { EmbedBuilder } = require('discord.js');
const { stripIndents } = require('common-tags');

class AddMoneyRole extends Command {
  constructor(client) {
    super(client, {
      name: 'add-money-role',
      category: 'Economy',
      description:
        "Add money to a role's members cash or bank balance. \nIf the cash or bank argument isn't given, it will be added to the cash part.",
      usage: 'add-money-role <cash | bank> <role> <amount>',
      aliases: ['addmoneyrole', 'addbalrole'],
      permLevel: 'Moderator',
      guildOnly: true,
    });
  }

  async run(msg, args) {
    const usage = `Incorrect Usage: ${msg.settings.prefix}add-money-role <cash | bank> <role> <amount>`;

    const authorName = msg.author.discriminator === '0' ? msg.author.username : msg.author.tag;
    const errEmbed = new EmbedBuilder()
      .setColor(msg.settings.embedErrorColor)
      .setAuthor({ name: authorName, iconURL: msg.author.displayAvatarURL() });

    if (!msg.member.permissions.has('ManageGuild')) {
      errEmbed.setDescription('You are missing the **Manage Guild** permission.');
      return msg.channel.send({ embeds: [errEmbed] });
    }

    let type = 'cash';
    let role;
    let amount;

    if (!args || args.length < 2) {
      errEmbed.setDescription(usage);
      return msg.channel.send({ embeds: [errEmbed] });
    }

    const currencySymbol = db.get(`servers.${msg.guild.id}.economy.symbol`) || '$';

    if (args.length === 2) {
      role = this.client.util.getRole(msg, args[0]);
      amount = parseInt(args[1].replace(currencySymbol, '').replace(/,/g, ''), 10);
    } else {
      role = this.client.util.getRole(msg, args[1]);
      amount = parseInt(args[2].replace(currencySymbol, '').replace(/,/g, ''), 10);
    }

    if (['cash', 'bank'].includes(args[0].toLowerCase())) {
      type = args[0].toLowerCase();
    }

    if (isNaN(amount)) {
      errEmbed.setDescription(usage);
      return msg.channel.send({ embeds: [errEmbed] });
    }

    if (!role) {
      errEmbed.setDescription(stripIndents`
      :x: Invalid role given.

      Usage: ${msg.settings.prefix}add-money-role <cash | bank> <role> <amount>
      `);
      return msg.channel.send({ embeds: [errEmbed] });
    }

    const members = [...role.members.values()];

    amount = BigInt(amount);
    if (type === 'bank') {
      members.forEach((mem) => {
        if (!mem.user.bot) {
          const current = BigInt(db.get(`servers.${msg.guild.id}.users.${mem.id}.economy.bank`) || 0);
          const newAmount = current + amount;
          db.set(`servers.${msg.guild.id}.users.${mem.id}.economy.bank`, newAmount.toString());
        }
      });
    } else {
      members.forEach((mem) => {
        if (!mem.user.bot) {
          const cash = BigInt(
            db.get(`servers.${msg.guild.id}.users.${mem.id}.economy.cash`) ||
              db.get(`servers.${msg.guild.id}.economy.startBalance`) ||
              0,
          );
          const newAmount = cash + amount;
          db.set(`servers.${msg.guild.id}.users.${mem.id}.economy.cash`, newAmount.toString());
        }
      });
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: authorName, iconURL: msg.author.displayAvatarURL() })
      .setColor(msg.settings.embedColor)
      .setDescription(
        `:white_check_mark: Added **${currencySymbol}${amount.toLocaleString()}** to ${type} balance of ${
          members.length
        } ${members.length > 1 ? 'members' : 'member'} with the ${role}.`,
      )
      .setTimestamp();

    return msg.channel.send({ embeds: [embed] });
  }
}

module.exports = AddMoneyRole;
