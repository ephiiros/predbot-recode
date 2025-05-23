import { Events, Interaction } from "discord.js";

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
		console.log("creating interaction")
        if (!interaction.isChatInputCommand()) return;

        //@ts-ignore
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
		}
    }
}
