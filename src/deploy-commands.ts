import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from "dotenv";

dotenv.config()

const clientId = process.env.DISCORD_CLIENT_ID as string
const guildIds = ["976555527247106099", "859795735360307210", "207209418906009602"]
const token = process.env.DISCORD_TOKEN as string

guildIds.forEach(guildId => {
	console.log(token)
	console.log("test")

	const commands = [];
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(__dirname, 'commands');
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
	console.log(commandsPath)

	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);
		commands.push(command.data.toJSON());
	}

	// Construct and prepare an instance of the REST module
	const rest = new REST({ version: '10' }).setToken(token);

	// and deploy your commands!
	(async () => {
		try {
			console.log(`Started refreshing ${commands.length} application (/) commands.`);

			// The put method is used to fully refresh all commands in the guild with the current set
			const data:any = await rest.put(
				Routes.applicationGuildCommands(clientId, guildId),
				{ body: commands },
			);
				

			console.log(`Successfully reloaded ${data.length} application (/) commands.`);
		} catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error);
		}
	})();
});