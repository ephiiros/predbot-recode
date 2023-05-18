import dotenv from "dotenv";
import { Client, Collection, Events, GatewayIntentBits, TextChannel } from "discord.js";
//@ts-ignore
import cron from "node-cron";
//@ts-ignore
import { getDailyGames, getDayGames, loadGames, getNextGame } from "./libs/lolFandom";
import path from "path";
import fs from "fs"

import { getServers   } from "./libs/mongoWrapper";
import { DateTime } from "luxon";
import { sendVoteMessages } from "./libs/timers";

dotenv.config();

const client = new Client({ intents: [ GatewayIntentBits.Guilds ] });

client.once(Events.ClientReady, c => {
    c.user
    getServers().then((servers) => {
        servers.forEach((server) => {
            let helloChannel = (client.channels.cache.get(server.channel) as TextChannel) 
            helloChannel.send("hello ! currently in " + servers.length + " servers!")
            console.log("[" + server.id +"] Sent restart message")
        })
        return servers
    }).then(() => {
        
        console.log("[Server] Creating daily schedule")
        cron.schedule('*/60 * * * * *', () => {
            getServers().then((servers) => {
                const channelList: TextChannel[] = []

                servers.forEach((server) => {
                    channelList.push(client.channels.cache.get(server.channel) as TextChannel) 
                });

                channelList.forEach((channel: TextChannel) => {
                    //const today = DateTime.now()
                    const today = DateTime.fromSQL("2023-03-18 00:00:00")

                    const todayGames = getDayGames(["LEC"], today)
                    .then((response: loadGames[]) => {
                        let todayString = ""
                        response.forEach(game => {
                            todayString += 
                            game.DateTime_UTC.toFormat("HH:mm") + " " +
                            game.Team1 + " vs " + game.Team2 + "\n"
                        })
                        return [todayString, response]
                    })

                    const tomorrowGames = getDayGames(["LEC"], today.plus({days:1}))
                    .then((response: loadGames[]) => {
                        let tomorrowString = ""
                        response.forEach(game => {
                            tomorrowString +=
                            game.DateTime_UTC.toFormat("HH:mm") + " " +
                            game.Team1 + " vs " + game.Team2 + "\n"
                        })
                        return tomorrowString
                    })

                    const nextGame = getNextGame(["LEC"], today)
                    .then((response: loadGames) => {
                        let nextGameString = ""
                        nextGameString += 
                        response.DateTime_UTC.toFormat("HH:mm") + " " + 
                        response.Team1 + " vs " + response.Team2 + "\n"

                        return nextGameString
                    })

                    Promise.all([todayGames, tomorrowGames, nextGame]).then((values) => {
                        let dailyMessage = 
                            "**CURRENT DATE AND TIME** " +
                            `${DateTime.now().toFormat("d LLLL y HH:mm ZZZZ")}\n` + 
                            "**GAMES TODAY**\n"

                        dailyMessage += values[0][0]
                        dailyMessage += "**GAMES TOMORROW**\n"
                        dailyMessage += values[1]
                        dailyMessage += "**NEXT GAME**\n"
                        dailyMessage += values[2]

                        // send for the day but lock individually

                        if (values[0][1].length > 0) {
                            setTimeout(sendVoteMessages, 2000, values[0][1], channel, today)
                        }

                        channel.send(dailyMessage)
                    })
                })
            })
        })
    })
})

//@ts-ignore 
client.commands = new Collection()
// this is because we're just adding .commands onto 
// client object for access in places

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        //@ts-ignore
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
        //@ts-ignore
        const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
    console.log(interaction);
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN)