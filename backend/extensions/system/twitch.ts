import axios from 'axios';
import moment from 'moment';
import { get } from 'lodash';

import commands, { ResponseList } from '../../src/commands';
import redis from '../../src/servers/redis';
import { UserModel } from '../../src/models/user';
import config from '../../src/config';
import logger from '../../src/logger';
import api from '../../src/api';

const formatSeconds = (totalSeconds) => {
    let result = '';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
    const seconds = totalSeconds - (hours * 3600) - (minutes * 60);

    if (hours > 0) {
        result = result + `${hours}h `;
    }

    if (minutes > 0) {
        result = result + `${minutes}m `;
    }

    result = result + `${seconds}s`;

    return result;
}

commands.register('!subs', async (args: string, details: any): Promise<string> => {
    // TODO: Check to see if they're partner/affiliate before bothering

    try {
        const clientId = config.getClientId();
        const twitchId = await redis.getAsync('streamer:twitch_id');
        const ouathToken = await redis.getAsync('streamer:oauth:access_token');

        const response = await axios.get(`https://api.twitch.tv/kraken/channels/${twitchId}/subscriptions`, {
            headers: {
                'Client-ID': clientId,
                'Authorization': `OAuth ${ouathToken}`,
                'Accept': 'application/vnd.twitchtv.v5+json',
            },
        });

        // state.setApiLimit(response.headers['ratelimit-limit'], response.headers['ratelimit-remaining'], response.headers['ratelimit-reset']);

        let count = get(response, 'data._total', 0);
        count = count ? (count - 1) : 0; // The streamer is in the list if there are any
        return `There are currently: ${count} subs.`;
    } catch (e) {
        logger.error(e); // TODO: Finalize API handling
        return 'There was an error getting the sub count.';
    }
});

commands.register('!followage', async (args: string, details: any): Promise<string> => {
    return 'Not implemented yet';
});

commands.register('!followers', async (args: string, details: any): Promise<string> => {
    const followCount = await api.getStreamerFollowCount();
    return `This stream currently has ${followCount} followers.`;
});

commands.register('!lastseen', async (args: string, details: any): Promise<ResponseList> => {
    const names = args.split(' ');
    const mapped = names.map(async (n) => {
        const foundUser = await UserModel.findOne({
            username: n,
        });
        return `Last seen ${n} at ${moment(foundUser.updatedAt).format('ddd, MMM D YYYY, h:mm a')}.`;
    });
    return Promise.all(mapped);
});

commands.register('!age', async (args: string, details: any): Promise<ResponseList | string> => {
    return 'Not implemented yet';
});

commands.register('!watched', async (args: string, details: any): Promise<ResponseList> => {
    const sentArgs = args.trim();
    let names = [];

    if (sentArgs !== '') {
        names = sentArgs.split(' ');
    } else {
        // Get sender of message
        const username = get(details, 'userstate.username', null);
        if (username) {
            names = [ username ];
        }
    }

    const mapped = names.map(async (n) => {
        const foundUser = await UserModel.findOne({
            username: n,
        });
        return `${n} has watched the stream for ${formatSeconds(get(foundUser, 'watchedTime', 0))}.`;
    });
    return Promise.all(mapped);
});

commands.register('!messages', async (args: string, details: any): Promise<ResponseList> => {
    const sentArgs = args.trim();
    let names = [];

    if (sentArgs !== '') {
        names = sentArgs.split(' ');
    } else {
        // Get sender of message
        const username = get(details, 'userstate.username', null);
        if (username) {
            names = [ username ];
        }
    }

    const mapped = names.map(async (n) => {
        const foundUser = await UserModel.findOne({
            username: n,
        });
        return `${n} has sent ${get(foundUser, 'numMessages', 0)} total messages.`;
    });
    return Promise.all(mapped);
});

commands.register('!me', async (args: string, details: any): Promise<string> => {
    return 'Not implemented yet';
});

export default {};
