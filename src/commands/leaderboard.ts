import { SlashCommandBuilder } from "discord.js";
import { getUsersInServer } from "../libs/mongoWrapper";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('leaderboard'),
	async execute(interaction:any) {
        const result = await getUsersInServer(interaction.guildId)
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


        // Create items array
        var items = Object.keys(leaderboard).map(function(key) {
        return [key, leaderboard[key]];
        });

        // Sort the array based on the second element
        items.sort(function(first, second) {
            return second[1] - first[1];
        });


        let leaderboardString = '\`\`\`\n'

        for (let item in items) {
            let dcuser = await interaction.guild.members.fetch(item[0])
            //@ts-ignore

            console.log(interaction.guild.members.cache.find(user => user.id == item[0]))

            leaderboardString += dcuser.username + ' ' + item[1] + '\n'
        }
        leaderboardString += '\`\`\`'


		await interaction.reply(
			{
				content: leaderboardString, 
			}
		);
	},
};