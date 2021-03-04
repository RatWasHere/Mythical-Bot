const Command = require('../../base/Command.js');
const { MessageEmbed } = require('discord.js');
const { stripIndents } = require('common-tags');
const moment = require('moment');
require('moment-duration-format');

class nowPlaying extends Command {
  constructor (client) {
    super(client, {
      name: 'now-playing',
      description: 'Shows what is currently playing',
      category: 'Music',
      usage: 'now-playing',
      aliases: ['np', 'nowplaying'],
      guildOnly: true
    });
  }

  async run (msg) {
    if (!this.client.player.isPlaying(msg)) return msg.channel.send('There is nothing playing.');
    const song = await this.client.player.nowPlaying(msg);

    const queue = this.client.player.getQueue(msg);
    const duration = moment.duration(`00:${song.duration}`).asSeconds() * 1000;
    const totalTime = queue.currentStreamTime;
    const timeLeft = moment.duration(duration - totalTime).format('d [days] h [hours] m [minutes] s [seconds]');

    const em = new MessageEmbed()
      .setDescription(stripIndents`
    Now ${queue.paused ? 'Paused' : 'Playing'} ♪: [${song.title}](${song.url})

    Duration: ${moment.duration(`00:${song.duration}`).format('d [days] h [hours] m [minutes] s [seconds]')}
    Time Remaining: ${timeLeft}
    ${this.client.player.createProgressBar(msg)}

    Requested By: ${song.requestedBy}
    `)
      .setColor('e2e2e2')
      .setThumbnail(song.thumbnail)
      .setAuthor(msg.member.displayName, msg.author.displayAvatarURL());
    return msg.channel.send(em);
  }
}

module.exports = nowPlaying;
