import axios from 'axios';
import moment from 'moment';
import { get } from 'lodash';

import commands, { ResponseList } from '../../src/commands';
import redis from '../../src/servers/redis';
import { UserModel } from '../../src/models/user';
import config from '../../src/config';
import logger from '../../src/logger';

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
    return '';
});

commands.register('!followers', async (args: string, details: any): Promise<string> => {
    return '';
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

commands.register('!age', async (args: string, details: any): Promise<string> => {
    return '';
});

commands.register('!watched', async (args: string, details: any): Promise<string> => {
    return '';
});

commands.register('!messages', async (args: string, details: any): Promise<string> => {
    return '';
});

commands.register('!me', async (args: string, details: any): Promise<string> => {
    return '';
});

export default {};
