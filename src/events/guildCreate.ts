import { TextChannel } from "discord.js";
import { GuildMember } from "discord.js";
import { Events, Guild } from "discord.js";
import { Server, addServer } from "../libs/mongoWrapper";


module.exports = { 
    name: Events.GuildCreate,
    once: true,
    async execute(guild:Guild) {
        console.log(guild.id)
        const client:GuildMember = guild.members.me as GuildMember
        const channels = await guild.channels.fetch()
        let channelFound = false
        channels.forEach(channel => {
            if (!channelFound) {
                const perms = channel?.permissionsFor(client)
                if (channel?.isTextBased() 
                && perms?.toArray().includes('ViewChannel') 
                && perms?.toArray().includes('SendMessages')) {
                    const welcomeChannel = channel as TextChannel
                    welcomeChannel.send("/setchannel")
                    channelFound = true
                }
            }
        });

        const server:Server = {
            "id": guild.id,
            "channel": "0",
            "timezone": "UTC",
            "leagues": []
        }

        addServer(server)

        // adds server to server db if not already there
        // sends message ? about picking channel ? 
        // updates server db with channel
    }
}
