import { Client, Events, TextChannel } from "discord.js"
import { getServers } from "../libs/mongoWrapper"
import { DateTime } from "luxon"
import cron from "node-cron";
import { getDayGames, getNextGame, loadGames } from "../libs/lolFandom";
import { sendVoteMessages } from "../libs/timers";

module.exports = { 
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        getServers().then((servers) => {
            console.log(servers)
            servers.forEach((server) => {
                let helloChannel = (client.channels.cache.get(server.channel) as TextChannel) 
                helloChannel.send("hello ! currently in " + servers.length + " servers!")
                console.log("[" + server.id +"] Sent restart message")
            })
            return servers
        }).then(() => {
            
            console.log("[Server] Creating daily schedule")
            // every 24 hours
            cron.schedule('0 0 * * * ', () => {
                getServers().then((servers) => {
                    const channelList: TextChannel[] = []

                    servers.forEach((server) => {
                        channelList.push(client.channels.cache.get(server.channel) as TextChannel) 
                    });

                    channelList.forEach((channel: TextChannel) => {
                        const today = DateTime.now()
                        //const today = DateTime.fromSQL("2023-03-18 00:00:00")

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
    }
}
