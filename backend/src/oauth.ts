import { app } from './servers/express';
import redis from './servers/redis';
import moment from 'moment';
import config from './config';
import axios from 'axios';
import logger from './logger';
import api from './api';

const refreshClient = async () => {
    return axios.post('https://id.twitch.tv/oauth2/token', {}, {
        params: {
            client_id: config.getClientId(),
            client_secret: config.getClientSecret(),
            grant_type: 'client_credentials',
            scope: config.getBotScopes().join(' '),
        }
    }).then(oauthResponse => {
        redis.set('client:oauth:expires', moment().add(oauthResponse.data['expires_in'], 's').unix().toString());
        redis.set('client:oauth:access_token', oauthResponse.data['access_token']);
    });
};

const refreshUser = async (type: string) => {
    return axios.post('https://id.twitch.tv/oauth2/token', {}, {
        params: {
            client_id: config.getClientId(),
            client_secret: config.getClientSecret(),
            refresh_token: await redis.getAsync(`${type}:oauth:refresh_token`),
            grant_type: 'refresh_token',
        }
    }).then(async (oauthResponse) => {
        redis.set(`${type}:oauth:expires`, moment().add(oauthResponse.data['expires_in'], 's').unix().toString());
        redis.set(`${type}:oauth:access_token`, oauthResponse.data['access_token']);
        redis.set(`${type}:oauth:refresh_token`, oauthResponse.data['refresh_token']);

        const userDetails = await api.getUserDetailsFromToken(oauthResponse.data['access_token']);
        if (userDetails) {
            redis.set(`${type}:twitch_id`, userDetails['id']);
            redis.set(`${type}:username`, userDetails['login']);
            redis.set(`${type}:display_name`, userDetails['display_name']);
            redis.set(`${type}:broadcaster_type`, userDetails['broadcaster_type']);
        }
    });
}

const oauthFollowUp = async (type: string, code: string) => {
    return axios.post('https://id.twitch.tv/oauth2/token', {}, {
        params: {
            client_id: config.getClientId(),
            client_secret: config.getClientSecret(),
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: `${config.getHostname()}/oauth`,
        },
    }).then(async (oauthResponse) => {
        redis.set(`${type}:oauth:expires`, moment().add(oauthResponse.data['expires_in'], 's').unix().toString());
        redis.set(`${type}:oauth:access_token`, oauthResponse.data['access_token']);
        redis.set(`${type}:oauth:refresh_token`, oauthResponse.data['refresh_token']);

        const userDetails = await api.getUserDetailsFromToken(oauthResponse.data['access_token']);
        if (userDetails) {
            redis.set(`${type}:twitch_id`, userDetails['id']);
            redis.set(`${type}:username`, userDetails['login']);
            redis.set(`${type}:display_name`, userDetails['display_name']);
            redis.set(`${type}:broadcaster_type`, userDetails['broadcaster_type']);
        }
    });
};

const oauthRefresh = async () => {
    const EXPIRE_THRESHOLD = 3600; // One hour
    const CURRENT_TIME = moment().unix();
    const streamerExpiry = await redis.getAsync('streamer:oauth:expires');
    const botExpiry = await redis.getAsync('bot:oauth:expires');
    const clientExpiry = await redis.getAsync('client:oauth:expires');

    if (streamerExpiry && (CURRENT_TIME + EXPIRE_THRESHOLD) > streamerExpiry) {
        logger.info('REFRESHING STREAMER TOKEN!!!!!');
        await refreshUser('streamer');
    }

    if (botExpiry && (CURRENT_TIME + EXPIRE_THRESHOLD) > botExpiry) {
        logger.info('REFRESHING BOT TOKEN!!!!!');
        await refreshUser('bot');
    }

    if (clientExpiry && (CURRENT_TIME + EXPIRE_THRESHOLD) > clientExpiry) {
        logger.info('REFRESHING CLIENT TOKEN!!!!!');
        await refreshClient();
    }
};

app.getAsync('/oauth', async (req, res) => {
    if (req.query.state) {
        const [type, state] = req.query.state.split(':');
        if (state === config.getStateToken()) {
            try {
                await oauthFollowUp(type, req.query.code);
                res.status(301).redirect(config.getHostname() + '/settings/auth');
            } catch (e) {
                res.status(500).send(e);
            }
        } else {
            res.status(401).send('Invalid request');
        }
    } else {
        res.status(401).send('Invalid request');
    }
});

// TODO: Remove me! This should be checked on startup and refreshed
// if necessary.
app.getAsync('/oauth/refresh_bot', async (_, res) => {
    try {
        await refreshClient();
        res.send('OK');
    } catch (e) {
        res.status(500).send(e);
    }
});

export function init() {
    // Check every 10 min for oauth expiration
    oauthRefresh();
    setInterval(oauthRefresh, (1000 * 60 * 10));
};
