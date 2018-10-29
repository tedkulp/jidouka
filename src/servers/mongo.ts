import { MongoClient, Db } from 'mongodb';
import mongoose from 'mongoose';
import config from '../../config/config.json';

mongoose.connect(`${config.mongo.url}/${config.mongo.dbName}`, { useNewUrlParser: true });
mongoose.set('useCreateIndex', true);

const getClient = async () => {
    return await MongoClient.connect(config.mongo.url, { useNewUrlParser: true });
};

const getDb = async() => {
    const client = await getClient();
    return client.db(config.mongo.dbName);
}

export {
    getClient,
    getDb,
};
