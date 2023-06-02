
import { SlashCommandBuilder } from "discord.js";
import { updateServerChannel } from "../libs/mongoWrapper";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setchannel')
		.setDescription('sets channel for bot')
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('predbot channel')
				.setRequired(true)),
	async execute(interaction:any) {
		await interaction.reply(
			{
				content: 'Will now type in: <#' + interaction.options.getChannel('channel')+'>',
				ephemeral: true
			}
		);
		updateServerChannel(interaction.guildId, interaction.options.getChannel('channel'))
	},
};