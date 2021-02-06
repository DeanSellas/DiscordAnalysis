const Discord = require('discord.js');
const client = new Discord.Client();

const MongoDBHandler = require("./database.js");
const MongoDB = new MongoDBHandler(process.env.DBUSER, process.env.DBPASS, process.env.DBCLUSTER);

const CommandHandler = require("./commandHandler.js");
const Command = new CommandHandler(MongoDB);

client.on('ready', () => { console.log(client.user.tag); });

client.on('message', async (message) => {

    // if message comes from another bot ignore it
    if (message.author.bot) {
        return false;
    }

    // if in debug mode print message
    if (process.env.NODE_ENV == "debug")
        console.log(`${message.author}:  ${message.content}`);

    // find guild and user items in database
    const guildResponse = await MongoDB.Find("DiscordAnalysis", "guilds", { "guildID": message.guild.id });
    const userResponse = await MongoDB.Find("DiscordAnalysis", "users", { "userID": message.author.id });

    // if user does not exist in database
    if (userResponse === null) {
        const user = {
            "userID": message.author.id,
            "userAvatar": message.author.avatar,
            "userName": message.author.username
        };

        await MongoDB.Create("DiscordAnalysis", "users", user);
    }

    //console.log(guildResponse);
    // If Guild Does Not Exist In Database Create It
    if (guildResponse === null) {

        const guild = {
            "guildID": message.guild.id,
            "guildIcon": message.guild.icon,
            "guildName": message.guild.name,
            "users": [message.author.id]
        };

        await MongoDB.Create("DiscordAnalysis", "guilds", guild);
    }
    else {
        // If user is not in guild. Add use to guild
        if (!guildResponse.users.includes(message.author.id)) {
            await MongoDB.UpdateOne("DiscordAnalysis", "guilds", { "guildID": guildResponse.guildID }, { $push: { "users": message.author.id } });
        }
    }
    
    if (message.content[0] === '!') {
        if (message.content.substring(1, 6) === "count") {
            Command.count(message);
        }
        return;
    }

    // splits message into a list of words
    const messageSplit = message.content.toLowerCase().split(' ');
    
    messageSplit.forEach(async (item) => {

        // skip if not a "word"
        if (item.includes("<@") || item.includes("<:") || item.includes("<#") || item.includes("http") || item.match(/\ud83c[\udf00-\udfff]|\ud83d[\udc00-\ude4f]|\ud83d[\ude80-\udeff]/g)) {
            return;
        }

        // search for word in database table
        const wordResponse = await MongoDB.Find("DiscordAnalysis", "words", { "word": item });

        // if word does not exist create it
        if (wordResponse === null) {
            const word = {
                "word": item,
                "data": {
                    "_total": 1,
                    "servers": [
                        {
                            "guildID": message.guild.id,
                            "users": [
                                {
                                    "_total": 1,
                                    "userID": message.author.id
                                }
                            ]
                        }
                    ]
                }
            };
            await MongoDB.Create("DiscordAnalysis", "words", word);
        }

        // if word exists, add data to it
        else {
            var servers = wordResponse.data.servers;
            var guild = {}
            var guildIndex = -1;
            servers.forEach((item, i) => {
                if (item.guildID === message.guild.id) {
                    guild = item;
                    guildIndex = i;
                    return;
                }
            });
            // if word doesnt have guild property assign the data
            if (guildIndex === -1) {
                guild = {
                    "guildID": message.guild.id,
                    "users": []
                };
                servers.push(guild);
                guildIndex = servers.length - 1
            }

            var users = guild.users;
            var userExists = false;
            try {
                users.forEach((item, i) => {
                    if (message.author.id === item.userID) {
                        users[i]._total++;
                        userExists = true
                        return;
                    }
                });
            }
            catch {}
            

            if (!userExists) {
                var user = {
                    "_total": 1,
                    "userID": message.author.id
                }
                if (users === undefined) {
                    users = [user]
                }
                else {
                    users.push(user)
                }
            }

            guild.users = users;

            servers[guildIndex] = guild;


            if (process.env.NODE_ENV == "debug") console.log(servers)
            
            wordResponse.data._total++;
            await MongoDB.UpdateOne("DiscordAnalysis", "words", { "word": item }, { $set: { "data": { "_total": wordResponse.data._total, "servers": servers}}})
        }
    });
});


async function connectDatabase() {
    if (!await MongoDB.connect()) {
        console.warn("Database Not Connected!");
        return false;
    }
    // await MongoDB.listDatabases();
    // await MongoDB.listCollections();
    return true;
}

if (connectDatabase()) {
    console.log(process.env.NODE_ENV);
    client.login(process.env.TOKEN);
}
else {
    console.error("Database connection failed please check settings")
}