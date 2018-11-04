import Promise from 'bluebird';
import Redis from 'redis';
import config from '../config';
import log from '../logger';

export interface IPromisifedRedisClient extends Redis.RedisClient {
    [x: string]: any,
}

const client = Redis.createClient({
    port: config.getRedisPort(),
    host: config.getRedisHost(),
});
Promise.promisifyAll(client);

log.info('We init redis');

export default client as IPromisifedRedisClient;
