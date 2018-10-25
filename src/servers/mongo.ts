import { MongoClient, Db } from 'mongodb';
import config from '../../config/config.json';

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
