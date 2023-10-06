/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { SlashCommandBuilder } = require('discord.js');
const amountText = 'The amount of messages to delete';

exports.conf = {
  permLevel: 'Moderator',
  guildOnly: false,
};

exports.commandData = new SlashCommandBuilder()
  .setName('purge')
  .setDescription('Purge messages')
  .addSubcommand((subcommand) =>
    subcommand
      .setName('any')
      .setDescription('Delete any message type')
      .addIntegerOption((option) =>
        option.setName('amount').setDescription(amountText).setMinValue(1).setMaxValue(1000).setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('user')
      .setDescription('Delete messages from a user')
      .addIntegerOption((option) =>
        option.setName('amount').setDescription(amountText).setMinValue(1).setMaxValue(1000).setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('links')
      .setDescription('Delete messages containing links')
      .addIntegerOption((option) =>
        option.setName('amount').setDescription(amountText).setMinValue(1).setMaxValue(1000).setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('invites')
      .setDescription('Delete messages containing invites')
      .addIntegerOption((option) =>
        option.setName('amount').setDescription(amountText).setMinValue(1).setMaxValue(1000).setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('match')
      .setDescription('Delete messages matching text')
      .addIntegerOption((option) =>
        option.setName('amount').setDescription(amountText).setMinValue(1).setMaxValue(1000).setRequired(true),
      )
      .addStringOption((option) => option.setName('text').setDescription('The text to delete').setRequired(true)),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('not')
      .setDescription('Delete messages not matching text')
      .addIntegerOption((option) =>
        option.setName('amount').setDescription(amountText).setMinValue(1).setMaxValue(1000).setRequired(true),
      ),
  );

exports.run = async (interaction) => {
  const linkRegex = /https?:\/\/[\w\d-_]/gi;
  const inviteRegex = /discord.(gg|me)\s?\//gi;
  let count;

  if (!interaction.guild.members.me.permissions.has('ManageMessages'))
    return this.client.util.errorEmbed(
      interaction,
      'The bot needs `Manage Messages` permission.',
      'Missing Permission',
    );

  // Global function to get messages
  // channel: Channel object
  // limit: Number of messages to fetch
  // filter: Function to filter messages
  async function getMessages(channel, limit, filter, before, after) {
    return await channel.messages
      .fetch({
        limit,
        before,
        after,
      })
      .then((messages) => {
        if (filter) messages = messages.filter(filter);
        return messages;
      });
  }

  // Global function to delete messages
  // msg: Message object
  // messages: Collection of messages to delete
  async function deleteMessages(channel, messages) {
    if (!messages || messages.size < 1) return msg.channel.send('No messages found.');

    return await channel
      .bulkDelete(messages, true)
      .then(async (messages) => {
        return messages.size;
      })
      .catch((err) => {
        return this.client.util.errorEmbed(msg, err);
      });
  }

  function checkCount(count) {
    if (!count) return 1;
    if (isNaN(count)) return 1;
    if (count > 100) return 100;
    if (count < 1) return 1;
    return count;
  }

  await interaction.deferReply();
  const subcommand = interaction.options.getSubcommand();

  if (subcommand !== 'info') {
    if (!interaction.guild.members.me.permissions.has('ManageGuildExpressions')) {
      return interaction.editReply('The bot is missing Manage Expressions permission');
    }
  }

  switch (subcommand) {
    case 'any': {
      return interaction.editReply('This will delete up to 1k messages!');
    }

    case 'user': {
      return interaction.editReply('This will delete messages from a user');
    }

    case 'links': {
      return interaction.editReply('This will delete messages containing links');
    }

    case 'invites': {
      return interaction.editReply('This will delete messages containing invites');
    }

    case 'match': {
      return interaction.editReply('This will delete messages matching text');
    }

    case 'not': {
      return interaction.editReply('This will delete messages not matching text');
    }
  }
};
