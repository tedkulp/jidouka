import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { setup } from 'axios-cache-adapter';
import { assign, get } from 'lodash';
import moment from 'moment';

import config from './config';
import logger from './logger';
import { UserModel } from './models/user';
import redis from './servers/redis';
import state from './state';

const axiosCache = setup({
    cache: {
        maxAge: 5 * 1000,
        exclude: { query: false },
        key: req => req.url + JSON.stringify(req.params),
    },
}) as AxiosInstance;

const axiosMediumCache = setup({
    cache: {
        maxAge: 60 * 1000,
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
}

export enum RequestCacheType {
    NONE = 'NONE',
    SHORT = 'SHORT',
    MEDIUM = 'MEDIUM',
    LONG = 'LONG',
}

export const makeHelixRequest = async (
    requestConfig: AxiosRequestConfig,
    authType = RequestAuthType.CLIENT,
    cacheType = RequestCacheType.SHORT
) => {
    requestConfig = assign(
        {},
        {
            baseURL: 'https://api.twitch.tv/helix',
            headers: {},
        },
        requestConfig
    );

    switch (authType) {
        case RequestAuthType.CLIENT:
            requestConfig.headers['Client-ID'] = config.getClientId();
            break;
        case RequestAuthType.BOT_OAUTH:
            requestConfig.headers['Client-ID'] = config.getClientId();
            requestConfig.headers['Authorization'] = `Bearer ${await redis.getAsync(
                'bot:oauth:access_token'
            )}`;
            break;
        case RequestAuthType.STREAMER_OAUTH:
            requestConfig.headers['Client-ID'] = config.getClientId();
            requestConfig.headers['Authorization'] = `Bearer ${await redis.getAsync(
                'streamer:oauth:access_token'
            )}`;
            break;
    }

    let fn: AxiosInstance = axios;
    if (cacheType === RequestCacheType.SHORT) {
        fn = axiosCache;
    } else if (cacheType === RequestCacheType.MEDIUM) {
        fn = axiosMediumCache;
    } else if (cacheType === RequestCacheType.LONG) {
        fn = axiosLongCache;
    }

    const response = await fn(requestConfig);

    setApiLimits(authType, response);

    return response;
};

export const makeKrakenRequest = async (
    requestConfig: AxiosRequestConfig,
    authType = RequestAuthType.CLIENT,
    cacheType = RequestCacheType.SHORT
) => {
    requestConfig = assign(
        {},
        {
            baseURL: 'https://api.twitch.tv/kraken',
            headers: {},
        },
        requestConfig
    );

    requestConfig.headers['Accept'] = 'application/vnd.twitchtv.v5+json';

    switch (authType) {
        case RequestAuthType.CLIENT:
            requestConfig.headers['Client-ID'] = config.getClientId();
            break;
        case RequestAuthType.BOT_OAUTH:
            requestConfig.headers['Client-ID'] = config.getClientId();
            requestConfig.headers['Authorization'] = `OAuth ${await redis.getAsync(
                'bot:oauth:access_token'
            )}`;
            break;
        case RequestAuthType.STREAMER_OAUTH:
            requestConfig.headers['Client-ID'] = config.getClientId();
            requestConfig.headers['Authorization'] = `OAuth ${await redis.getAsync(
                'streamer:oauth:access_token'
            )}`;
            break;
    }

    let fn: AxiosInstance = axios;
    if (cacheType === RequestCacheType.SHORT) {
        fn = axiosCache;
    } else if (cacheType === RequestCacheType.MEDIUM) {
        fn = axiosMediumCache;
    } else if (cacheType === RequestCacheType.LONG) {
        fn = axiosLongCache;
    }

    const response = await fn(requestConfig);

    setApiLimits(authType, response);

    return response;
};

const setApiLimits = (authType, response) => {
    const h = response.headers;
    logger.silly('authType', authType);
    if (h['ratelimit-limit'] && h['ratelimit-remaining'] && h['ratelimit-reset']) {
        state.setApiLimit(
            authType,
            h['ratelimit-limit'],
            h['ratelimit-remaining'],
            h['ratelimit-reset']
        );
    }
};

export const getStreamData = async () => {
    const response = await makeHelixRequest({
        url: '/streams',
        params: {
            user_login: config.getStreamerName(),
            // user_login: 'relaxbeats',
        },
    });

    return get(response, 'data.data[0]', {});
};

export const getUserDetails = async (username?: string) => {
    const foundUser = await UserModel.findOne({
        username,
    });

    if (foundUser) {
        return foundUser;
    } else {
        // We have a newbie, folks!
        const apiUser = await getUserDetailsFromApi(username);
        if (apiUser) {
            // Check to see if they're following us already
            const followDate = await getFollowTime(apiUser['id']);

            // We has api data, create a model in the database
            // and then return it
            const modelData = {
                twitchId: apiUser['id'],
                username: apiUser['login'],
                displayName: apiUser['display_name'],
                watchedTime: 0,
                numMessages: 0,
                followDate: followDate && moment(followDate).toDate(), // Normalize date
            };

            let p;

            try {
                p = await UserModel.create(modelData);
            } catch (err) {
                if (err.code && err.code === 11000) {
                    logger.warn('Tried to insert duplicate user: ' + modelData.username);
                } else {
                    logger.error(err);
                }
            }

            return p;
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
    const response = await makeHelixRequest(
        {
            url: '/users',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
        RequestAuthType.NONE
    );

    return get(response, 'data.data[0]', null);
};

export const getUserId = async (username?: string) => {
    const details = await getUserDetails(username);
    if (details) {
        return details.twitchId;
    }

    return null;
};

const getFollowTime = async (fromId: number) => {
    const response = await makeHelixRequest({
        url: '/users/follows',
        params: {
            from_id: fromId.toString(),
            to_id: await redis.getAsync('streamer:twitch_id'),
        },
    });

    return get(response, 'data.0.followed_at', null);
};

const isFollowingStreamer = async (fromId: number) => {
    return (await getFollowTime(fromId)) !== null;
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

export const getGameInfo = async gameId => {
    const response = await makeHelixRequest(
        {
            url: '/games',
            params: {
                id: gameId,
            },
        },
        RequestAuthType.CLIENT,
        RequestCacheType.LONG
    );

    return get(response, 'data.data[0]', null);
};

export const getSubCount = async () => {
    const userId = await redis.getAsync('streamer:twitch_id');
    const response = await makeKrakenRequest(
        {
            url: `/channels/${userId}/subscriptions`,
        },
        RequestAuthType.STREAMER_OAUTH,
        RequestCacheType.MEDIUM
    );

    let count = get(response, 'data._total', 0);
    count = count ? count - 1 : 0; // The streamer is in the list if there are any
    return count;
};

export const getAccountCreateDate = async userId => {
    let response;

    try {
        response = await makeKrakenRequest(
            {
                url: `/users/${userId}`,
            },
            RequestAuthType.CLIENT,
            RequestCacheType.LONG
        );
    } catch (err) {
        console.error('err', err);
    }

    return get(response, 'data.created_at', null);
};

export default {
    RequestAuthType,
    getStreamData,
    getUserDetails,
    getUserDetailsFromToken,
    getUserDetailsFromApi,
    getUserId,
    getFollowTime,
    getSubCount,
    getStreamerFollowCount,
    isFollowingStreamer,
    getGameInfo,
    getAccountCreateDate,
};
