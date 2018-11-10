import { app } from './servers/express';
import redis from './servers/redis';
import moment from 'moment';
import config from './config';
import axios from 'axios';
import logger from './logger';

const refreshBot = async () => {
    return axios.post('https://id.twitch.tv/oauth2/token', {}, {
        params: {
            client_id: config.getClientId(),
            client_secret: config.getClientSecret(),
            grant_type: 'client_credentials',
            scope: [
                'channel:moderate',
                'chat:edit',
                'chat:read',
                'whispers:read',
                'whispers:edit',
                'channel_editor',
                'channel_commercial',
                'clips:edit',
                'user:edit:broadcast',
                'user:read:broadcast',
            ].join(' '),
        }
    }).then(oauthResponse => {
        redis.set('bot:oauth:expires', moment().add(oauthResponse.data['expires_in'], 's').unix().toString());
        redis.set('bot:oauth:access_token', oauthResponse.data['access_token']);
    });
};

const refreshStreamer = async() => {
    return axios.post('https://id.twitch.tv/oauth2/token', {}, {
        params: {
            client_id: config.getClientId(),
            client_secret: config.getClientSecret(),
            refresh_token: await redis.getAsync('streamer:oauth:refresh_token'),
            grant_type: 'refresh_token',
        }
    }).then(oauthResponse => {
        redis.set('streamer:oauth:expires', moment().add(oauthResponse.data['expires_in'], 's').unix().toString());
        redis.set('streamer:oauth:access_token', oauthResponse.data['access_token']);
        redis.set('streamer:oauth:refresh_token', oauthResponse.data['refresh_token']);
    });
}

const oauthFollowUp = async (code: string) => {
    return axios.post('https://id.twitch.tv/oauth2/token', {}, {
        params: {
            client_id: config.getClientId(),
            client_secret: config.getClientSecret(),
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: `${config.getHostname()}/oauth`,
        }
    }).then(oauthResponse => {
        redis.set('streamer:oauth:expires', moment().add(oauthResponse.data['expires_in'], 's').unix().toString());
        redis.set('streamer:oauth:access_token', oauthResponse.data['access_token']);
        redis.set('streamer:oauth:refresh_token', oauthResponse.data['refresh_token']);
    });
};

const oauthRefresh = async () => {
    const EXPIRE_THRESHOLD = 3600; // One hour
    const CURRENT_TIME = moment().unix();
    const streamerExpiry = await redis.getAsync('streamer:oauth:expires');
    const botExpiry = await redis.getAsync('bot:oauth:expires');

    if (streamerExpiry && (CURRENT_TIME + EXPIRE_THRESHOLD) > streamerExpiry) {
        logger.info('REFRESHING STREAMER TOKEN!!!!!');
        await refreshStreamer();
    }

    if (botExpiry && (CURRENT_TIME + EXPIRE_THRESHOLD) > botExpiry) {
        logger.info('REFRESHING BOT TOKEN!!!!!');
        await refreshBot();
    }
};

app.getAsync('/oauth', async (req, res) => {
    if (req.query.state && req.query.state === config.getStateToken()) {
        try {
            await oauthFollowUp(req.query.code);
            res.status(301).redirect(config.getHostname() + '/settings/auth');
        } catch (e) {
            res.status(500).send(e);
        }
    } else {
        res.status(401).send('Invalid request');
    }
});

// TODO: Remove me!
app.getAsync('/oauth/refresh_bot', async (_, res) => {
    try {
        await refreshBot();
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
