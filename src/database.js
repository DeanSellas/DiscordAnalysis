const { MongoClient } = require('mongodb');

// https://docs.mongodb.com/drivers/node/quick-start
class MongoDBHandler {
    constructor(user, pass, cluster) {
        this.uri = `mongodb://${user}:${pass}@${cluster}` //?retryWrites=true&w=majority`;
        this.client = new MongoClient(this.uri, { useNewUrlParser: true, useUnifiedTopology: true });
    }

    async connect() {
        try {
            await this.client.connect();
            console.log("connected to DB!")
            this.connected = true;
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async listDatabases() {
        var databasesList = await this.client.db().admin().listDatabases();
        console.log("Databases:");
        databasesList.databases.forEach(db => console.log(` - ${db.name}`));
    }

    async Find(database, collection, query) {
        return await this.client.db(database).collection(collection).findOne(query);
    }

    async Create(database, collection, data) {
        let uid;
        await this.client.db(database).collection(collection).insertOne(data, function (err, res) {
            if (err !== null) {
                console.error(err);
                return err;
            }
            uid = res.insertedId;
        });
        return uid
    }

    // https://www.w3schools.com/nodejs/nodejs_mongodb_update.asp
    async UpdateOne(database, collection, query, values) {
        return await this.client.db(database).collection(collection).updateOne(query, values);
    }

    async close() {
        await this.client.close();
    }
}

module.exports = MongoDBHandler