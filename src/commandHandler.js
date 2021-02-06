class CommandHandler {
    constructor(mongo) { this.MongoDB = mongo };
    async count(message) {
        const word = await this.MongoDB.Find("DiscordAnalysis", "words", { "word": message.content.substr(7) });
        const finalCount = word.data.servers.find(function (item) { return item.guildID === message.guild.id }).users.find(function (item) { return item.userID === message.author.id });
        if (finalCount !== undefined) {
            message.reply(`you have said \`${word.word}\` \`${finalCount._total}\` times.`)
        }
    }
}

module.exports = CommandHandler;