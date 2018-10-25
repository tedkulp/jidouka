import moment from 'moment';
import { setup } from 'axios-cache-adapter';
import { get } from 'lodash';

import log from './logger';
import state from './state';
import config from '../config/config.json';

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
                'Client-ID': config.options.clientId,
            },
            params: {
                user_login: config.identity.host,
            },
        });

        log.trace(response.request.fromCache ? 'true' : 'false', 'response from cache');

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

const getUserId = async (username?: string) => {
    // TODO: Look it up in the database first
    try {
        const response = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': config.options.clientId,
            },
            params: {
                login: username || config.identity.host,
            },
        });

        log.trace(response.request.fromCache ? 'true' : 'false', 'response from cache');

        state.setApiLimit(response.headers['ratelimit-limit'], response.headers['ratelimit-remaining'], response.headers['ratelimit-reset']);

        return get(response, 'data.data[0].id', null);
    } catch (e) {
        log.error(e); // TODO: Finalize API handling
    }

    return null;
};

export default {
    getStreamData,
    getOnlineStatus,
    getOnlineStartTime,
    getUserId,
};
