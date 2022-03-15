const Command = require('../../base/Command.js');
const DiscordJS = require('discord.js');
const moment = require('moment');
require('moment-duration-format');
const db = require('quick.db');

class Reminders extends Command {
  constructor (client) {
    super(client, {
      name: 'reminders',
      description: 'View your reminders',
      usage: 'reminders [ID]',
      category: 'General'
    });
  }

  async run (msg, args) {
    const emoji = {
      0: '0⃣', 1: '1⃣', 2: '2⃣', 3: '3⃣', 4: '4⃣', 5: '5⃣', 6: '6⃣', 7: '7⃣', 8: '8⃣', 9: '9⃣', 10: '🔟'
    };
    const numbers = [emoji[0], emoji[1], emoji[2], emoji[3], emoji[4], emoji[5], emoji[6], emoji[7], emoji[8], emoji[9], emoji[10]];

    const em = new DiscordJS.MessageEmbed();
    const reminders = db.get('global.reminders') || [];

    if (!args[0]) {
      let i = 1;
      for (const { triggerOn, reminder, userID, remID } of Object.values(reminders)) {
        if (userID === msg.author.id) {
          em.addField(`**${numbers[i] || i + '.'}** I'll remind you ${moment(triggerOn).fromNow()} (ID: ${remID})`, reminder.slice(0, 200));
          i += 1;
        }
      }

      em.setTitle(`To delete a reminder, use **\`${msg.settings.prefix}reminders <ID>\`**`);

      if ((em.fields.length !== 0)) {
        em.setAuthor({ name: msg.author.username, iconURL: msg.author.displayAvatarURL() });
      } else {
        em.setDescription(`${msg.author.username}, you don't have any reminders, use the **remindme** command to create a new one!`);
      }
      em.setColor('#0099CC');

      return msg.channel.send({ embeds: [em] });
    }

    const ID = args[0];
    const reminder = db.get(`global.reminders.${ID}`);

    if (!ID) {
      em.setColor('ORANGE');
      em.setDescription(`${msg.author.username}, that isn't a valid reminder.`);
    } else if (!reminder || reminder.userID !== msg.author.id) {
      em.setColor('ORANGE');
      em.setDescription(`${msg.author.username}, that isn't a valid reminder.`);
    } else {
      db.delete(`global.reminders.${ID}`);

      em.setColor('GREEN');
      em.setDescription(`${msg.member.displayName}, you've successfully deleted your reminder.`);
    }
    return msg.channel.send({ embeds: [em] });
  }
}

module.exports = Reminders;
