import { Message } from 'discord.js';

module.exports = {
  name: 'messageCreate',   // The name of the event
  execute: async (message: Message) => {
    // Check if the message is from unnamed s person
    if (message.author.tag === 'clumsytrout#0') {
      try {
        await message.react('😂');
      } catch (error) {
        console.error('Uhhhhhh:', error);
      }
    }
  }
};
