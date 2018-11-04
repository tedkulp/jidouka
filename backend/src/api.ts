import moment from 'moment';
import { setup } from 'axios-cache-adapter';
import { get } from 'lodash';

import log from './logger';
import state from './state';
import config from './config';
import { UserModel } from './models/user';
import logger from './logger';

const axios = setup({
    cache: {
        maxAge: 5 * 1000,
        exclude: { query: false },
        key: req => req.url + JSON.stringify(req.params),
    },
});

const getStreamData = async () => {
    try {
        const response = await axios.get('https://api.twitch.tv/helix/streams', {
            headers: {
                'Client-ID': config.getClientId(),
            },
            params: {
                user_login: config.getStreamerName(),
            },
        });

        log.debug(['response from cache', response.request.fromCache ? 'true' : 'false']);

        state.setApiLimit(response.headers['ratelimit-limit'], response.headers['ratelimit-remaining'], response.headers['ratelimit-reset']);

        return get(response, 'data.data[0]', []);
    } catch (e) {
        log.error(e); // TODO: Finalize API handling
    }

    return [];
}

const getOnlineStatus = async () : Promise<boolean> => {
    const data = await getStreamData();
    if (data && data.type === 'live') {
        return true;
    }

    return false;
};

const getOnlineStartTime = async () : Promise<moment.Moment | null> => {
    const data = await getStreamData();
    if (data && data.started_at) {
        return moment(data.started_at);
    }

    return null;
};

const getUserDetails = async (username?: string) => {
    // TODO: Look it up in the database first
    let foundUser = await UserModel.findOne({
        'username': username
    });
    logger.info(['foundUser', foundUser]);

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

const getUserDetailsFromApi = async (username?: string) => {
    try {
        const response = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': config.getClientId(),
            },
            params: {
                login: username || config.getStreamerName(),
            },
        });

        log.debug(['response from cache', response.request.fromCache ? 'true' : 'false']);

        state.setApiLimit(response.headers['ratelimit-limit'], response.headers['ratelimit-remaining'], response.headers['ratelimit-reset']);

        return get(response, 'data.data[0]', null);
    } catch (e) {
        log.error(e); // TODO: Finalize API handling
    }

    return null;
};

const getUserId = async (username?: string) => {
    const details = await getUserDetails(username);
    if (details) {
        return details.twitchId;
    }

    return null;
};

export default {
    getStreamData,
    getOnlineStatus,
    getOnlineStartTime,
    getUserDetails,
    getUserId,
};
