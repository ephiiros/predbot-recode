import { Client, Events, TextChannel } from "discord.js"
import { getServers } from "../libs/mongoWrapper"
import { Settings, DateTime } from "luxon"
import cron from "node-cron";
import { getDayGames, getNextGame, loadGames } from "../libs/lolFandom";
import { sendVoteMessages } from "../libs/timers";

//Settings.defaultZone = "utc";
Settings.defaultZone = "UTC+7";

async function readyEvent(client: Client) {
    console.log("[" + DateTime.now().toFormat("HH:mm") + "] [Server] Creating daily schedule")
        getServers().then((servers) => {
            servers.forEach((server) => {
                if (server.channel != null) {
                    console.log("["+ server.id +"] Scheduled Message")
                    const channel = client.channels.cache.get(server.channel) as TextChannel
                    //let today = DateTime.local().setZone('utc')
                    let today = DateTime.local().setZone('UTC+7')
                    //const today = DateTime.fromSQL("2023-03-18 00:00:00")

                    if (server.leagues == null) {
                        // error
                        console.log("[" + server.id + "] no leagues in server")
                    } else {
                        const todayGames = getDayGames(server.leagues, today)
                        .then((response: loadGames[]) => {
                            let todayString = ""
                            let newResponse:loadGames[] = []
                            response.forEach(game => {
                                if (game.DateTime_UTC < today) {
                                    todayString += 
                                    "~~" +
                                    "<t:" + Math.floor(game.DateTime_UTC.toMillis()/1000) + ":t>" + " " +
                                    game.Team1 + 
                                    " vs " + 
                                    game.Team2 + 
                                    "~~\n" 
                                } else {
                                    todayString += 
                                    "<t:" + Math.floor(game.DateTime_UTC.toMillis()/1000) + ":t>" + " " +
                                    game.Team1 + 
                                    " vs " + 
                                    game.Team2 + 
                                    "\n" 
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
                                    "<t:" + Math.floor(game.DateTime_UTC.toMillis()/1000) + ":t>" + " " +
                                    game.Team1 + 
                                    " vs " + 
                                    game.Team2 + 
                                    "\n" 
                            })
                            return tomorrowString
                        })

                        const nextGame = getNextGame(server.leagues, today)
                        .then((response: loadGames | null) => {
                            if (response) {
                                let nextGameString = ""
                                nextGameString += 
                                "<t:" + Math.floor(response.DateTime_UTC.toMillis()/1000) + ":R>" + " " + 
                                response.Team1 + 
                                " vs " + 
                                response.Team2 + 
                                "\n" 

                                return nextGameString
                            } else {
                                return " "
                            }
                        })

                        Promise.all([todayGames, tomorrowGames, nextGame]).then((values) => {
                            let dailyMessage = 
                                "## CURRENT DATE AND TIME " +
                                `<t:${Math.floor(today.toMillis()/1000)}:f>\n` 


                            if (values[0][0].length > 0) {
                                dailyMessage += "## GAMES TODAY \n"
                                dailyMessage += values[0][0]
                            }

                            if (values[1].length > 0) {
                                dailyMessage += "## GAMES TOMORROW\n"
                                dailyMessage += values[1]
                            }

                            dailyMessage += "## NEXT GAME\n"
                            dailyMessage += values[2]

                            // send for the day but lock individually

                            if (values[0][1].length > 0) {
                                setTimeout(sendVoteMessages, 2000, values[0][1], channel, today)
                            }

                            channel.send(dailyMessage)

                        })
                }
            }}
            )
        })

}

module.exports = { 
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        getServers().then((servers) => {
            servers.forEach((server) => {
                if (server.channel != null) {
                    let helloChannel = (client.channels.cache.get(server.channel) as TextChannel) 
                    helloChannel.send("Bot Restarted\n" +
                    "message @ephiros for help")

                    console.log("[" + DateTime.now().toFormat("HH:mm") + "] [" + server.id +"] Sent restart message")
                }
            })
            return servers
        }).then(() => {
            readyEvent(client)

            // every 24 hours 0 0 * * * 
            // every minute * * * * * 
            cron.schedule('18 13 * * * ', () => {
                readyEvent(client)
            })
        })
    }
}
