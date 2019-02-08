import { get } from 'lodash';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';

import api from '../../../src/api';
import commands, { ResponseList } from '../../../src/commands';
import logger from '../../../src/logger';
import { UserModel } from '../../../src/models/user';
import redis from '../../../src/servers/redis';

momentDurationFormatSetup(moment);

const formatSeconds = totalSeconds => {
    let result = '';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds - hours * 3600) / 60);
    const seconds = totalSeconds - hours * 3600 - minutes * 60;

    if (hours > 0) {
        result = result + `${hours}h `;
    }

    if (minutes > 0) {
        result = result + `${minutes}m `;
    }

    result = result + `${seconds}s`;

    return result;
};

const getUsersFromArgs = (args, details): string[] => {
    const sentArgs = args.trim();

    if (sentArgs !== '') {
        return sentArgs.split(' ');
    } else {
        // Get sender of message
        const username = get(details, 'userstate.username', null);
        if (username) {
            return [username];
        }
    }

    return [];
};

commands.register(
    '!subs',
    async (args: string, details: any): Promise<string> => {
        const broadcasterType = await redis.getAsync('bot:broadcaster_type');

        if (broadcasterType === 'affiliate' || broadcasterType === 'partner') {
            try {
                const subCount = await api.getSubCount();
                return `There are currently: ${subCount} subs.`;
            } catch (e) {
                logger.error(e); // TODO: Finalize API handling
                return 'There was an error getting the sub count.';
            }
        } else {
            return 'This channel can\'t have any subs.';
        }
    }
);

commands.register(
    '!followage',
    async (args: string, details: any): Promise<ResponseList> => {
        const now = moment();
        const names = getUsersFromArgs(args, details);

        const mapped = names.map(async n => {
            const foundUser = await api.getUserDetails(n);
            if (foundUser && foundUser['followDate']) {
                const followDate = moment(foundUser['followDate']);
                const duration = moment.duration(now.diff(followDate));
                return `${n} started following ${duration.format()} ago at ${moment(
                    foundUser.updatedAt
                ).format('ddd, MMM D YYYY, h:mm a')}.`;
            }

            return `${n} is not following the stream.`;
        });

        return Promise.all(mapped);
    }
);

commands.register(
    '!followers',
    async (args: string, details: any): Promise<string> => {
        const followCount = await api.getStreamerFollowCount();
        return `This stream currently has ${followCount} followers.`;
    }
);

commands.register(
    '!lastseen',
    async (args: string, details: any): Promise<ResponseList> => {
        const names = getUsersFromArgs(args, details);

        const mapped = names.map(async n => {
            const foundUser = await UserModel.findOne({
                username: n,
            });
            return `Last seen ${n} at ${moment(foundUser.updatedAt).format(
                'ddd, MMM D YYYY, h:mm a'
            )}.`;
        });
        return Promise.all(mapped);
    }
);

commands.register(
    '!age',
    async (args: string, details: any): Promise<ResponseList> => {
        const now = moment();
        const names = getUsersFromArgs(args, details);

        const mapped = names.map(async n => {
            const userId = await api.getUserId(n);
            if (userId) {
                const createDate = await api.getAccountCreateDate(userId);
                if (createDate) {
                    const createDateMoment = moment(createDate);
                    const duration = moment.duration(now.diff(createDateMoment));
                    return `${n} created their account ${duration.format()} ago at ${createDateMoment.format(
                        'ddd, MMM D YYYY, h:mm a'
                    )}.`;
                }
            }
            return `Count not get create date for ${n}`;
        });
        return Promise.all(mapped);
    }
);

commands.register(
    '!watched',
    async (args: string, details: any): Promise<ResponseList> => {
        const names = getUsersFromArgs(args, details);

        const mapped = names.map(async n => {
            const foundUser = await UserModel.findOne({
                username: n,
            });
            return `${n} has watched the stream for ${formatSeconds(
                get(foundUser, 'watchedTime', 0)
            )}.`;
        });
        return Promise.all(mapped);
    }
);

commands.register(
    '!messages',
    async (args: string, details: any): Promise<ResponseList> => {
        const names = getUsersFromArgs(args, details);

        const mapped = names.map(async n => {
            const foundUser = await UserModel.findOne({
                username: n,
            });
            return `${n} has sent ${get(foundUser, 'numMessages', 0)} total messages.`;
        });
        return Promise.all(mapped);
    }
);

commands.register(
    '!me',
    async (args: string, details: any): Promise<string> => {
        return 'Not implemented yet';
    }
);

export default {};
