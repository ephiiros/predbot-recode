import { SlashCommandBuilder } from "discord.js";
import { getHistory } from "../libs/mongoWrapper";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('leaderboard'),
	async execute(interaction:any) {
        const user = await getHistory(interaction.member.id)

        let interactionString = '\n'

        user.history.forEach((game) => {
            interactionString += game.matchId
            if (game.points != 0) {
                interactionString += " ✅ \n"
                interactionString += `VOTED: ${game.vote} | POINTS RECIEVED: ${game.points}`
            } else {
                interactionString += " ❌ \n"
                interactionString += `VOTED: ${game.vote} | POINTS RECIEVED: ${game.points}`
            }
        })

		await interaction.reply({content: interactionString});
	},
}