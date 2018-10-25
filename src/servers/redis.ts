import Promise from 'bluebird';
import Redis from 'redis';
import config from '../../config/config.json';
import log from '../logger';

export interface IPromisifedRedisClient extends Redis.RedisClient {
    [x: string]: any
}

const client = Redis.createClient(config.redis);
Promise.promisifyAll(client);

log.info('We init redis');

export default client as IPromisifedRedisClient;
