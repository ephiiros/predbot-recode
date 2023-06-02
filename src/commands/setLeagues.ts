import { SlashCommandBuilder } from "discord.js";
import { updateServerChannel } from "../libs/mongoWrapper";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setleagues')
		.setDescription('sets leagues for bot')
        .addStringOption(option =>
            option.setName('leagueslist')
                .setDescription('comma separate list of leagues')
                .setRequired(true)
            ),
	async execute(interaction:any) {
        const leaguesArray = interaction.options.getString('leagueslist').split(",")
		await interaction.reply(
			{
				content: 'new leagues: ' + leaguesArray,
				ephemeral: true
			}
		);
		updateServerChannel(interaction.guildId, interaction.options.getChannel('channel'))
	},
};