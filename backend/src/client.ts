import _ from 'lodash';
import tmi from 'twitch-js';
import util from 'util';

import config from './config';
import events from './events';
import logger from './logger';
import redis from './servers/redis';

events.register('chat', 'join', 'User joined channel');
events.register('chat', 'part', 'User parted channel');
events.register('chat', 'sub', 'User subscribed to channel');
events.register('chat', 'resub', 'User resubscribed to channel');
events.register('chat', 'mod', 'User modded');
events.register('chat', 'unmod', 'User unmodded');
events.register('chat', 'hosted', 'Someone hosted the channel');
events.register('chat', 'cheer', 'Someone cheered');
events.register('chat', 'message', 'Message in channel');
events.register('chat', 'ban', 'Someone banned in channel');
events.register('chat', 'timeout', 'Someone timed out in channel');

export let client: tmi.client = null;

export function isConnected() {
    return client !== null;
}

const connectRetry = async _client => {
    // Set the password every time, in case we're doing a reconnect after a failed token
    client.opts.identity.password =
        'oauth:' + (await redis.getAsyncWhenAvailable('bot:oauth:access_token'));

    return client.connect().catch(err => {
        logger.error('Error connecting', err);
        logger.error('Reconnecting in 10 seconds...');
        _.delay(() => {
            return connectRetry(client);
        }, 10 * 1000);
    });
};

export async function getClient() {
    if (client) {
        return client;
    }

    logger.debug('Initializing client');

    const clientConfig = {
        options: {
            debug: _.includes(['debug', 'verbose', 'silly'], config.getLogLevel()),
            clientId: config.getClientId(),
        },
        connection: {
            reconnect: false,
        },
        identity: {
            username: await redis.getAsyncWhenAvailable('bot:username'),
            password: 'oauth:' + (await redis.getAsyncWhenAvailable('bot:oauth:access_token')),
        },
        channels: [`#${await redis.getAsyncWhenAvailable('streamer:username')}`],
    };

    client = new tmi.client(clientConfig);

    const channelClean = str => {
        const channel = typeof str === 'undefined' || str === null ? '' : str;
        return channel.charAt(0) === '#' ? channel.toLowerCase() : '#' + channel.toLowerCase();
    };

    client['deleteMessage'] = function deletemessage(channel, messageid) {
        channel = channelClean(channel);

        // Send the command to the server and race the Promise against a delay..
        return this._sendCommand(
            this._getPromiseDelay(),
            channel,
            `/delete ${messageid}`,
            (resolve, reject) => {
                // Received _promiseDeletemessage event, resolve or reject..
                this.once('_promiseDeletemessage', err => {
                    if (!err) {
                        resolve([channel]);
                    } else {
                        reject(err);
                    }
                });
            }
        );
    };

    client.on('disconnected', () => {
        return connectRetry(client);
    });

    client.on('join', (channel, username, self) => {
        logger.info('join', channel, username);
        events.trigger('chat', 'join', {
            channel,
            username,
            self,
        });
    });

    client.on('part', (channel, username, self) => {
        logger.info('part', channel, username);
        events.trigger('chat', 'part', {
            channel,
            username,
            self,
        });
    });

    client.on('names', (channel, usernames) => {
        logger.info('names', channel, usernames);
        events.trigger('chat', 'names', {
            channel,
            usernames,
        });
    });

    client.on('roomstate', (channel, state) => {
        logger.info('roomstate', channel, state);
        client.mods(channel);
    });

    client.on('subscription', (channel, username, method, message, userstate) => {
        logger.info('subscription', channel, username, method, message, userstate);
        events.trigger('chat', 'sub', {
            channel,
            username,
            method,
            message,
            userstate,
        });
    });

    client.on('resub', (channel, username, months, message, userstate, methods) => {
        logger.info('resub', channel, username, months, message, userstate, methods);
        events.trigger('chat', 'resub', {
            channel,
            username,
            months,
            message,
            userstate,
            methods,
        });
    });

    client.on('notice', (channel, msgid, message) => {
        logger.info('notice', channel, msgid, message);
    });

    client.on('mods', (channel, usernames) => {
        logger.info('mods event', channel, usernames);
        events.trigger('chat', 'mods', {
            channel,
            usernames,
        });
    });

    client.on('mod', (channel, username) => {
        logger.info('mod', channel, username);
        events.trigger('chat', 'mod', {
            channel,
            username,
        });
    });

    client.on('unmod', (channel, username) => {
        logger.info('unmod', channel, username);
        events.trigger('chat', 'unmod', {
            channel,
            username,
        });
    });

    client.on('message', (channel, userstate, message, self) => {
        logger.info('message', channel, userstate, message, self);
    });

    client.on('hosted', (channel, username, viewers, autohost) => {
        logger.info('hosted', channel, username, viewers, autohost);
        events.trigger('chat', 'hosted', {
            channel,
            username,
            viewers,
            autohost,
        });
    });

    client.on('hosting', (channel, target, viewers) => {
        logger.info('hosting', 'channel', channel, 'target', target, '# viewers', viewers);
    });

    client.on('unhost', (channel, viewers) => {
        logger.info('unhost', 'channel', channel, '# viewers', viewers);
    });

    client.on('cheer', (channel, userstate, message) => {
        logger.info('cheer', channel, userstate, message);
        events.trigger('chat', 'cheer', {
            channel,
            userstate,
            message,
        });
    });

    client.on('chat', (channel, userstate, message, self) => {
        // Don't listen to my own messages..
        if (self) {
            return;
        }

        logger.debug(channel, util.inspect(userstate), message, self);

        events.trigger('chat', 'message', {
            channel,
            userstate,
            message,
        });
    });

    client.on('ban', (channel, username, reason) => {
        logger.info('ban', channel, username, reason);
        events.trigger('chat', 'ban', {
            channel,
            username,
            reason,
        });
    });

    client.on('timeout', (channel, username, reason, duration) => {
        logger.info('timeout', channel, username, reason, duration);
        events.trigger('chat', 'timeout', {
            channel,
            username,
            reason,
            duration,
        });
    });

    return client;
}

export async function connect() {
    const retClient = await getClient();
    return connectRetry(retClient);
}
