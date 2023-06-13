import { Message, TextChannel } from "discord.js";
import { DateTime } from "luxon";
import { getMatchResult, loadGames } from "./lolFandom";
import { Bo3Message, commitVote, findMatchMessage, lockMatch, writeBo3 } from "./mongoWrapper";


export async function sendVoteMessages(games: loadGames[], channel: TextChannel, today: DateTime) {
    const timeDiff = games[0].DateTime_UTC.diff(today)
    console.log("[" + channel.guildId + "] Time to next game " + timeDiff.toObject().milliseconds)

    //TODO: dependign on bo1/3/5

    channel.send("**VOTEVOTEVOTEVOTEVOTE**")

    for (const game of games) {
        console.log(game.BestOf)
        switch(Number(game.BestOf)) {
            case 1:
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

                const bo3title = await channel.send("bo3" + game.Team1 + " vs " + game.Team2)
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
    console.log("lock votes " + matchId  + " " + channel.guildId)

    const match:Bo3Message = await findMatchMessage(matchId, channel.guildId) as unknown as Bo3Message

    const idsLen = match.ids.length

    if (idsLen == 5) {
        // match is bo3

        let messageList:Message[] = []

        for (const msgId of match.ids) {
            //console.log(await channel.messages.fetch(msgId))
            messageList.push(await channel.messages.fetch(msgId))
        }

        // title card
        await messageList[0].edit(messageList[0].cleanContent + " LOCKED !!") 
        // 2-0
        await messageList[1].edit(messageList[1].cleanContent + " LOCKED !!"
        + messageList[1].reactions.resolve("✅")?.count) 
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
        await messageList[2].edit(messageList[2].cleanContent + " LOCKED !!"
        + messageList[2].reactions.resolve("✅")?.count) 
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
        await messageList[3].edit(messageList[3].cleanContent + " LOCKED !!"
        + messageList[3].reactions.resolve("✅")?.count) 
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
        await messageList[4].edit(messageList[4].cleanContent + " LOCKED !!" 
        + messageList[4].reactions.resolve("✅")?.count) 
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


        // TODO: duplicate voting removal ? here or after adding points

        lockMatch(match, channel.guildId)


        setTimeout(countPoints, 
            2000, //2 seconds
            match.matchId,
            channel)

    }
}

export async function countPoints (matchId:string, channel: TextChannel) {
    const match:Bo3Message = await findMatchMessage(matchId, channel.guildId) as unknown as Bo3Message

    const matchResult = await getMatchResult(match.matchId)
    console.log("match result")
    console.log(matchResult)

    if (matchResult.Winner != null) {
        switch(matchResult.BestOf) {
            case 3:
                console.log("switch case 3")
                // score matters 
                const scoreString = matchResult.Team1Score.concat(matchResult.Team2Score)
                console.log("scorestring")
                console.log(scoreString)

                // has to go through all of them anyway but has to add different amount of points 

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

                const allSet = new Set(allVotes)

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

                allSet.forEach(userId => {
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

    // check for result

    /*
    users coll 
    [
        user: {
            id: 123
            history: [
                vote: {
                    serverId: 123
                    match: xxx
                    vote: "1/2 // 20/21/12/20 // 30/31...etc"
                    points: 1
                }
            ]
        }
    ]
    */

}