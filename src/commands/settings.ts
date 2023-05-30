import { SlashCommandBuilder } from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('admin settings'),
	async execute(interaction:any) {
		await interaction.reply(
			{
				content: 'settings display + commands to set what go here', 
				ephemeral: true
			}
		);
	},
};