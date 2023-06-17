import { Client, Events, TextChannel } from "discord.js"
import { getServers } from "../libs/mongoWrapper"
import { Settings, DateTime } from "luxon"
import cron from "node-cron";
import { getDayGames, getNextGame, loadGames } from "../libs/lolFandom";
import { sendVoteMessages } from "../libs/timers";

Settings.defaultZone = "utc";

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
            console.log("[" + DateTime.now().toFormat("HH:mm") + "] [Server] Creating daily schedule")
                getServers().then((servers) => {
                    servers.forEach((server) => {
                        if (server.channel != null) {
                            console.log("["+ server.id +"] Scheduled Message")
                            const channel = client.channels.cache.get(server.channel) as TextChannel
                            let today = DateTime.local().setZone('utc')
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
                                        console.log(game.DateTime_UTC.toFormat("HH:mm"))
                                        console.log(game.DateTime_UTC.zoneName)
                                        console.log(today.toFormat("HH:mm"))
                                        console.log(game.DateTime_UTC < today)
                                        console.log(game.DateTime_UTC.diff(today.setZone('utc')).toObject())
                                        if (game.DateTime_UTC < today) {
                                            todayString += 
                                            "~~" +
                                            game.DateTime_UTC.toFormat("HH:mm") + " " +
                                            game.Team1 + " vs " + game.Team2 + 
                                            "~~\n" 
                                        } else {
                                            todayString += 
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
                                        game.DateTime_UTC.toFormat("HH:mm") + "  " +
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
                                        `${today.toFormat("d LLLL y HH:mm ZZZZ")}\n` + 
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
                        }
                    }}
                    )
                })

            // every 24 hours 0 0 * * * 
            // every minute * * * * * 
            cron.schedule('0 0 * * * ', () => {
                getServers().then((servers) => {
                    servers.forEach((server) => {
                        if (server.channel != null) {
                            console.log("["+ server.id +"] Scheduled Message")
                            const channel = client.channels.cache.get(server.channel) as TextChannel
                            let today = DateTime.now() //.set({hour: 8, minute: 58}) //test
                            today = today.setZone('utc')
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
                                            game.DateTime_UTC.toFormat("HH:mm") + " " +
                                            game.Team1 + " vs " + game.Team2 + 
                                            "~~\n" 
                                        } else {
                                            todayString += 
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
                                        game.DateTime_UTC.toFormat("HH:mm") + "  " +
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
                                        `${today.toFormat("d LLLL y HH:mm ZZZZ")}\n` + 
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

                            }

                        }
                    })
                })
            })
        })
    }
}
