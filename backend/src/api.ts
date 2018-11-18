import { setup } from 'axios-cache-adapter';
import { get, assign } from 'lodash';

import state from './state';
import config from './config';
import { UserModel } from './models/user';
import redis from './servers/redis';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const axiosCache = setup({
    cache: {
        maxAge: 5 * 1000,
        exclude: { query: false },
        key: req => req.url + JSON.stringify(req.params),
    },
}) as AxiosInstance;

const axiosLongCache = setup({
    cache: {
        exclude: { query: false },
        key: req => req.url + JSON.stringify(req.params),
    },
}) as AxiosInstance;

export enum RequestAuthType {
    NONE = 'NONE',
    CLIENT = 'CLIENT',
    BOT_OAUTH = 'BOT_OAUTH',
    STREAMER_OAUTH = 'STREAMER_OAUTH',
};

export enum RequestCacheType {
    NONE = 'NONE',
    SHORT = 'SHORT',
    LONG = 'LONG',
};

export const makeHelixRequest = async (requestConfig: AxiosRequestConfig, authType = RequestAuthType.CLIENT, cacheType = RequestCacheType.SHORT) => {
    requestConfig = assign({}, {
        baseURL: 'https://api.twitch.tv/helix',
        headers: {},
    }, requestConfig);

    switch (authType) {
        case RequestAuthType.CLIENT:
            requestConfig.headers['Client-ID'] = config.getClientId();
            break;
        case RequestAuthType.BOT_OAUTH:
            requestConfig.headers['Client-ID'] = config.getClientId();
            requestConfig.headers['Authorization'] = `Bearer ${await redis.get('bot:oauth:access_token')}`;
            break;
        case RequestAuthType.STREAMER_OAUTH:
            requestConfig.headers['Client-ID'] = config.getClientId();
            requestConfig.headers['Authorization'] = `Bearer ${await redis.get('streamer:oauth:access_token')}`;
            break;
    };

    let fn: Function = axios;
    if (cacheType == RequestCacheType.SHORT) {
        fn = axiosCache;
    } else if (cacheType == RequestCacheType.LONG) {
        fn = axiosLongCache;
    }

    const response = await fn(requestConfig);

    setApiLimits(authType, response);

    return response;
};

export const makeKrakenRequest = async (requestConfig: AxiosRequestConfig, authType = RequestAuthType.CLIENT, cacheType = RequestCacheType.SHORT) => {
    requestConfig = assign({}, {
        baseURL: 'https://api.twitch.tv/kraken',
        headers: {},
    }, requestConfig);

    switch (authType) {
        case RequestAuthType.CLIENT:
            requestConfig.headers['Client-ID'] = config.getClientId();
            break;
        case RequestAuthType.BOT_OAUTH:
            requestConfig.headers['Client-ID'] = config.getClientId();
            requestConfig.headers['Authorization'] = `OAuth ${await redis.get('bot:oauth:access_token')}`;
            break;
        case RequestAuthType.STREAMER_OAUTH:
            requestConfig.headers['Client-ID'] = config.getClientId();
            requestConfig.headers['Authorization'] = `OAuth ${await redis.get('streamer:oauth:access_token')}`;
            break;
    };

    let fn: Function = axios;
    if (cacheType == RequestCacheType.SHORT) {
        fn = axiosCache;
    } else if (cacheType == RequestCacheType.LONG) {
        fn = axiosLongCache;
    }

    const response = await fn(requestConfig);

    setApiLimits(authType, response);

    return response;
};

const setApiLimits = (authType, response) => {
    const h = response.headers;
    console.log('authType', authType);
    if (h['ratelimit-limit'] && h['ratelimit-remaining'] && h['ratelimit-reset']) {
        state.setApiLimit(authType, h['ratelimit-limit'], h['ratelimit-remaining'], h['ratelimit-reset']);
    }
}

export const getStreamData = async () => {
    const response = await makeHelixRequest({
        url: '/streams',
        params: {
            user_login: config.getStreamerName(),
        },
    });

    return get(response, 'data.data[0]', {});
}

export const getUserDetails = async (username?: string) => {
    let foundUser = await UserModel.findOne({
        'username': username
    });

    if (foundUser) {
        return foundUser;
    } else {
        // We have a newbie, folks!
        const apiUser = await getUserDetailsFromApi(username);
        if (apiUser) {
            // We has api data, create a model in the database
            // and then return it
            return UserModel.create({
                twitchId: apiUser['id'],
                username: apiUser['login'],
                displayName: apiUser['display_name'],
                watchedTime: 0,
                numMessages: 0,
            });
        }
    }

    return null;
};

export const getUserDetailsFromApi = async (username?: string) => {
    const response = await makeHelixRequest({
        url: '/users',
        params: {
            login: username || config.getStreamerName(),
        },
    });

    return get(response, 'data.data[0]', null);
};

export const getUserDetailsFromToken = async (token: string) => {
    const response = await makeHelixRequest({
        url: '/users',
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    }, RequestAuthType.NONE);

    return get(response, 'data.data[0]', null);
}

export const getUserId = async (username?: string) => {
    const details = await getUserDetails(username);
    if (details) {
        return details.twitchId;
    }

    return null;
};

const getStreamerFollowsData = async () => {
    const response = await makeHelixRequest({
        url: '/users/follows',
        params: {
            to_id: await redis.getAsync('streamer:twitch_id'),
        },
    });

    return get(response, 'data', null);
};

export const getStreamerFollowCount = async () => {
    const followData = await getStreamerFollowsData();
    return get(followData, 'total', 0);
};

export const getGameInfo = async (gameId) => {
    const response = await makeHelixRequest({
        url: '/games',
        params: {
            id: gameId,
        },
    }, RequestAuthType.CLIENT, RequestCacheType.LONG);

    return get(response, 'data.data[0]', null);
}

export default {
    RequestAuthType,
    getStreamData,
    getUserDetails,
    getUserDetailsFromToken,
    getUserId,
    getStreamerFollowCount,
    getGameInfo,
};
