const Command = require('../../base/Command.js');
const DiscordJS = require('discord.js');
const db = require('quick.db');
const moment = require('moment');
require('moment-duration-format');

class Flood extends Command {
  constructor (client) {
    super(client, {
      name: 'flood',
      description: 'Play a game of flood.',
      usage: 'flood',
      category: 'Games'
    });
  }

  async run (msg) {
    const WIDTH = 13;
    const HEIGHT = 13;
    const SQUARES = { red_square: '🟥', blue_square: '🟦', orange_square: '🟧', purple_square: '🟪', green_square: '🟩' };
    const gameBoard = [];
    let turn = 0;
    let message;
    let gameOver = false;
    let result;
    const gameStart = msg.createdAt;
    let gameEnd;

    const current = this.client.games.get(msg.channel.id);
    if (current) return msg.reply(`Please wait until the current game of \`${current.name}\` is finished.`);
    this.client.games.set(msg.channel.id, { name: this.help.name, user: msg.author.id });

    const up = (pos) => ({ x: pos.x, y: pos.y - 1 });
    const down = (pos) => ({ x: pos.x, y: pos.y + 1 });
    const left = (pos) => ({ x: pos.x - 1, y: pos.y });
    const right = (pos) => ({ x: pos.x + 1, y: pos.y });

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        gameBoard[y * WIDTH + x] = Object.values(SQUARES)[Math.floor(Math.random() * Object.keys(SQUARES).length)];
      }
    }

    function gameBoardToString () {
      let str = '';
      for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          str += gameBoard[y * WIDTH + x];
        }
        str += '\n';
      }
      return str;
    }

    function getContent () {
      let embed;
      if (gameOver === true) {
        const gameTime = moment.duration(gameEnd - gameStart).format('m[ minutes][, and] s[ seconds]');
        const gameTimeSeconds = (gameEnd - gameStart) / 1000;
        const turnResp = {
          winner: `Game beat in ${turn} turns! \nGame Time: ${gameTime}`,
          timeOut: 'Game timed out due to inactivity.',
          error: 'Game ended with an error.',
          maxTurns: 'Game ended because you reached the max turns.',
          playing: 'Game shouldn\'t have ended. :(',
          earlyEnd: 'Game player decided to quit.'
        };

        let highScore;
        let highScoreUser;
        let highScoreTime;
        if (result === 'winner') {
          const HS = { score: turn, user: msg.author.tag, time: gameTimeSeconds };
          const oldHS = db.get('global.highScores.flood');
          highScore = oldHS?.score || 26;
          highScoreUser = oldHS?.user | 'N/A';
          highScoreTime = oldHS?.time | 480;
          if (HS.score < highScore) {
            db.set('global.highScores.flood', HS);
            highScore = HS.score;
            highScoreUser = 'You';
            highScoreTime = gameTimeSeconds;
          } else if (HS.score === highScore && HS.time <= highScoreTime) {
            db.set('global.highScores.flood', HS);
            highScore = HS.score;
            highScoreUser = 'You';
            highScoreTime = gameTimeSeconds;
          }
        } else {
          const oldHS = db.get('global.highScores.flood');
          highScore = oldHS?.score || 'N/A';
          highScoreUser = oldHS?.user || 'N/A';
          highScoreTime = oldHS?.time || 'N/A';
        }

        if (!isNaN(highScoreTime)) highScoreTime = moment.duration(highScoreTime).format('m[ minutes][, and] s[ seconds]');
        embed = new DiscordJS.MessageEmbed()
          .setAuthor(msg.member.displayName, msg.author.displayAvatarURL({ dynamic: true }))
          .setColor('#08b9bf')
          .setTitle('Flood')
          .setDescription(`${gameBoardToString()} \nGame Over! \n${turnResp[result]}`)
          .addField('High Score', `${highScore} turns by ${highScoreUser || 'N/A'} in ${highScoreTime || 'N/A'}`)
          .setTimestamp();
      } else {
        embed = new DiscordJS.MessageEmbed()
          .setAuthor(msg.member.displayName, msg.author.displayAvatarURL({ dynamic: true }))
          .setColor('#08b9bf')
          .setTitle('Flood')
          .setDescription(`${gameBoardToString()} 
Fill the entire image with the same color in 25 or fewer flood tiles (turns).

Click on the reactions below to fill the area above.
Filling starts at the top left corner.`)
          .addField('Turn:', turn.toString(), true)
          .setFooter(`Currently Playing: ${msg.author.username}`)
          .setTimestamp();
      }

      return [embed];
    }

    try {
      while (gameOver === false && turn < 25) {
        turn += 1;
        const current = gameBoard[0];
        const queue = [{ x: 0, y: 0 }];
        const visited = [];
        let selected = null;

        const filter = (reaction, user) => {
          return ['🟥', '🟦', '🟧', '🟪', '🟩', '🛑'].includes(reaction.emoji.name) && user.id === msg.author.id;
        };

        if (!message) {
          message = await msg.channel.send({ embeds: getContent() });
          ['🟥', '🟦', '🟧', '🟪', '🟩', '🛑'].forEach(s => message.react(s));
        } else {
          message.edit({ embeds: getContent() });
        }

        const collected = await message.awaitReactions({ filter, max: 1, time: 60000, errors: ['time'] });
        if (!collected) {
          gameOver = true;
          result = 'timeOut';
          this.client.games.delete(msg.channel.id);
          message.reactions.removeAll();
          return message.edit({ embeds: getContent() });
        }

        collected.first().users.remove(msg.author.id);
        selected = collected.first().emoji.name;
        if (selected === '🛑') {
          gameOver = true;
          result = 'earlyEnd';
          this.client.games.delete(msg.channel.id);
          message.reactions.removeAll();
          return message.edit({ embeds: getContent() });
        }

        while (queue.length > 0) {
          const pos = queue.shift();
          if (!pos || visited.includes(pos)) { continue; }
          visited.push(pos);
          if (gameBoard[pos.y * WIDTH + pos.x] === current) {
            gameBoard[pos.y * WIDTH + pos.x] = selected;
            const upPos = up(pos);
            if (!visited.includes(upPos) && upPos.y >= 0) {
              queue.push(upPos);
            }
            const downPos = down(pos);
            if (!visited.includes(downPos) && downPos.y < HEIGHT) {
              queue.push(downPos);
            }
            const leftPos = left(pos);
            if (!visited.includes(leftPos) && leftPos.x >= 0) {
              queue.push(leftPos);
            }
            const rightPos = right(pos);
            if (!visited.includes(rightPos) && rightPos.x < WIDTH) {
              queue.push(rightPos);
            }
          }
        }

        gameOver = true;
        result = 'winner';
        gameEnd = Date.now();
        for (let y = 0; y < HEIGHT; y++) {
          for (let x = 0; x < WIDTH; x++) {
            if (gameBoard[y * WIDTH + x] !== selected) {
              gameOver = false;
              result = 'playing';
            }
          }
        }
      }

      if (gameOver === true) {
        this.client.games.delete(msg.channel.id);
        message.reactions.removeAll();
        return message.edit({ embeds: getContent() });
      }

      if (turn >= 25) {
        this.client.games.delete(msg.channel.id);
        message.reactions.removeAll();
        gameOver = true;
        result = 'maxTurns';
        return message.edit({ embeds: getContent() });
      }

      this.client.games.delete(msg.channel.id);
      return msg.channel.send('Something went wrong, please try again later.');
    } catch (err) {
      this.client.games.delete(msg.channel.id);
      console.error(err);
      message.reactions.removeAll();
      gameOver = true;
      result = 'error';
      return message.edit({ embeds: getContent() });
    }
  }
}

module.exports = Flood;
