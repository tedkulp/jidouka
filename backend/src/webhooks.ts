import _ from 'lodash';
import axios from 'axios';
import crypto from 'crypto';
import { Express, Request, Response } from 'express';
import api from './api';
import events from './events';
import logger from './logger';
import config from './config';

const USERNAME = config.getStreamerName();
const CLIENT_ID = config.getClientId();
const URL_BASE = config.getHostname() || 'http://localhost'; // No slash at end
const SECRET = process.env.SECRET || '123456';

const helixApi = axios.create({
    baseURL: 'https://api.twitch.tv/helix/',
    headers: {
        'Client-ID': CLIENT_ID,
        'Content-type': 'application/json',
    },
})

events.register('webhook', 'follow', 'User followed the channel');
events.register('webhook', 'online', 'Channel has gone online');
events.register('webhook', 'offline', 'Channel has gone offline');

const getTopicUrls = userId => {
    return {
        online: `https://api.twitch.tv/helix/streams?user_id=${userId}`,
        follow: `https://api.twitch.tv/helix/users/follows?first=1&to_id=${userId}`,
    };
};

const webhookGet = (req: Request, res: Response) => {
    if (req.query['hub.challenge'] && (req.query['hub.mode'] === 'subscribe' || req.query['hub.mode'] === 'unsubscribe')) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.status(400).send('ERROR: Invalid request!');
    }
};

const webhookPost = async (req: Request, res: Response) => {
    const userId = await api.getUserId(USERNAME);
    const topicUrls = getTopicUrls(userId);

    const signature = req.header('X-Hub-Signature').split('=')[1];
    const followLink = req.header('Link') && req.header('Link').includes(topicUrls['follow']);
    const onlineLink = req.header('Link') && req.header('Link').includes(topicUrls['online']);
    const sigValid = crypto.createHmac('sha256', SECRET).update(req['rawBody']).digest('hex') === signature;
    const body = req.body;

    if ((followLink || onlineLink) && sigValid) {
        const dataBlob = _.get(body, 'data.0');

        if (followLink) {
            events.trigger('webhook', 'follow', dataBlob);
        }

        if (onlineLink) {
            if (dataBlob) {
                events.trigger('webhook', 'online', dataBlob);
            } else {
                events.trigger('webhook', 'offline');
            }
        }

        res.status(200).json({});
    } else {
        logger.error(['failed', body])
        res.status(400).json({
            error: 'ERROR: Invalid request!',
        });
    }
};

const subscribe = async () => {
    const userId = await api.getUserId(USERNAME);
    const topicUrls = getTopicUrls(userId);

    _.values(topicUrls).forEach(async url => {
        try {
            await helixApi.post('webhooks/hub', {
                'hub.mode': "subscribe",
                'hub.callback': `${URL_BASE}/webhooks`,
                'hub.topic': url,
                'hub.lease_seconds': 864000,
                'hub.secret': SECRET,
            });
        } catch (e) {
            logger.error(['error subbing', e.response]);
        }
    });
};

const unsubscribe = async () => {
    console.log('in unsubscribe');
    const userId = await api.getUserId(USERNAME);
    const topicUrls = getTopicUrls(userId);

    _.values(topicUrls).forEach(async (url) => {
        try {
            console.log('Unsubbing: ' + url);
            await helixApi.post('webhooks/hub', {
                'hub.mode': "unsubscribe",
                'hub.callback': `${URL_BASE}/webhooks`,
                'hub.topic': url,
                'hub.lease_seconds': 864000,
                'hub.secret': SECRET,
            });
        } catch (e) {
            logger.error(['error unsubbing', e.response]);
        }
    });
};

const init = async app => {
    app.get('/webhooks', webhookGet);
    app.postAsync('/webhooks', webhookPost);

    subscribe();

    // If we're up for a week, then resubscribe our
    // webhooks (they're good for 10 days)
    setInterval(subscribe, (1000 * 60 * 60 * 24 * 7));
};

export default {
    subscribe,
    unsubscribe,
    init,
};
