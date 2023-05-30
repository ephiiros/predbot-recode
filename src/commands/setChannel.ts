
import { SlashCommandBuilder } from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('Set Channel')
		.setDescription('sets channel for bot'),
	async execute(interaction:any) {
		await interaction.reply(
			{
				content: 'settings display + commands to set what go here', 
				ephemeral: true
			}
		);
	},
};