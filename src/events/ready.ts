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
                helloChannel.send("hello ! currently in " + servers.length + " servers!\n" +
                "message ephiros#1111 for help")
                console.log("[" + server.id +"] Sent restart message")
            })
            return servers
        }).then(() => {
            
            console.log("[Server] Creating daily schedule")
            // every 24 hours
            cron.schedule('* * * * * ', () => {
                getServers().then((servers) => {
                    servers.forEach((server) => {
                        console.log("["+ server.id +"] Scheduled message")
                        const channel = client.channels.cache.get(server.channel) as TextChannel
                        const today = DateTime.now().set({hour: 10}) //test
                        //const today = DateTime.fromSQL("2023-03-18 00:00:00")

                        const todayGames = getDayGames(server.leagues, today)
                        .then((response: loadGames[]) => {
                            let todayString = ""
                            let newResponse:loadGames[] = []
                            response.forEach(game => {
                                if (game.DateTime_UTC < today) {
                                    todayString += 
                                    "~~" +
                                    game.MatchId + " " + 
                                    game.DateTime_UTC.toFormat("HH:mm") + " " +
                                    game.Team1 + " vs " + game.Team2 + 
                                    "~~\n" 
                                } else {
                                    todayString += 
                                    game.MatchId + " " + 
                                    game.DateTime_UTC.toFormat("HH:mm") + " " +
                                    game.Team1 + " vs " + game.Team2 + "\n"
                                    newResponse.push(game)
                                }
                            })
                            return [todayString, newResponse]
                        })

                        const tomorrowGames = getDayGames(server.leagues, today.plus({days:1}))
                        .then((response: loadGames[]) => {
                            let tomorrowString = ""
                            response.forEach(game => {
                                tomorrowString +=
                                game.DateTime_UTC.toFormat("HH:mm") + " " +
                                game.Team1 + " vs " + game.Team2 + "\n"
                            })
                            return tomorrowString
                        })

                        const nextGame = getNextGame(server.leagues, today)
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

                            const todayResponse:loadGames[] =  values[0][1] as loadGames[]
                            if (todayResponse.length > 0) {
                                todayResponse.forEach(item => {
                                    console.log(item.MatchId)
                                    console.log(item.DateTime_UTC)
                                });
                                    
                                    
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
