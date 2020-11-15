const Command = require('../../base/Command.js');
const db = require('quick.db');
const DiscordJS = require('discord.js');
const { stripIndents } = require('common-tags');
const mkdirp = require('mkdirp');
const fs = require('fs');
const path = require('path');

class New extends Command {
  constructor(client) {
    super(client, {
      name: 'new',
      description: 'Create a new ticket.',
      usage: 'New <reason>',
      category: 'Tickets',
      aliases: ['new-ticket', 'nt', 'newt'],
      guildOnly: true
    });
  }

  async run(msg, args) {
    const p = msg.settings.prefix;

    const { catID, logID, roleID } = db.get(`servers.${msg.guild.id}.tickets`);
    if (!catID) return msg.channel.send('The ticket system has not been setup in this server.');

    if (msg.channel.name.startsWith('ticket')) return msg.channel.send('You\'re already in a ticket, silly.');
    if (!args || args.length < 1) return msg.channel.send(`Please provide a reason. Usage: ${p}New <reason>`);

    const perms = [
      {
        id: msg.member.id,
        allow: ['VIEW_CHANNEL']
      },
      {
        id: msg.guild.me.id,
        allow: ['VIEW_CHANNEL']
      },
      {
        id: roleID,
        allow: ['VIEW_CHANNEL']
      },
      {
        id: msg.guild.id,
        deny: ['VIEW_CHANNEL']
      }
    ];

    const count = db.get(`servers.${msg.guild.id}.tickets.count`) || 1;
    db.set(`servers.${msg.guild.id}.tickets.count`, count + 1);
    const tName = `ticket-${msg.member.displayName.toLowerCase()}-${count}`;
    const tixChan = await msg.guild.channels.create(tName, { type: 'text', parent: catID, permissionOverwrites: perms });

    db.set(`servers.${msg.guild.id}.tickets.${tName}.owner`, msg.author.id);

    const reason = args.join(' ');
    if (reason.length > 1024) return msg.channel.send('Your reason must be less than 1024 characters.');

    const userEmbed = new DiscordJS.MessageEmbed()
      .setAuthor(msg.member.displayName, msg.author.displayAvatarURL())
      .setTitle(`${msg.member.displayName}'s Ticket`)
      .addField('Reason', reason, true)
      .addField('Channel', tixChan, true)
      .setFooter('Self destructing in 2 minutes.')
      .setColor('#E65DF4')
      .setTimestamp();
    const reply = await msg.channel.send(userEmbed);
    reply.delete({ timeout: 60000 });
    msg.delete();

    const logEmbed = new DiscordJS.MessageEmbed()
      .setAuthor(msg.member.displayName, msg.author.displayAvatarURL())
      .setTitle('New Ticket Created')
      .addField('Author', `${msg.author} (${msg.author.id})`, false)
      .addField('Channel', `${tixChan} \n(${tName}: ${tixChan.id})`, false)
      .addField('Reason', reason, false)
      .setColor('#E65DF4')
      .setTimestamp();
    const logChan = msg.guild.channels.cache.get(logID);
    await logChan.send(logEmbed);

    const chanEmbed = new DiscordJS.MessageEmbed()
      .setAuthor(msg.member.displayName, msg.author.displayAvatarURL())
      .setTitle(`${msg.member.displayName}'s Ticket`)
      .addField('Reason', reason, false)
      .setDescription('Please wait patiently and our support team will be with you shortly.')
      .setColor('#E65DF4')
      .setTimestamp();
    const role = msg.guild.roles.cache.get(roleID);
    tixChan.send(role, chanEmbed);

    // file control
    const dirName = `./logs/${msg.guild.id}/`
    const fileName = tName;

    const fpath = path.join(dirName, fileName + '.txt');

    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDay()).padStart(2, "0");
    const hour = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const timestamp = month + "/" + day + "/" + year + " " + hour + ":" + min;

    const output = stripIndents`
    Ticket created at: ${timestamp}

    Author: ${msg.author.id} (${msg.author.tag})

    Topic: ${reason}\n
    `;

    const result = () => {
      fs.writeFileSync(fpath, `${output}\r\n`, (err) => {
        if (err) return console.log(`${lmg} appending: [${err}]`)
      })
    }
    
    ensureDirExists(dirName, result)

    function ensureDirExists(dirPath, cb) {
      const dirname = path.normalize(dirPath)
      if (!fs.existsSync(dirname)) {
        mkdirp(dirname, { recursive: true }, cb)
        return true
      }
      cb(null, '')
      return false
    }
  }
}

module.exports = New;
