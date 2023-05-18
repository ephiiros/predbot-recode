import { Message, TextChannel } from "discord.js";
import { DateTime } from "luxon";
import { loadGames } from "./lolFandom";
import { writeMessagesToServer, writeVotes } from "./mongoWrapper";

export async function sendVoteMessages(games: loadGames[], channel: TextChannel, today: DateTime) {
    const timeDiff = games[0].DateTime_UTC.diff(today)
    console.log("[" + channel.guildId + "] Time to next game " + timeDiff.toObject().milliseconds)

    //TODO: dependign on bo1/3/5

    channel.send("**VOTEVOTEVOTEVOTEVOTE**")
    let messageList: Message[] = []

    for (const game of games) {
        const message = await channel.send(game.Team1 + " vs " + game.Team2)
        messageList.push(message)
        message.react("1️⃣")
        message.react("2️⃣")
        setTimeout(lockVotes, 20000, message)
        console.log("[" + channel.guildId +"] Set timeout for 10000 for msg " + message.id)
    }

    writeMessagesToServer(messageList, channel.guildId)


}

export async function lockVotes(message: Message) {

    writeVotes(message).then(() => {
        message.edit("LOCKED AT ")
    })
    // count votes here
    
    console.log("[" + message.guildId + "] Locked message " + message.id)

    // after this check the result of game and 
    
}