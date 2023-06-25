import { SlashCommandBuilder } from "discord.js";
import { getHistory } from "../libs/mongoWrapper";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('history')
		.setDescription('history'),
	async execute(interaction:any) {
        const user = await getHistory(interaction.member.id)

        let interactionString = '\n'

        //@ts-ignore
        user.history.forEach((game) => {
            if (game.points != 0) {
                interactionString += "✅ "
                interactionString += game.matchId.replace('Season ', '').replace('Season_', '')
                interactionString += " "
                interactionString += `VOTED: ${game.vote} | POINTS RECIEVED: ${game.points} \n`
            } else {
                interactionString += "❌ "
                interactionString += game.matchId.replace('Season ', '').repalce('Season_', '')
                interactionString += " "
                interactionString += `VOTED: ${game.vote} | POINTS: ${game.points} \n`
            }
        })

		await interaction.reply({content: interactionString});
	},
}