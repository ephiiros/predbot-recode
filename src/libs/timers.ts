import { Message, TextChannel } from "discord.js";
import { DateTime } from "luxon";
import { loadGames } from "./lolFandom";
import { Bo3Message, findMatchMessage, writeBo3 } from "./mongoWrapper";


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
        const ids20 = users20.map(users20 => {
            console.log("user")
            console.log(users20.id)
            return users20.id
        })
            
        // 2-1
        await messageList[2].edit(messageList[2].cleanContent + " LOCKED !!"
         + messageList[2].reactions.resolve("✅")?.count) 
        const users21 = await messageList[2].reactions.resolve("✅")?.users.fetch() 
        // 1-2
        await messageList[3].edit(messageList[3].cleanContent + " LOCKED !!"
         + messageList[3].reactions.resolve("✅")?.count) 
        const users12 = await messageList[3].reactions.resolve("✅")?.users.fetch() 
        // 0-2
        await messageList[4].edit(messageList[4].cleanContent + " LOCKED !!" 
         + messageList[4].reactions.resolve("✅")?.count) 
        const users02 = await messageList[4].reactions.resolve("✅")?.users.fetch() 

        await messageList[0].reactions.removeAll()
        await messageList[1].reactions.removeAll()
        await messageList[2].reactions.removeAll()
        await messageList[3].reactions.removeAll()
        await messageList[4].reactions.removeAll()

    }




    // update message
    
    }