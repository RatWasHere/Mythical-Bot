// This will check if the node version you are running is the required
// Node version, if it isn't it will throw the following error to inform
// you.
if (Number(process.version.slice(1).split('.')[0]) < 12) throw new Error('Node 12.0.0 or higher is required. Update Node on your system.');

const { Client, Collection } = require('discord.js');
const DiscordJS = require('discord.js');
const { promisify } = require('util');
const readdir = promisify(require('fs').readdir);
const Enmap = require('enmap');
const klaw = require('klaw');
const path = require('path');
const db = require('quick.db');


class bot extends Client {
  constructor(options) {
    super(options);

    this.config = require('./config.js');
    this.commands = new Collection();
    this.aliases = new Collection();

    this.settings = new Enmap({ name: 'settings', cloneLevel: 'deep', fetchAll: false, autoFetch: true });

    this.logger = require('./modules/Logger');

    // Basically just an async shortcut to using a setTimeout. Nothing fancy!
    this.wait = require('util').promisify(setTimeout);
  }

  // PERMISSION LEVEL FUNCTION
  permlevel(message) {
    let permlvl = 0;

    const permOrder = this.config.permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);

    while (permOrder.length) {
      const currentLevel = permOrder.shift();
      if (message.guild && currentLevel.guildOnly) continue;
      if (currentLevel.check(message)) {
        permlvl = currentLevel.level;
        break;
      }
    }
    return permlvl;
  }

  /* 
  COMMAND LOAD AND UNLOAD
  
  To simplify the loading and unloading of commands from multiple locations
  including the index.js load loop, and the reload function, these 2 ensure
  that unloading happens in a consistent manner across the board.
  */

  loadCommand(commandPath, commandName) {
    try {
      const props = new (require(`${commandPath}${path.sep}${commandName}`))(this);
      this.logger.log(`Loading Command: ${props.help.name}. 👌`, 'log');
      props.conf.location = commandPath;
      if (props.init) {
        props.init(this);
      }
      this.commands.set(props.help.name, props);
      props.conf.aliases.forEach(alias => {
        this.aliases.set(alias, props.help.name);
      });
      return false;
    } catch (e) {
      return `Unable to load command ${commandName}: ${e}`;
    }
  }

  async unloadCommand(commandPath, commandName) {
    let command;
    if (this.commands.has(commandName)) {
      command = this.commands.get(commandName);
    } else if (this.aliases.has(commandName)) {
      command = this.commands.get(this.aliases.get(commandName));
    }
    if (!command) return `The command \`${commandName}\` doesn"t seem to exist, nor is it an alias. Try again!`;

    if (command.shutdown) {
      await command.shutdown(this);
    }
    delete require.cache[require.resolve(`${commandPath}${path.sep}${commandName}.js`)];
    return false;
  }

  /*
  MESSAGE CLEAN FUNCTION
  "Clean" removes @everyone pings, as well as tokens, and makes code blocks
  escaped so they're shown more easily. As a bonus it resolves promises
  and stringifies objects!
  This is mostly only used by the Eval and Exec commands.
  */
  async clean(text) {
    if (text && text.constructor.name == 'Promise')
      text = await text;
    if (typeof text !== 'string')
      text = require('util').inspect(text, { depth: 1 });

    text = text
      .replace(/`/g, '`' + String.fromCharCode(8203))
      .replace(/@/g, '@' + String.fromCharCode(8203))
      .replace(this.token, 'mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0');

    return text;
  }

  /* SETTINGS FUNCTIONS
  These functions are used by any and all location in the bot that wants to either
  read the current *complete* guild settings (default + overrides, merged) or that
  wants to change settings for a specific guild.
  */

  // getSettings merges the client defaults with the guild settings. guild settings in
  // enmap should only have *unique* overrides that are different from defaults.
  getSettings(guild) {
    const defaults = this.settings.get('default') || {};
    const guildData = guild ? this.settings.get(guild.id) || {} : {};
    const returnObject = {};
    Object.keys(defaults).forEach((key) => {
      returnObject[key] = guildData[key] ? guildData[key] : defaults[key];
    });
    return returnObject;
  }

  // writeSettings overrides, or adds, any configuration item that is different
  // than the defaults. This ensures less storage wasted and to detect overrides.
  writeSettings(id, newSettings) {
    const defaults = this.settings.get('default');
    let settings = this.settings.get(id);
    if (typeof settings != 'object') settings = {};
    for (const key in newSettings) {
      if (defaults[key] !== newSettings[key]) {
        settings[key] = newSettings[key];
      } else {
        delete settings[key];
      }
    }
    this.settings.set(id, settings);
  }
}


const client = new bot({ ws: { intents: DiscordJS.Intents.ALL } });

const { Player } = require('discord-player');

client.player = new Player(client, {
  leaveOnEmpty: false,
});

client.player
  // Send a message when a track starts
  .on('trackStart', (message, track) => {
    const em = new DiscordJS.MessageEmbed()
    .setTitle('Now Playing')
    .setDescription(`[${track.title}](${track.url})\n\n Requested By: ${track.requestedBy}`)
    .setColor('0099CC');
    message.channel.send(em);
  })

  // Send a message when something is added to the queue
  .on('trackAdd', (message, track) => {
    message.channel.send(`${track.title || track.tracks[track.tracks.length - 1].title} has been added to the queue!`)
  })
  .on('playlistAdd', (message, playlist) => message.channel.send(`${playlist.title} has been added to the queue (${playlist.items.length} songs)!`))

  // Send messages to format search results
  .on('searchResults', (message, query, tracks) => {

    const embed = new DiscordJS.MessageEmbed()
      .setAuthor(`Here are your search results for ${query}!`)
      .setDescription(tracks.map((t, i) => `${i + 1}. ${t.title}`))
      .setFooter('Send the number of the song you want to play! Send cancel to cancel.')
      .setColor('0099CC');
    message.channel.send(embed);

  })
  .on('searchInvalidResponse', (message, query, tracks, content, collector) => message.channel.send(`You must send a valid number between 1 and ${tracks.length}!`))
  .on('searchCancel', (message, query, tracks) => message.channel.send('You did not provide a valid response... Please send the command again!'))
  .on('noResults', (message, query) => message.channel.send(`No results found on YouTube for ${query}!`))

  // Send a message when the music is stopped
  .on('queueEnd', (message, queue) => message.channel.send('Music stopped as there is no more music in the queue!'))
  .on('botDisconnect', (message, queue) => message.channel.send('Music stopped as I have been disconnected from the channel!'))

  // Error handling
  .on('error', (error, message) => {
    switch (error) {
      case 'NotPlaying':
        message.channel.send('There is no music being played on this server!')
        break;
      case 'NotConnected':
        message.channel.send('You are not connected in any voice channel!')
        break;
      case 'UnableToJoin':
        message.channel.send('I am not able to join your voice channel, please check my permissions!')
        break;
      default:
        message.channel.send(`Something went wrong... Error: ${error}`)
    }
  })

const init = async () => {

  // Here we load **commands** into memory, as a collection, so they're accessible
  // here and everywhere else.
  klaw('./commands').on('data', (item) => {
    const cmdFile = path.parse(item.path);
    if (!cmdFile.ext || cmdFile.ext !== '.js') return;
    const response = client.loadCommand(cmdFile.dir, `${cmdFile.name}${cmdFile.ext}`);
    if (response) client.logger.error(response);
  });

  // Then we load events, which will include our message and ready event.
  const evtFiles = await readdir('./events/');
  client.logger.log(`Loading a total of ${evtFiles.length} events.`, 'log');
  evtFiles.forEach(file => {
    const eventName = file.split('.')[0];
    client.logger.log(`Loading Event: ${eventName}`);
    const event = new (require(`./events/${file}`))(client);
    // This line is awesome by the way. Just sayin'.
    client.on(eventName, (...args) => event.run(...args));
    delete require.cache[require.resolve(`./events/${file}`)];
  });

  client.levelCache = {};
  for (let i = 0; i < client.config.permLevels.length; i++) {
    const thisLevel = client.config.permLevels[i];
    client.levelCache[thisLevel.name] = thisLevel.level;
  }

  client.login(client.config.token);
};

init();

String.prototype.toProperCase = function () {
  return this.replace(/([^\W_]+[^\s-]*) */g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
};

client.on('disconnect', () => client.logger.warn('Bot is disconnecting...'))
  .on('reconnecting', () => client.logger.log('Bot reconnecting...', 'log'))
  .on('error', e => client.logger.error(e))
  .on('warn', info => client.logger.warn(info));

process.on('uncaughtException', (err) => {
  const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, 'g'), './');
  console.error('Uncaught Exception: ', errorMsg);
  // Always best practice to let the code crash on uncaught exceptions. 
  // Because you should be catching them anyway.
  process.exit(1);
});

process.on('unhandledRejection', err => {
  console.error('Uncaught Promise Error: ', err);
});
