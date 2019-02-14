import Bluebird from 'bluebird';
import { delay } from 'lodash';
import Redis from 'redis';

import config from '../config';
import logger from '../logger';

export interface IPromisifedRedisClient extends Redis.RedisClient {
    [x: string]: any;
}

let client = null;

const initClient = () => {
    client = Redis.createClient({
        port: config.getRedisPort(),
        host: config.getRedisHost(),
    }) as IPromisifedRedisClient;
    Bluebird.promisifyAll(client);

    logger.info('We init redis');

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
};

// Proxy everything.  This way redis becomes a lazy loading affiar,
// allowing us to do testing without manually connecting everywhere.
const handler = {
    get(_target, propKey, _receiver) {
        if (client == null) {
            initClient();
        }
        const origMethod = client[propKey];

        return function(...args) {
            let result = origMethod.apply(client, args);
            logger.silly(propKey + JSON.stringify(args) + ' -> ' + JSON.stringify(result));
            return result;
        };
    },
};

export default new Proxy({}, handler);
