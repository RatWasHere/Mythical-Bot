const Command = require('../../base/Command.js');
const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

class RemoveMoneyRole extends Command {
  constructor(client) {
    super(client, {
      name: 'remove-money-role',
      category: 'Economy',
      description:
        "Remove money from a roles members cash or bank balance. \nIf the cash or bank argument isn't given, it will be removed from the cash part.",
      usage: 'remove-money-role [cash | bank] <role> <amount>',
      aliases: ['removemoneyrole', 'removebalrole'],
      permLevel: 'Moderator',
      requiredArgs: 2,
      examples: [
        'remove-money-role cash Admin 100',
        'remove-money-role bank @memberRole1 420',
        'remove-money Owner 100',
      ],
      guildOnly: true,
    });
  }

  async run(msg, args) {
    const authorName = msg.author.discriminator === '0' ? msg.author.username : msg.author.tag;
    const embed = new EmbedBuilder()
      .setColor(msg.settings.embedErrorColor)
      .setAuthor({ name: authorName, iconURL: msg.author.displayAvatarURL() });

    let type = 'cash';
    let role;
    let amount;

    const currencySymbol = (await db.get(`servers.${msg.guild.id}.economy.symbol`)) || '$';

    if (args.length === 2) {
      role = this.client.util.getRole(msg, args[0]);
      amount = args[1].replace(/[^0-9\\.]/g, '');
    } else {
      role = this.client.util.getRole(msg, args[1]);
      amount = args[2].replace(/[^0-9\\.]/g, '');
    }

    if (['cash', 'bank'].includes(args[0].toLowerCase())) {
      type = args[0].toLowerCase();
    }

    if (isNaN(amount)) return this.client.util.errorEmbed(msg, msg.settings.prefix + this.help.usage, 'Invalid Amount');
    if (!role) return this.client.util.errorEmbed(msg, msg.settings.prefix + this.help.usage, 'Invalid Role');

    const members = [...role.members.values()];

    amount = BigInt(amount);
    if (type === 'bank') {
      members.forEach(async (mem) => {
        if (!mem.user.bot) {
          const bank = BigInt(db.get(`servers.${msg.guild.id}.users.${mem.id}.economy.bank`));
          const newAmount = bank - amount;
          await db.set(`servers.${msg.guild.id}.users.${mem.id}.economy.bank`, newAmount.toString());
        }
      });
    } else {
      members.forEach(async (mem) => {
        if (!mem.user.bot) {
          const cash = BigInt(
            (await db.get(`servers.${msg.guild.id}.users.${mem.id}.economy.cash`)) ||
              (await db.get(`servers.${msg.guild.id}.economy.startBalance`)) ||
              0,
          );
          const newAmount = cash - amount;
          await db.set(`servers.${msg.guild.id}.users.${mem.id}.economy.cash`, newAmount.toString());
        }
      });
    }

    let csAmount = currencySymbol + amount.toLocaleString();
    csAmount = csAmount.length > 1024 ? `${csAmount.slice(0, 1021) + '...'}` : csAmount;

    embed
      .setColor(msg.settings.embedColor)
      .setDescription(
        `:white_check_mark: Removed **${csAmount}** from the ${type} balance of ${members.length} ${
          members.length > 1 ? 'members' : 'member'
        } with the ${role}.`,
      )
      .setTimestamp();
    return msg.channel.send({ embeds: [embed] });
  }
}

module.exports = RemoveMoneyRole;
