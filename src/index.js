const Bot = require("./bot");

const MongoDBHandler = require("./database.js");
const MongoDB = new MongoDBHandler(process.env.DBUSER, process.env.DBPASS, process.env.DBCLUSTER);

async function connectDatabase() {
    if (!await MongoDB.connect()) {
        console.warn("Database Not Connected!");
        return false;
    }
    return true;
}

if (connectDatabase()) {
    console.log(process.env.NODE_ENV);
    const BotHandler = new Bot(process.env.TOKEN, MongoDB);
    BotHandler.Login();
}
else {
    console.error("Database connection failed please check settings")
}