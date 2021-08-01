module.exports = class {
  constructor (...args) {
    this.language = {
      hangman: {
        mentionplayquestion: '%mention, do you want to play hangman against %author?',
        embedtitlestart: 'Hangman game has been started!',
        embedtitlechances: '%chances/15 chances left',
        embeddescription: '**Word to guess:**\n%word',
        letterorwordmessage: '%author, please send a letter (A-Z) or guess the word!',
        embedtitlecorrect: '%author guessed the letter "**%letter**" correctly! 😄',
        embedtitlecorrectword: '%author guessed the word "**%word**" correctly! 😄',
        embeddescriptionwithtried: '**Wrong letters used:** %triedletters \n\n**Word to guess:**\n%word',
        mentiongamewon: '%author won this game! The word to guess was: "**%word**"',
        embedtitlewrong: '%author guessed the letter "**%letter**" wrong! 😢',
        embedtitlewrongword: '%author guessed the word "**%word**" wrong! 😢',
        mentionnowin: 'Nobody won! The word to guess was: "**%word**"',
        mentioncorrectword: '%author won this game! The word to guess was: "**%word**"',
        notwordcharacters: 'The word must have %letterscount letters!',
        noletter: 'You entered an invalid character!',
        noanswermention: "%author didn't give an answer! %mention won this game! The word to guess was: \"**%word**\"",
        dontwanttoplay: "We are sorry but the mentioned Discord user doesn't want to play hangman against you!",
        letterorwordmessagenomention: 'Please send a letter (A-Z) or guess the word!',
        embedtitlecorrectnomention: 'You guessed the letter "**%letter**" correctly! 😄',
        embedtitlecorrectnomentionword: 'You guessed the word "**%word**" correctly! 😄',
        gamelost: 'You lost this game! The word to guess was: "**%word**"',
        gamewon: 'You won this game! The word to guess was: "**%word**"',
        embedtitlewrongnomention: 'You guessed the letter "**%letter**" wrong! 😢',
        embedtitlewrongnomentionword: 'You guessed the word "**%word**" wrong! 😢',
        noanswer: "You didn't give an answer! The word to guess was \"**%word**\"",
        guessedletteralready: 'You guessed this letter already!',
        description: 'Play hangman alone or with your Discord friends'
      },
      play: {
        no_channel: 'You must be in a voice channel to play music.',
        wrong_channel: 'You have to be in the same voice channel as the bot to play music',
        no_query: 'Please enter something to search for.'
      }
    };
  }
};
