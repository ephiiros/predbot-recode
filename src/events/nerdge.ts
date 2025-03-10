import { Message } from 'discord.js';
import { Events } from 'discord.js';

module.exports = {
  name: Events.MessageCreate,   // The name of the event
  execute: async (message: Message) => {
    // Check if the message is from unnamed s person
    if (message.author.id === '174232840144289792') {
      try {
        await message.react('😂');
      } catch (error) {
        console.error('Uhhhhhh:', error);
      }
    }
  }
};
