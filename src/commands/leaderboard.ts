import { SlashCommandBuilder } from "discord.js";
import { getUsers } from "../libs/mongoWrapper";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('leaderboard')
        .addStringOption(option => 
            option.setName('leaderboardtoken')
                .setDescription('leaderboard name')),
	async execute(interaction:any) {
        const result = await getUsers()
        const leaderboard: any = {}
        const token = interaction.options.getString('leaderboardtoken')

        //@ts-ignore
        result.forEach((user) => {
            //@ts-ignore
            user.history.forEach((vote) => {
                if (vote.matchId.match(token)) {
                    if (leaderboard[user.id]) {
                        leaderboard[user.id] += vote.points
                    } else {
                        leaderboard[user.id] = vote.points
                    }
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

        console.log(items)

        let leaderboardString = token + '\n\`\`\`\n'

        let longestName = 0

        for await (let item of items) {
            //@ts-ignore
            const isMember = await interaction.guild.members.fetch(item[0]).then(() => true).catch(() => false);

            if(isMember) {
                let dcuser = await interaction.guild.members.fetch(item[0])
                item.push(dcuser.displayName)
                if(dcuser.displayName.length > longestName) {
                    longestName = dcuser.displayName.length
                }
            }
        }

        console.log(items)

        for (let item of items) {
            leaderboardString += item[2] + '.'.repeat(longestName-item[2].length) + item[1] + '\n'
        }

        leaderboardString += '\`\`\`'

        await interaction.editReply(leaderboardString);

	},
};