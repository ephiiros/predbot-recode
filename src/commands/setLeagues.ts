import { SlashCommandBuilder } from "discord.js";
import { updateServerChannel, updateServerLeague } from "../libs/mongoWrapper";

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
		updateServerLeague(interaction.guildId, leaguesArray)
	},
};