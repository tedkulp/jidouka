import { get } from 'lodash';

import { client } from '../../../src/client';
import events from '../../../src/events';
import { BlacklistEntryModel } from '../../../src/models/blacklistEntry';
import redis from '../../../src/servers/redis';
import { getSettings } from '../../../src/settings';

import {
    findModerationIssues,
    MAX_BLACKLISTED_WORDS_COUNT,
    MAX_CAPS_COUNT,
    MAX_EMOTE_COUNT,
    MAX_LENGTH,
    MAX_URL_COUNT,
    MAX_WARNING_THRESHOLD,
    MAX_WARNING_TIMEOUT,
    MODERATION_TRIGGER_LENGTH,
} from './utils';

/*
    Example message:

    "#n3rdstreettv", //channel
    { badges: { broadcaster: '1', subscriber: '0', premium: '1' }, // userstate
    color: '#B39619',
    'display-name': 'N3rdStreetTV',
    emotes: { '25': [ '0-4' ], '88': [ '19-26' ] },
    flags: null,
    id: '9591782e-5722-456d-b2b2-4ead30babcfc',
    mod: false,
    'room-id': '143989508',
    subscriber: true,
    'tmi-sent-ts': '1543070014569',
    turbo: false,
    'user-id': '143989508',
    'user-type': null,
    'emotes-raw': '25:0-4/88:19-26',
    'badges-raw': 'broadcaster/1,subscriber/0,premium/1',
    username: 'n3rdstreettv',
    'message-type': 'chat' },
    "Kappa Some Message PogChamp" // message
    -012345678901234567890123456
*/

const getBlacklistedEntries = async () => {
    const finder = BlacklistEntryModel.find({
        active: true,
    }) as any;

    return finder.cache(15 * 60);
};

const incomingMessage = async (details, _) => {
    // details -> { channel, userstate, message }

    // We can't timeout/delete broadcaster or mods, so don't bother
    if (
        get(details, 'userstate.mod', false) === true ||
        get(details, 'userstate.badges.broadcaster', 0) === 1
    ) {
        return;
    }

    const blacklistEntries = await getBlacklistedEntries();
    const settings = await getSettings({
        'moderation.maxBlacklistedWordsCount': MAX_BLACKLISTED_WORDS_COUNT,
        'moderation.maxCapsCount': MAX_CAPS_COUNT,
        'moderation.maxEmoteCount': MAX_EMOTE_COUNT,
        'moderation.maxMessageLength': MAX_LENGTH,
        'moderation.maxUrlCount': MAX_URL_COUNT,
        'moderation.maxWarningThreshold': MAX_WARNING_THRESHOLD,
        'moderation.triggerLength': MODERATION_TRIGGER_LENGTH,
    });
    const issues = findModerationIssues(details.message, details.userstate, settings, {
        blacklistEntries,
    });

    if (issues.length) {
        const userId = details.userstate['user-id'];
        const warningThreshold = await redis.getTimedCount(
            `warning_threshold:${userId}`,
            MAX_WARNING_TIMEOUT
        );
        const maxNum = settings['moderation.maxWarningThreshold'] || MAX_WARNING_THRESHOLD;

        // console.log('warningThreshold', warningThreshold, 'maxNum', maxNum);

        if (warningThreshold >= maxNum) {
            // Unfortunately, most clients still don't support this.  Give it a few
            // months for the major ones to catch up.  Chatty is in beta, there are
            // others.
            // The in meantime, 1 second timeout clears all chat history
            // client.deleteMessage(details.channel, details.userstate['id']);
            client.timeout(
                details.channel,
                details.userstate['username'],
                1,
                'Triggered moderation -- clearing chat'
            );
        } else {
            // Write a strongly worded message...
            client.say(
                details.channel,
                `@${details.userstate['username']}: You triggered moderation rule: "${issues.join(
                    ', '
                )}". This is warning ${warningThreshold} of ${maxNum}.`
            );
        }
    }
};

events.addListener('chat', 'message', incomingMessage);

export default {};
