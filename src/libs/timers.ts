import { Message, TextChannel } from "discord.js";
import { DateTime } from "luxon";
import { getMatchResult, loadGames } from "./lolFandom";
import { Bo1Message, Bo3Message, Bo5Message, commitVote, findMatchMessage, lockMatch, writeMessage } from "./mongoWrapper";


export async function sendVoteMessages(games: loadGames[], channel: TextChannel, today: DateTime) {
    console.log("[" + DateTime.now().toFormat("HH:mm") + "] [" + channel.guildId + "] sendVoteMessages")

    channel.send("## VOTING TIME ")

    for (const game of games) {
        switch(game.BestOf) {
            case '1':
                let bo1Message: Bo1Message = {
                    matchId: "", 
                    serverId: channel.guildId,
                    ids: [],
                    vote1: [],
                    vote2: [],
                }

                bo1Message.matchId = game.MatchId

                const bo1title = await channel.send(
                    game.DateTime_UTC.toFormat("HH:mm") + 
                    " " +
                    game.Team1 + 
                    " vs " + 
                    game.Team2
                )

                bo1Message.ids.push(bo1title.id)
                bo1title.react("1️⃣")
                bo1title.react("2️⃣")

                writeMessage(bo1Message, channel.guildId)

                setTimeout(lockVotes,
                    game.DateTime_UTC.diff(today).milliseconds,
                    bo1Message.matchId,
                    channel
                )
                break
            case '3': 
                let bo3Message: Bo3Message = {
                    matchId: "",
                    serverId: channel.guildId,
                    ids: [],
                    vote20: [],
                    vote21: [],
                    vote12: [],
                    vote02: []
                }
                bo3Message.matchId = game.MatchId

                const bo3title = await channel.send(
                    game.DateTime_UTC.toFormat("HH:mm") + 
                    " " +
                    game.Team1 + 
                    " vs " + 
                    game.Team2)
                bo3Message.ids.push(bo3title.id)

                const msg20 = await channel.send("2 - 0")
                msg20.react("✅")
                bo3Message.ids.push(msg20.id)

                const msg21 = await channel.send("2 - 1")
                msg21.react("✅")
                bo3Message.ids.push(msg21.id)

                const msg12 = await channel.send("1 - 2")
                msg12.react("✅")
                bo3Message.ids.push(msg12.id)

                const msg02 = await channel.send("0 - 2")
                msg02.react("✅")
                bo3Message.ids.push(msg02.id)

                writeMessage(bo3Message, channel.guildId)

                setTimeout(lockVotes, 
                    game.DateTime_UTC.diff(today).milliseconds, 
                    bo3Message.matchId, 
                    channel)

                break
            case '5':
                let bo5Message: Bo5Message = {
                    matchId: "",
                    serverId: channel.guildId,
                    ids: [],
                    vote30: [],
                    vote31: [],
                    vote32: [],
                    vote23: [],
                    vote13: [],
                    vote03: []
                }
                bo5Message.matchId = game.MatchId

                const bo5title = await channel.send(
                    game.DateTime_UTC.toFormat("HH:mm") + 
                    " " +
                    game.Team1 + 
                    " vs " + 
                    game.Team2)

                bo5Message.ids.push(bo5title.id)

                const msg30 = await channel.send("3 - 0")
                msg30.react("✅")
                bo5Message.ids.push(msg30.id)
                const msg31 = await channel.send("3 - 1")
                msg31.react("✅")
                bo5Message.ids.push(msg31.id)
                const msg32 = await channel.send("3 - 2")
                msg32.react("✅")
                bo5Message.ids.push(msg32.id)
                const msg23 = await channel.send("2 - 3")
                msg23.react("✅")
                bo5Message.ids.push(msg23.id)
                const msg13 = await channel.send("1 - 3")
                msg13.react("✅")
                bo5Message.ids.push(msg13.id)
                const msg03 = await channel.send("0 - 3")
                msg03.react("✅")
                bo5Message.ids.push(msg03.id)

                writeMessage(bo5Message, channel.guildId)

                setTimeout(lockVotes, 
                    game.DateTime_UTC.diff(today).milliseconds, 
                    bo5Message.matchId, 
                    channel)

                break
        }
    }
}

export async function lockVotes(matchId: string, channel:TextChannel ) {
    console.log("[" + DateTime.now().toFormat("HH:mm") + "] [" + channel.guildId + "] lockVotes")

    const match = await findMatchMessage(matchId, channel.guildId) as unknown as Bo1Message | Bo3Message

    const idsLen = match.ids.length

    if (idsLen == 1) {
        let messageList:Message[] = []

        const bo1Message = match as unknown as Bo1Message

        for (const msgId of bo1Message.ids) {
            messageList.push(await channel.messages.fetch(msgId))
        }

        await messageList[0].edit(messageList[0].cleanContent + " LOCKED")

        const users1 = await messageList[0].reactions.resolve("1️⃣")?.users.fetch() 
        const users2 = await messageList[0].reactions.resolve("2️⃣")?.users.fetch() 

        const ids1:string[] = []
        const ids2:string[] = []

        //@ts-ignore
        users1.forEach(user => {
            if (!user.bot) {
                ids1.push(user.id)
            }
        })
        //@ts-ignore
        users2.forEach(user => {
            if (!user.bot) {
                ids2.push(user.id)
            }
        })

        bo1Message.vote1 = ids1
        bo1Message.vote2 = ids2

        await messageList[0].reactions.removeAll()

        lockMatch(bo1Message, channel.guildId)

        setTimeout(countPoints, 
            3600000, //1 hour
            bo1Message.matchId,
            channel)

    } else if (idsLen == 5) {
        let messageList:Message[] = []
        const bo3Message = match as unknown as Bo3Message

        for (const msgId of bo3Message.ids) {
            messageList.push(await channel.messages.fetch(msgId))
        }

        // 2-0
        const users20 = await messageList[1].reactions.resolve("✅")?.users.fetch() 
        const ids20:string[] = [] 
        users20?.forEach(user => {
            if (!user.bot) {
                ids20.push(user.id)
            }
        })
        bo3Message.vote20 = ids20
            
        // 2-1
        const users21 = await messageList[2].reactions.resolve("✅")?.users.fetch() 
        const ids21:string[] = [] 
        users21?.forEach(user => {
            if (!user.bot) {
                ids21.push(user.id)
            }
        })
        bo3Message.vote21 = ids21

        // 1-2
        const users12 = await messageList[3].reactions.resolve("✅")?.users.fetch() 
        const ids12:string[] = [] 
        users12?.forEach(user => {
            if (!user.bot) {
                ids12.push(user.id)
            }
        })
        bo3Message.vote12 = ids12

        // 0-2
        const users02 = await messageList[4].reactions.resolve("✅")?.users.fetch() 
        const ids02:string[] = [] 
        users02?.forEach(user => {
            if (!user.bot) {
                ids02.push(user.id)
            }
        })
        await messageList[4].edit(messageList[4].cleanContent + " LOCKED count:" 
        + ids02.length)

        bo3Message.vote02 = ids02

        // title card
        await messageList[0].edit(messageList[0].cleanContent + "\n" +
        "```" +
        "2-0 " + "█".repeat(ids20.length) + " " + ids20.length + "\n" + 
        "2-1 " + "█".repeat(ids21.length) + " " + ids21.length +"\n" + 
        "1-2 " + "█".repeat(ids12.length) + " " + ids12.length +"\n" + 
        "0-2 " + "█".repeat(ids02.length) + " " + ids02.length +"```")

        await messageList[1].delete()
        await messageList[2].delete()
        await messageList[3].delete()
        await messageList[4].delete()

        lockMatch(bo3Message, channel.guildId)

        setTimeout(countPoints, 
            3600000, //1 hour
            bo3Message.matchId,
            channel)
    } else if (idsLen == 7) {
        let messageList:Message[] = []
        const bo5Message = match as unknown as Bo5Message

        for (const msgId of bo5Message.ids) {
            messageList.push(await channel.messages.fetch(msgId))
        }

        // 3-0
        const users30 = await messageList[1].reactions.resolve("✅")?.users.fetch() 
        const ids30:string[] = []
        users30?.forEach(user => {
            if (!user.bot) {
                ids30.push(user.id)
            }
        })
        // 3-1
        const users31 = await messageList[2].reactions.resolve("✅")?.users.fetch() 
        const ids31:string[] = []
        users31?.forEach(user => {
            if (!user.bot) {
                ids31.push(user.id)
            }
        })
        // 3-2
        const users32 = await messageList[3].reactions.resolve("✅")?.users.fetch() 
        const ids32:string[] = []
        users32?.forEach(user => {
            if (!user.bot) {
                ids32.push(user.id)
            }
        })
        // 2-3
        const users23 = await messageList[4].reactions.resolve("✅")?.users.fetch() 
        const ids23:string[] = []
        users23?.forEach(user => {
            if (!user.bot) {
                ids23.push(user.id)
            }
        })
        // 1-3
        const users13 = await messageList[5].reactions.resolve("✅")?.users.fetch() 
        const ids13:string[] = []
        users13?.forEach(user => {
            if (!user.bot) {
                ids13.push(user.id)
            }
        })
        // 0-3
        const users03 = await messageList[6].reactions.resolve("✅")?.users.fetch() 
        const ids03:string[] = []
        users03?.forEach(user => {
            if (!user.bot) {
                ids03.push(user.id)
            }
        })

        bo5Message.vote30 = ids30
        bo5Message.vote31 = ids31
        bo5Message.vote32 = ids32
        bo5Message.vote23 = ids23
        bo5Message.vote13 = ids13
        bo5Message.vote03 = ids03

        await messageList[0].edit(messageList[0].cleanContent + "\n" +
        "```" +
        "3-0 " + "█".repeat(ids30.length) + " " + ids30.length + "\n" + 
        "3-1 " + "█".repeat(ids31.length) + " " + ids31.length + "\n" + 
        "3-2 " + "█".repeat(ids32.length) + " " + ids32.length + "\n" + 
        "2-3 " + "█".repeat(ids23.length) + " " + ids23.length + "\n" + 
        "1-3 " + "█".repeat(ids13.length) + " " + ids13.length + "\n" + 
        "0-3 " + "█".repeat(ids03.length) + " " + ids03.length + "\n" + 
        "```")

        lockMatch(bo5Message, channel.guildId)

        setTimeout(countPoints,
            3600000,
            bo5Message.matchId,
            channel)
    }
}

export async function countPoints (matchId:string, channel: TextChannel) {
    console.log("[" + DateTime.now().toFormat("HH:mm") + 
    "] [" + channel.guildId +  "] countPoints " + matchId)

    const match = await findMatchMessage(matchId, channel.guildId) as unknown as Bo1Message | Bo3Message
    const matchResult = await getMatchResult(match.matchId)

    if (matchResult == null || matchResult.Winner == null) {
        console.log("[" + DateTime.now().toFormat("HH:mm") + 
        "] [" + channel.guildId +  
        "] matchResult/Winner null 1 hour timeout")
        setTimeout(countPoints, 
            3600000, //1 hour
            match.matchId,
            channel)
    } else {
        switch(matchResult.BestOf) {
            case '1':
                let bo1Message = match as unknown as Bo1Message

                const validWins:string[] = []
                const validLoss:string[] = []

                if (matchResult.Winner == 1) {
                    //TODO: foreach doesnt exist
                    bo1Message.vote1.forEach(userId => {
                        if (!bo1Message.vote2.includes(userId)) {
                            validWins.push(userId)
                        }
                    })
                    bo1Message.vote2.forEach(userId => {
                        if (!bo1Message.vote1.includes(userId)) {
                            validLoss.push(userId)
                        }
                    })
                } else {
                    bo1Message.vote2.forEach(userId => {
                        if (!bo1Message.vote1.includes(userId)) {
                            validWins.push(userId)
                        }
                    })
                    bo1Message.vote1.forEach(userId => {
                        if (!bo1Message.vote2.includes(userId)) {
                            validLoss.push(userId)
                        }
                    })
                }

                let allVotes1:string[] = []
                allVotes1 = allVotes1.concat(bo1Message.vote1)
                allVotes1 = allVotes1.concat(bo1Message.vote2)

                const allSet1 = new Set(allVotes1)

                allSet1.forEach(userId => {
                    let vote;
                    let points;
                    let invalid = false;

                    if (validLoss.includes(userId)) {
                        vote = matchResult.Winner == '1' ? 1 : 2 
                        points = 0

                    } else if (validWins.includes(userId)) {
                        vote = Number(matchResult.Winner)
                        points = 1
                    } else {
                        invalid = true 
                    }
                    if (invalid == false) {
                        commitVote(userId,
                            {
                                serverId: channel.guildId,
                                matchId: match.matchId,
                                vote: vote,
                                points: points
                            }
                        )
                    }
                })
                break
            case '3':
                // score matters 
                const scoreString = matchResult.Team1Score.concat(matchResult.Team2Score)

                let bo3Message = match as unknown as Bo3Message

                let allVotes:string[] = []
                allVotes = allVotes.concat(bo3Message.vote20)
                allVotes = allVotes.concat(bo3Message.vote21)
                allVotes = allVotes.concat(bo3Message.vote12)
                allVotes = allVotes.concat(bo3Message.vote02)

                const allSet3 = new Set(allVotes)

                const illegalIds:string[] = []
                const userCounts = {}

                allVotes.forEach(userId => {
                    //@ts-ignore
                    userCounts[userId] = (userCounts[userId] || 0) + 1;
                });

                for (let key in userCounts) {
                    //@ts-ignore
                    if (userCounts[key] > 1) {
                        illegalIds.push(key)
                    }
                }

                allSet3.forEach(userId => {
                    if (!illegalIds.includes(userId)) {
                        let vote = ""
                        let points = 0
                        if (bo3Message.vote20.includes(userId)) { vote = "20"
                            if (scoreString == "20") { points = 3}
                            else if (scoreString == "21") { points = 1}
                        } else if (bo3Message.vote21.includes(userId)) { vote = "21"
                            if (scoreString == "21") { points = 3}
                            else if (scoreString == "20") { points = 1}
                        } else if (bo3Message.vote12.includes(userId)) { vote = "12"
                            if (scoreString == "12") { points = 3}
                            else if (scoreString == "21") { points = 1}
                        } else if (bo3Message.vote02.includes(userId)) { vote = "02"
                            if (scoreString == "02") { points = 3}
                            else if (scoreString == "12") { points = 1}
                        }
                        commitVote(userId,
                            {
                                serverId: channel.guildId,
                                matchId: bo3Message.matchId,
                                vote: vote,
                                points: points
                            }
                        )
                        channel.send("points added for: " + bo3Message.matchId)
                    }
                })
                break
            case '5':
                const bo5scoreString = matchResult.Team1Score.concat(matchResult.Team2Score)

                let bo5Message = match as unknown as Bo5Message

                let bo5allVotes:string[] = []
                bo5allVotes = bo5allVotes.concat(bo5Message.vote30)
                bo5allVotes = bo5allVotes.concat(bo5Message.vote31)
                bo5allVotes = bo5allVotes.concat(bo5Message.vote32)
                bo5allVotes = bo5allVotes.concat(bo5Message.vote23)
                bo5allVotes = bo5allVotes.concat(bo5Message.vote13)
                bo5allVotes = bo5allVotes.concat(bo5Message.vote03)

                const allSet5 = new Set(bo5allVotes)

                const bo5illegalIds:string[] = []
                const bo5userCounts = {}

                bo5allVotes.forEach(userId => {
                    //@ts-ignore
                    bo5userCounts[userId] = (bo5userCounts[userId] || 0) + 1
                })

                for (let key in bo5userCounts) {
                    //@ts-ignore
                    if (bo5userCounts[key] > 1) {
                        bo5illegalIds.push(key)
                    }
                }

                allSet5.forEach(userId => {
                    if (!bo5illegalIds.includes(userId)) {
                        let vote = ""
                        let points = 0
                        if (bo5Message.vote30.includes(userId)) { vote = "30"
                            if (bo5scoreString == "30") {points = 5}
                            else if (bo5scoreString == "31" || 
                                    bo5scoreString == "32") {points = 3}
                        } else if (bo5Message.vote31.includes(userId)) { vote = "31"
                            if (bo5scoreString == "31") {points = 5}
                            else if (bo5scoreString == "30" || 
                                    bo5scoreString == "32") {points = 3}
                        } else if (bo5Message.vote32.includes(userId)) { vote = "32"
                            if (bo5scoreString == "32") {points = 5}
                            else if (bo5scoreString == "30" || 
                                    bo5scoreString == "31") {points = 3}
                        } else if (bo5Message.vote23.includes(userId)) { vote = "23"
                            if (bo5scoreString == "23") {points = 5}
                            else if (bo5scoreString == "13" || 
                                    bo5scoreString == "03") {points = 3}
                        } else if (bo5Message.vote13.includes(userId)) { vote = "13"
                            if (bo5scoreString == "13") {points = 5}
                            else if (bo5scoreString == "23" || 
                                    bo5scoreString == "03") {points = 3}
                        } else if (bo5Message.vote03.includes(userId)) { vote = "03"
                            if (bo5scoreString == "03") {points = 5}
                            else if (bo5scoreString == "23" || 
                                    bo5scoreString == "13") {points = 3}
                        }
                        commitVote(userId,
                            {
                                serverId: channel.guildId,
                                matchId: bo5Message.matchId,
                                vote:vote,
                                points:points
                            }
                        )
                        channel.send("points added for: " + bo5Message.matchId)
                    }
                })
                break
        }
    }
}