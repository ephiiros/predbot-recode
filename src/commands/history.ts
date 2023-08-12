import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from "discord.js";
import { getHistory } from "../libs/mongoWrapper";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('history')
		.setDescription('history'),
	async execute(interaction:any) {
        const history = await getHistory(interaction.member.id)

        let interactionString = '\n'

        let page = 0

        for (let i = page*5; i < page*5 + 5; i ++) {
            interactionString += history[i].matchId +"\n"
        }

        const left = new ButtonBuilder()
            .setCustomId('left')
            .setLabel('<')
            .setStyle(ButtonStyle.Primary)

        const right = new ButtonBuilder()
            .setCustomId('right')
            .setLabel('>')
            .setStyle(ButtonStyle.Primary)

        const row = new ActionRowBuilder()
            .addComponents(left, right)

		const response = await interaction.reply({
            content: interactionString,
            components: [row]
        });

        //@ts-ignore
        const collectorFilter = i => i.user.id === interaction.user.id;

        try {
            const confirmation = await response.awaitMessageComponent({ 
                filter: collectorFilter, time: 60000 
            });
            if (confirmation.customId === 'left') {
                if (page != 0) {
                    page -= 1 
                    let interactionString = '\n'
                    for (let i = page*5; i < page*5 + 5; i ++) {
                        interactionString += history[i].matchId +"\n"
                    }
                    await confirmation.update({ 
                        content: interactionString, 
                        components: [row] 
                    });
                }
            } else if (confirmation.customId === 'right') {
                    page -= 1 
                    let interactionString = '\n'
                    for (let i = page*5; i < page*5 + 5; i ++) {
                        interactionString += history[i].matchId +"\n"
                    }
                    await confirmation.update({ 
                        content: interactionString, 
                        components: [row] 
                    });
            }

        } catch (e) {
            await interaction.editReply({ 
                content: 'Timed out', 
                components: [] 
            });
        }
	},
}