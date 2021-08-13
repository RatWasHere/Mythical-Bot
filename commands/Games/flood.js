const Command = require('../../base/Command.js');
const DiscordJS = require('discord.js');
const db = require('quick.db');

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
        const turnResp = {
          winner: `Game beat in ${turn} turns!`,
          timeOut: 'Game timed out due to inactivity.',
          error: 'Game ended with an error.',
          maxTurns: 'Game ended because you reached the max turns.',
          playing: 'Game shouldn\'t have ended. :('
        };

        let highScore;
        let highScoreUser;
        if (result === 'winner') {
          const HS = { score: turn, user: msg.author.tag };
          const oldHS = db.get('global.highScores.flood') || HS;
          highScore = oldHS.score;
          highScoreUser = oldHS.user;
          if (HS.score < oldHS.score) {
            db.set('global.highScores.flood', HS);
            highScore = HS.score;
            highScoreUser = 'You';
          }
        } else {
          const oldHS = db.get('global.highScores.flood');
          highScore = oldHS.score;
          highScoreUser = oldHS.user;
        }

        embed = new DiscordJS.MessageEmbed()
          .setAuthor(msg.member.displayName, msg.author.displayAvatarURL({ dynamic: true }))
          .setColor('#08b9bf')
          .setTitle('Flood')
          .setDescription(`${gameBoardToString()} \nGame Over! \n${turnResp[result]}`)
          .addField('High Score', `${highScore} turns by ${highScoreUser}`)
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
          return ['🟥', '🟦', '🟧', '🟪', '🟩'].includes(reaction.emoji.name) && user.id === msg.author.id;
        };

        if (!message) {
          message = await msg.channel.send({embeds: getContent()});
          ['🟥', '🟦', '🟧', '🟪', '🟩'].forEach(s => message.react(s));
        } else {
          message.edit({embeds: getContent()});
        }

        const collected = await message.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] });
        if (!collected) gameOver = true; result = 'timeOut';
        selected = collected.first().emoji.name;
        const userReactions = message.reactions.cache.filter(reaction => reaction.users.cache.has(msg.author.id));

        try {
          for (const reaction of userReactions.values()) {
            await reaction.users.remove(msg.author.id);
          }
        } catch (error) {
          this.client.games.delete(msg.channel.id);
          msg.channel.send('An error occurred removing reactions.');
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
        return message.edit({embeds: getContent()});
      }

      if (turn >= 25) {
        gameOver = true;
        result = 'maxTurns';
        return message.edit({embeds: getContent()});
      }
    } catch (err) {
      this.client.games.delete(msg.channel.id);
      message.reactions.removeAll();
      gameOver = true;
      result = 'error';
      return message.edit({embeds: getContent()});
    }
  }
}

module.exports = Flood;
