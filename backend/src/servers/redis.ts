import Bluebird from 'bluebird';
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
Bluebird.promisifyAll(client);

log.info('We init redis');

client.getAsyncWhenAvailable = keyName => {
    const p = Bluebird.defer();
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

client.getTimedCount = async (keyName, timeout) => {
    // Commence anti-pattern...
    const $d = Bluebird.defer<number>();

    client
        .multi()
        .incr(keyName)
        .expire(keyName, timeout)
        .exec((err, _) => {
            if (err) {
                return $d.reject(err);
            }

            client.getAsync(keyName).then(res => {
                return $d.resolve(parseInt(res, 10));
            });
        });

    return $d.promise;
};

export default client;
