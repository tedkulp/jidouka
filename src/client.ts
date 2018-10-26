import tmi from 'tmi.js';
import _ from 'lodash';

import users from './users';
import events from './events';
import config from '../config/config.json';
import logger from './logger';

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

const client = new tmi.client({
    "options": {
        "debug": _.includes(['debug', 'verbose', 'silly'], config.options.logLevel),
        "clientId": config.options.clientId,
    },
    "connection": {
        "reconnect": true,
    },
    "identity": {
        "username": config.bot.username,
        "password": config.bot.password,
    },
    "channels": [`#${config.streamer.username}`],
});

client.on('join', (channel, username, self) => {
    // console.log('join', channel, username);
    users.addUser(channel, username);
    events.trigger('chat', 'join', {
        channel,
        username,
        self,
    });
    // console.log(users.getUsers(channel));
});

client.on('part', (channel, username, self) => {
    // console.log('part', channel, username);
    users.removeUser(channel, username);
    events.trigger('chat', 'part', {
        channel,
        username,
        self,
    });
    // console.log(users.getUsers(channel));
});

client.on('names', (channel, usernames) => {
    logger.info(['names', channel, usernames]);
    _.each(usernames, username => {
        users.addUser(channel, username);
        //TODO: Send event?
    });
    // console.log(users.getUsers(channel));
});

client.on('roomstate', (channel, state) => {
    logger.info(['roomstate', channel, state]);
    client.mods(channel);
});

client.on('subscription', (channel, username, method, message, userstate) => {
    // console.log('subscription', channel, username, method, message, userstate);
    events.trigger('chat', 'sub', {
        channel,
        username,
        method,
        message,
        userstate,
    });
});

client.on('resub', (channel, username, months, message, userstate, methods) => {
    // console.log('resub', channel, username, months, message, userstate, methods);
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
    logger.info(['notice', channel, msgid, message]);
});

client.on('mods', (channel, mods) => {
    logger.info(['mods event', channel, mods]);
    _.each(mods, username => {
        users.addMod(channel, username);
        //TODO: Add event?
    });
    // console.log(users.getMods(channel));
});

client.on('mod', (channel, username) => {
    // console.log('mod', channel, username);
    users.addMod(channel, username);
    events.trigger('chat', 'mod', {
        channel,
        username,
    });
    // console.log(users.getMods(channel));
});

client.on('unmod', (channel, username) => {
    // console.log('unmod', channel, username);
    users.removeMod(channel, username);
    events.trigger('chat', 'unmod', {
        channel,
        username,
    });
    // console.log(users.getMods(channel));
});

client.on('message', (channel, userstate, message, self) => {
    logger.info(['message', channel, userstate, message, self]);
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
    logger.info(['hosting', channel, target, viewers]);
});

client.on("unhost", function (channel, viewers) {
    logger.info(['unhost', channel, viewers]);
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

// Connect the client to the server..
// client.connect();

export default client;
