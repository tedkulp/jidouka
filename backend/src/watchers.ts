import { hash, Map, Set } from 'immutable';
import _ from 'lodash';
import moment from 'moment';
import { setTimeout } from 'timers';

import api from './api';
import config from './config';
import events from './events';
import logger from './logger';
import { UserModel } from './models/user';
import state from './state';

let watchers: Map<string, Set<Watcher>> = Map();
let timeouts: Map<symbol, NodeJS.Timeout> = Map();

const WATCH_TIMEOUT_TIME = 60 * 1000;
const WATCH_TIMEOUT_KEY = Symbol('watchTime');

export class Watcher {
    public id?: number;
    public username: string;
    public startTime: moment.Moment;
    public lastReconciliationTime: moment.Moment;
    public mod: boolean;

    constructor(username: string, id?: number, isMod: boolean = false) {
        this.username = username;
        this.mod = isMod;
        this.startTime = moment();
        this.lastReconciliationTime = moment();

        if (id) {
            this.id = id;
        }
    }

    public equals(v: Watcher): boolean {
        return this.username === v.username;
    }

    public hashCode(): number {
        return hash(this.username);
    }
}

const addWatcher = async (channel: string, username: string, isMod: boolean = false) => {
    // console.log('addWatcher', channel, username, isMod);

    if (!watchers.has(channel)) {
        watchers = watchers.set(channel, Set());
    }

    const user = watchers.get(channel).find(u => u.username === username);
    if (user) {
        return;
    }

    // Add the user immediately, then do the userid lookup
    // Because this can get called for the same user a lot of times
    // fairly quickly
    const watcher = new Watcher(username, null, isMod);
    watchers = watchers.set(channel, watchers.get(channel).add(watcher));

    watcher.id = await api.getUserId(username);

    logger.debug('watchers', watchers.get(channel).map(w => `${w.username}(${w.mod})`));
};

const removeWatcher = (channel: string, username: string): void => {
    if (!watchers.has(channel)) {
        watchers = watchers.set(channel, Set());
        return;
    }

    const user = watchers.get(channel).find(u => u.username === username);
    if (user) {
        // TODO: Make sure to update time in database if they
        // left
        watchers = watchers.set(channel, watchers.get(channel).remove(user));
    }

    // logger.debug(watchers.get(channel).toJSON());
};

const getWatchers = (channel: string): Watcher[] => {
    if (!watchers.has(channel)) {
        watchers = watchers.set(channel, Set());
    }

    return watchers.get(channel).toArray();
};

const addMod = async (channel: string, username: string) => {
    // console.log('addMod', channel, username);
    if (!watchers.has(channel)) {
        watchers = watchers.set(channel, Set());
    }

    const user = watchers.get(channel).find(u => u.username === username);
    if (user) {
        user.mod = true;
    } else {
        await addWatcher(channel, username, true);
    }

    // logger.debug(watchers.get(channel).toJSON());
};

const removeMod = (channel: string, username: string): void => {
    if (!watchers.has(channel)) {
        watchers = watchers.set(channel, Set());
    }

    const user = watchers.get(channel).find(u => u.username === username);
    if (user) {
        user.mod = false;
    }

    // logger.debug(watchers.get(channel).toJSON());
};

const getMods = (channel: string): Watcher[] => {
    if (!watchers.has(channel)) {
        watchers = watchers.set(channel, Set());
    }

    return watchers
        .get(channel)
        .filter(u => u.mod)
        .toArray();
};

const updateWatchedTime = async (noOnlineCheck: boolean = false, resetTimeout: boolean = true) => {
    logger.silly('updateWatchedTime');

    if (state.isOnline() || noOnlineCheck) {
        watchers.forEach(channel => {
            channel.forEach(watcher => {
                const timeToUpdate = moment().diff(watcher.lastReconciliationTime);
                watcher.lastReconciliationTime = moment();

                UserModel.updateOne(
                    {
                        username: watcher.username
                    },
                    {
                        $inc: {
                            watchedTime: Math.round(timeToUpdate / 1000)
                        }
                    }
                ).exec();
            });
        });
    }

    if (resetTimeout) {
        timeouts = timeouts.set(
            WATCH_TIMEOUT_KEY,
            setTimeout(updateWatchedTime, WATCH_TIMEOUT_TIME)
        );
    }
};

const updateMessageCount = userstate => {
    logger.silly('updateMessageCount');

    UserModel.updateOne(
        {
            username: userstate.username
        },
        {
            $inc: {
                numMessages: 1
            }
        }
    ).exec();
};

timeouts = timeouts.set(WATCH_TIMEOUT_KEY, setTimeout(updateWatchedTime, WATCH_TIMEOUT_TIME));

const resetReconciliationTime = channel => {
    const found = watchers.find((_v, k) => k === channel);
    if (found) {
        found.forEach(u => (u.lastReconciliationTime = moment()));
    }
};

events.addListener('webhook', 'offline', data => {
    logger.debug('webhook.offline', data);

    // TODO: Do we need multiple channels?

    // Dump all the current times out to the database
    // and make sure don't track anymore
    updateWatchedTime(true, false);
    resetReconciliationTime(config.getStreamerName());
});

events.addListener('webhook', 'online', data => {
    logger.debug('webhook.online', data);

    resetReconciliationTime(config.getStreamerName());
});

events.addListener('chat', 'message', (details: object, _msg) => {
    updateMessageCount(details['userstate']);
});

export default {
    addWatcher,
    removeWatcher,
    getWatchers,
    addMod,
    removeMod,
    getMods
};
