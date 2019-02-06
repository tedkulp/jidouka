import cachegoose from 'cachegoose';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

import config from '../config';

const getClient = async () => {
    return MongoClient.connect(config.getMongoUri(), { useNewUrlParser: true });
};

const getDb = async () => {
    const client = await getClient();
    return client.db(config.getMongoDbName());
};

const init = () => {
    mongoose.connect(`${config.getMongoUri()}/${config.getMongoDbName()}`, {
        useNewUrlParser: true
    });
    mongoose.set('useCreateIndex', true);

    cachegoose(mongoose, {
        engine: 'redis',
        port: config.getRedisPort(),
        host: config.getRedisHost()
    });
};

const close = () => {
    if (mongoose) {
        mongoose.disconnect();
    }
};

export { getClient, getDb, init, close };
