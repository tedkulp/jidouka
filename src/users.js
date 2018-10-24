// @flow
/* eslint-disable no-console */

const immutable: any = require('immutable');

const users = {};
const mods = {};

// class User {
//     username: string;
//     addTime: Date;
//     equals(v: User): boolean {
//         return this.username === v.username;
//     }
//     hashCode(): number {
//         return immutable.hash(this.username);
//     }
// }

const addUser = (channel: string, username: string): void => {
    if (!users[channel]) {
        users[channel] = immutable.Set();
    }

    users[channel] = users[channel].add(username);
};

const removeUser = (channel: string, username: string): void => {
    if (!users[channel]) {
        users[channel] = immutable.Set();
        return;
    }

    users[channel] = users[channel].remove(username);
};

const getUsers = (channel: string): Array<string> => {
    if (!users[channel]) {
        users[channel] = immutable.Set();
    }

    return users[channel].toArray();
};

const addMod = (channel: string, modname: string): void => {
    if (!mods[channel]) {
        mods[channel] = immutable.Set();
    }

    mods[channel] = mods[channel].add(modname);
};

const removeMod = (channel: string, modname: string): void => {
    if (!mods[channel]) {
        mods[channel] = immutable.Set();
        return;
    }

    mods[channel] = mods[channel].remove(modname);
};

const getMods = (channel: string): Array<string> => {
    if (!mods[channel]) {
        mods[channel] = immutable.Set();
    }

    return mods[channel].toArray();
};

module.exports = {
    addUser,
    removeUser,
    getUsers,
    addMod,
    removeMod,
    getMods,
};
