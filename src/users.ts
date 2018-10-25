import { Set, Map, hash } from 'immutable';

let users: Map<string, Set<string>> = Map();
let mods: Map<string, Set<string>> = Map();

class User {
    username: string;
    addTime: Date;
    equals(v: User): boolean {
        return this.username === v.username;
    }
    hashCode(): number {
        return hash(this.username);
    }
}

const addUser = (channel: string, username: string): void => {
    if (!users.has(channel)) {
        users = users.set(channel, Set());
    }

    users = users.set(channel, users.get(channel).add(username));
};

const removeUser = (channel: string, username: string): void => {
    if (!users.has(channel)) {
        users = users.set(channel, Set());
        return;
    }

    users = users.set(channel, users.get(channel).remove(username));
};

const getUsers = (channel: string): Array<string> => {
    if (!users.has(channel)) {
        users = users.set(channel, Set());
    }

    return users.get(channel).toArray();
};

const addMod = (channel: string, modname: string): void => {
    if (!mods.has(channel)) {
        mods = mods.set(channel, Set());
    }

    mods = mods.set(channel, mods.get(channel).add(modname));
};

const removeMod = (channel: string, modname: string): void => {
    if (!mods.has(channel)) {
        mods = mods.set(channel, Set());
        return;
    }

    mods = mods.set(channel, mods.get(channel).remove(modname));
};

const getMods = (channel: string): Array<string> => {
    if (!mods.has(channel)) {
        mods = mods.set(channel, Set());
    }

    return mods.get(channel).toArray();
};

export default {
    addUser,
    removeUser,
    getUsers,
    addMod,
    removeMod,
    getMods,
};
