import { app } from './servers/express';
import redis from './servers/redis';
import moment from 'moment';
import config from './config';
import axios from 'axios';

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

app.getAsync('/oauth', async (req, res) => {
    try {
        console.log(req.query.code);
        await oauthFollowUp(req.query.code);
        res.send('OK');
    } catch (e) {
        res.status(500).send(e);
    }
});

app.getAsync('/oauth/refresh_bot', async (_, res) => {
    try {
        await refreshBot();
        res.send('OK');
    } catch (e) {
        res.status(500).send(e);
    }
});

export function init() {
    // no op?
};
