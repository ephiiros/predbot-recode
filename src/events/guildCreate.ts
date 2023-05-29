import { Client, Events } from "discord.js";


module.exports = { 
    name: Events.GuildCreate,
    once: true,
    execute(client:Client) {
        client
        // adds server to server db
        // sends message ? about picking channel ? 
        // updates server db with channel
    }
}
