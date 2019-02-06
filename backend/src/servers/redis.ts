import Promise from 'bluebird';
import { delay } from 'lodash';
import Redis from 'redis';

import config from '../config';
import log from '../logger';

export interface IPromisifedRedisClient extends Redis.RedisClient {
    [x: string]: any;
}

const client = Redis.createClient({
    port: config.getRedisPort(),
    host: config.getRedisHost()
}) as IPromisifedRedisClient;
Promise.promisifyAll(client);

log.info('We init redis');

client.getAsyncWhenAvailable = keyName => {
    const p = Promise.defer();
    const lookup = iKeyName => {
        client.getAsync(iKeyName).then(value => {
            if (!value) {
                delay(lookup, 1000, iKeyName);
            }
            p.resolve(value);
        });
    };

    lookup(keyName);

    return p.promise;
};

export default client;
