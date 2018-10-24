/* eslint-disable no-console */

import { Set } from 'immutable';

const users: any = {};
const mods: any = {};

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
        users[channel] = Set();
    }

    users[channel] = users[channel].add(username);
};

const removeUser = (channel: string, username: string): void => {
    if (!users[channel]) {
        users[channel] = Set();
        return;
    }

    users[channel] = users[channel].remove(username);
};

const getUsers = (channel: string): Array<string> => {
    if (!users[channel]) {
        users[channel] = Set();
    }

    return users[channel].toArray();
};

const addMod = (channel: string, modname: string): void => {
    if (!mods[channel]) {
        mods[channel] = Set();
    }

    mods[channel] = mods[channel].add(modname);
};

const removeMod = (channel: string, modname: string): void => {
    if (!mods[channel]) {
        mods[channel] = Set();
        return;
    }

    mods[channel] = mods[channel].remove(modname);
};

const getMods = (channel: string): Array<string> => {
    if (!mods[channel]) {
        mods[channel] = Set();
    }

    return mods[channel].toArray();
};

export default {
    addUser,
    removeUser,
    getUsers,
    addMod,
    removeMod,
    getMods,
};
