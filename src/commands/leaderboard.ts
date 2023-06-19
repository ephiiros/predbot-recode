import { SlashCommandBuilder } from "discord.js";
import { getUsers } from "../libs/mongoWrapper";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('leaderboard'),
	async execute(interaction:any) {
        const result = await getUsers()
        console.log(result)
        const leaderboard: any = {}

        //@ts-ignore
        result.forEach((user) => {
            //@ts-ignore
            user.history.forEach((vote) => {
                if (leaderboard[user.id]) {
                    leaderboard[user.id] += vote.points
                } else {
                    leaderboard[user.id] = vote.points
                }
            })
        })

		await interaction.reply({content: 'loading'});

        // Create items array
        var items = Object.keys(leaderboard).map(function(key) {
            return [key, leaderboard[key]];
        });


        // Sort the array based on the second element
        items.sort(function(first, second) {
            return second[1] - first[1];
        });


        let leaderboardString = '\`\`\`\n'

        for await (let item of items) {
            //@ts-ignore
            const isMember = await interaction.guild.members.fetch(item[0]).then(() => true).catch(() => false);

            if(isMember) {
                let dcuser = await interaction.guild.members.fetch(item[0])
                leaderboardString += dcuser.displayName + ' ' + item[1] + '\n'
            }
        }
        leaderboardString += '\`\`\`'

        await interaction.editReply(leaderboardString);

	},
};