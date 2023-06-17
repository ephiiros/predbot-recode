import { Message, TextChannel } from "discord.js";
import { DateTime } from "luxon";
import { getMatchResult, loadGames } from "./lolFandom";
import { Bo1Message, Bo3Message, commitVote, findMatchMessage, lockMatch, writeBo3 } from "./mongoWrapper";


export async function sendVoteMessages(games: loadGames[], channel: TextChannel, today: DateTime) {
    console.log("[" + DateTime.now().toFormat("HH:mm") + "] [" + channel.guildId + "] sendVoteMessages")

    channel.send("**VOTEVOTEVOTEVOTEVOTE**")

    for (const game of games) {
        switch(Number(game.BestOf)) {
            case 1:
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

                setTimeout(lockVotes,
                    game.DateTime_UTC.diff(today).milliseconds,
                    bo1Message.matchId,
                    channel
                )
                break
            case 3: 
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

                writeBo3(bo3Message, channel.guildId)

                setTimeout(lockVotes, 
                    game.DateTime_UTC.diff(today).milliseconds, 
                    bo3Message.matchId, 
                    channel)

                break
            case 5:
                break
        }
    }
}

export async function lockVotes(matchId: string, channel:TextChannel ) {
    console.log("[" + DateTime.now().toFormat("HH:mm") + "] [" + channel.guildId + "] lockVotes")

    const match:Bo3Message = await findMatchMessage(matchId, channel.guildId) as unknown as Bo3Message

    const idsLen = match.ids.length

    if (idsLen == 1) {
        let messageList:Message[] = []

        for (const msgId of match.ids) {
            messageList.push(await channel.messages.fetch(msgId))
        }

        await messageList[0].edit(messageList[0].cleanContent + " LOCKED")

        const users1 = await messageList[0].reactions.resolve("1️⃣")?.users.fetch() 
        const users2 = await messageList[0].reactions.resolve("2️⃣")?.users.fetch() 

        const ids1 = []
        const ids2 = []

        //@ts-ignore
        users1.forEach(user => {
            if (!user.bot) {
                ids1.push(user.id)
            }
        })
        users2.forEach(user => {
            if (!user.bot) {
                ids2.push(user.id)
            }
        })

        match.vote1 = users1
        match.vote2 = users2

        await messageList[0].reactions.removeAll()

        lockMatch(match, channel.guildId)

        setTimeout(countPoints, 
            3600000, //1 hour
            match.matchId,
            channel)
    }

    if (idsLen == 5) {
        // match is bo3

        let messageList:Message[] = []

        for (const msgId of match.ids) {
            messageList.push(await channel.messages.fetch(msgId))
        }

        // title card
        await messageList[0].edit(messageList[0].cleanContent + " LOCKED") 
        // 2-0
        await messageList[1].edit(messageList[1].cleanContent + " LOCKED count:"
        + await messageList[1].reactions.resolve("✅")?.count) 
        const users20 = await messageList[1].reactions.resolve("✅")?.users.fetch() 

        //@ts-ignore
        const ids20 = [] 
        //@ts-ignore
        users20.forEach(user => {
            if (!user.bot) {
                ids20.push(user.id)
            }
        })
        //@ts-ignore
        match.vote20 = ids20
            
        // 2-1
        await messageList[2].edit(messageList[2].cleanContent + " LOCKED count: "
        + await messageList[2].reactions.resolve("✅")?.count) 
        //@ts-ignore
        const users21 = await messageList[2].reactions.resolve("✅")?.users.fetch() 

        //@ts-ignore
        const ids21 = [] 
        //@ts-ignore
        users21.forEach(user => {
            if (!user.bot) {
                ids21.push(user.id)
            }
        })
        //@ts-ignore
        match.vote21 = ids21

        // 1-2
        await messageList[3].edit(messageList[3].cleanContent + " LOCKED count:"
        + await messageList[3].reactions.resolve("✅")?.count) 
        //@ts-ignore
        const users12 = await messageList[3].reactions.resolve("✅")?.users.fetch() 

        //@ts-ignore
        const ids12 = [] 
        //@ts-ignore
        users12.forEach(user => {
            if (!user.bot) {
                ids12.push(user.id)
            }
        })
        //@ts-ignore
        match.vote12 = ids12

        // 0-2
        await messageList[4].edit(messageList[4].cleanContent + " LOCKED count:" 
        + await messageList[4].reactions.resolve("✅")?.count) 
        //@ts-ignore
        const users02 = await messageList[4].reactions.resolve("✅")?.users.fetch() 

        //@ts-ignore
        const ids02 = [] 
        //@ts-ignore
        users02.forEach(user => {
            if (!user.bot) {
                ids02.push(user.id)
            }
        })
        //@ts-ignore
        match.vote02 = ids02

        await messageList[0].reactions.removeAll()
        await messageList[1].reactions.removeAll()
        await messageList[2].reactions.removeAll()
        await messageList[3].reactions.removeAll()
        await messageList[4].reactions.removeAll()

        lockMatch(match, channel.guildId)

        setTimeout(countPoints, 
            3600000, //1 hour
            match.matchId,
            channel)
    }
}

export async function countPoints (matchId:string, channel: TextChannel) {
    console.log("[" + DateTime.now().toFormat("HH:mm") + "] [" + channel.guildId +  "] countPoints")
    const match:Bo3Message = await findMatchMessage(matchId, channel.guildId) as unknown as Bo3Message
    const matchResult = await getMatchResult(match.matchId)

    if (matchResult.Winner == null) {
        setTimeout(countPoints, 
            3600000, //1 hour
            match.matchId,
            channel)
    } else {
        switch(matchResult.BestOf) {
            case '1':
                const validWins = []
                const validLoss = []
                if (matchResult.Winner == 1) {
                    match.vote1.forEach(userId => {
                        if (!match.vote2.includes(userId)) {
                            validWins.push(userId)
                        }
                    })
                    match.vote2.forEach(userId => {
                        if (!match.vote1.includes(userId)) {
                            validLoss.push(userId)
                        }
                    })
                } else {
                    match.vote2.forEach(userId => {
                        if (!match.vote1.includes(userId)) {
                            validWins.push(userId)
                        }
                    })
                    match.vote1.forEach(userId => {
                        if (!match.vote2.includes(userId)) {
                            validLoss.push(userId)
                        }
                    })
                }

                //@ts-ignore
                let allVotes1 = []
                //@ts-ignore
                allVotes1 = allVotes1.concat(match.vote1)

                //@ts-ignore
                allVotes1 = allVotes1.concat(match.vote2)


                const allSet1 = new Set(allVotes1)

                allSet1.forEach(userId => {
                    let vote;
                    let points;
                    let invalid = false;
                    if (validLoss.includes(userId)) {
                        vote = matchResult.Winner == '1' ? 1 : 2 
                        points = 0
                    } else if (validWins.includes(userId)) {
                        vote = matchResult.Winner
                        points = 1
                    } else {
                        invalid = true 
                    }
                    if (invalid = false) {
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

                //@ts-ignore
                let allVotes = []
                //@ts-ignore
                allVotes = allVotes.concat(match.vote20)
                //@ts-ignore
                allVotes = allVotes.concat(match.vote21)
                //@ts-ignore
                allVotes = allVotes.concat(match.vote12)
                //@ts-ignore
                allVotes = allVotes.concat(match.vote02)

                const allSet3 = new Set(allVotes)

                //@ts-ignore
                const illegalIds = []
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
                    //@ts-ignore
                    if (!illegalIds.includes(userId)) {
                        let vote = ""
                        let points = 0
                        if (match.vote20.includes(userId)) { vote = "20"
                            if (scoreString == "20") { points = 3}
                            else if (scoreString == "21") { points = 1}
                        } else if (match.vote21.includes(userId)) { vote = "21"
                            if (scoreString == "21") { points = 3}
                            else if (scoreString == "20") { points = 1}
                        } else if (match.vote12.includes(userId)) { vote = "12"
                            if (scoreString == "12") { points = 3}
                            else if (scoreString == "21") { points = 1}
                        } else if (match.vote02.includes(userId)) { vote = "02"
                            if (scoreString == "02") { points = 3}
                            else if (scoreString == "12") { points = 1}
                        }
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
        }

    }
}