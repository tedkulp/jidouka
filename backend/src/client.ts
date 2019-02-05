import tmi from 'twitch-js';
import _ from 'lodash';
import util from 'util';

import watchers from './watchers';
import events from './events';
import config from './config';
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
};

const connectRetry = async (client) => {
    // Set the password every time, in case we're doing a reconnect after a failed token
    client.opts.identity.password = "oauth:" + await redis.getAsyncWhenAvailable('bot:oauth:access_token');

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
        "options": {
            "debug": _.includes(['debug', 'verbose', 'silly'], config.getLogLevel()),
            "clientId": config.getClientId(),
        },
        "connection": {
            "reconnect": false,
        },
        "identity": {
            "username": await redis.getAsyncWhenAvailable('bot:username'),
            "password": "oauth:" + await redis.getAsyncWhenAvailable('bot:oauth:access_token'),
        },
        "channels": [`#${await redis.getAsyncWhenAvailable('streamer:username')}`],
    };

    // console.log('clientConfig', clientConfig);
    client = new tmi.client(clientConfig);

    const channelClean = (str) => {
		var channel = typeof str === "undefined" || str === null ? "" : str;
		return channel.charAt(0) === "#" ? channel.toLowerCase() : "#" + channel.toLowerCase();
	};

    client['deleteMessage'] = function deletemessage(channel, messageid) {
        channel = channelClean(channel);

        // Send the command to the server and race the Promise against a delay..
        return this._sendCommand(this._getPromiseDelay(), channel, `/delete ${messageid}`, (resolve, reject) => {
            // Received _promiseDeletemessage event, resolve or reject..
            this.once("_promiseDeletemessage", (err) => {
                if (!err) { resolve([channel]); } else { reject(err); }
            });
        });
    };

    client.on('disconnected', () => {
        return connectRetry(client);
    });

    client.on('join', (channel, username, self) => {
        console.log('join', channel, username);
        watchers.addWatcher(channel, username);
        events.trigger('chat', 'join', {
            channel,
            username,
            self,
        });
        // console.log(watchers.getWatchers(channel));
    });

    client.on('part', (channel, username, self) => {
        // console.log('part', channel, username);
        watchers.removeWatcher(channel, username);
        events.trigger('chat', 'part', {
            channel,
            username,
            self,
        });
        // console.log(watchers.getWatchers(channel));
    });

    client.on('names', (channel, usernames) => {
        logger.info('names', channel, usernames);
        _.each(usernames, username => {
            watchers.addWatcher(channel, username);
            //TODO: Send event?
        });
        // console.log(watchers.getWatchers(channel));
    });

    client.on('roomstate', (channel, state) => {
        logger.info('roomstate', channel, state);
        client.mods(channel);
    });

    client.on('subscription', (channel, username, method, message, userstate) => {
        console.log('subscription', channel, username, method, message, userstate);
        events.trigger('chat', 'sub', {
            channel,
            username,
            method,
            message,
            userstate,
        });
    });

    client.on('resub', (channel, username, months, message, userstate, methods) => {
        console.log('resub', channel, username, months, message, userstate, methods);
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

    client.on('mods', (channel, mods) => {
        logger.info('mods event', channel, mods);
        _.each(mods, username => {
            watchers.addMod(channel, username);
            //TODO: Add event?
        });
        // console.log(watchers.getMods(channel));
    });

    client.on('mod', (channel, username) => {
        console.log('mod', channel, username);
        watchers.addMod(channel, username);
        events.trigger('chat', 'mod', {
            channel,
            username,
        });
        // console.log(watchers.getMods(channel));
    });

    client.on('unmod', (channel, username) => {
        // console.log('unmod', channel, username);
        watchers.removeMod(channel, username);
        events.trigger('chat', 'unmod', {
            channel,
            username,
        });
        // console.log(watchers.getMods(channel));
    });

    client.on('message', (channel, userstate, message, self) => {
        logger.info('message', channel, userstate, message, self);
    });

    client.on('hosted', (channel, username, viewers, autohost) => {
        // console.log('hosted', channel, username, viewers, autohost);
        events.trigger('chat', 'hosted', {
            channel,
            username,
            viewers,
            autohost,
        });
    });

    client.on("hosting", function (channel, target, viewers) {
        logger.info('hosting', channel, target, viewers);
    });

    client.on("unhost", function (channel, viewers) {
        logger.info('unhost', channel, viewers);
    });

    client.on('cheer', (channel, userstate, message) => {
        // console.log('cheer', channel, userstate, message);
        events.trigger('chat', 'cheer', {
            channel,
            userstate,
            message,
        });
    });

    client.on('chat', (channel, userstate, message, self) => {
        // Don't listen to my own messages..
        if (self) return;

        console.log(channel, util.inspect(userstate), message, self);

        // console.log('chat', channel, userstate, message, self);
        events.trigger('chat', 'message', {
            channel,
            userstate,
            message,
        });
    });

    client.on('ban', (channel, username, reason) => {
        // console.log('ban', channel, username, reason);
        events.trigger('chat', 'ban', {
            channel,
            username,
            reason,
        });
    });

    client.on('timeout', (channel, username, reason, duration) => {
        // console.log('timeout', channel, username, reason, duration);
        events.trigger('chat', 'timeout', {
            channel,
            username,
            reason,
            duration,
        });
    });

    return client;
};

export async function connect() {
    const client = await getClient();
    return connectRetry(client);
};
