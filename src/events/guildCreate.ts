import { Events, Guild } from "discord.js";


module.exports = { 
    name: Events.GuildCreate,
    once: true,
    execute(guild:Guild) {
        console.log(guild.id)
        // adds server to server db
        // sends message ? about picking channel ? 
        // updates server db with channel
    }
}
