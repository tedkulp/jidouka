import Bluebird from 'bluebird';
import { get, flatten } from 'lodash';

import events from '../../src/events';
import redis from '../../src/servers/redis';
import { client } from '../../src/client';
import { IListEntry } from '../../src/models/listEntry';
import { BlacklistEntryModel } from '../../src/models/blacklistEntry';
import { getSetting } from '../../src/settings';

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

// TODO: Make this configurable
export const MODERATION_TRIGGER_LENGTH = 15;
export const MAX_EMOTE_COUNT = 15;
export const MAX_LENGTH = 300;
export const MAX_URL_COUNT = 0;
export const MAX_BLACKLISTED_WORDS_COUNT = 0;
export const MAX_WARNING_THRESHOLD = 3;
export const MAX_WARNING_TIMEOUT = 10 * 60;

// From: https://gist.github.com/dperini/729294
export const URL_REGEX = /(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?/ig;

export const countEmotes = (_, userstate) => {
    return (userstate['emotes-raw'] && userstate['emotes-raw'].match(/\-/g) || []).length;
};

const checkEmotes = async (msg, userstate) => {
    return countEmotes(msg, userstate) <= await getSetting('moderation.maxEmoteCount', MAX_EMOTE_COUNT);
};

export const countLength = (msg, _) => {
    return msg.trim().length;
};

const checkLength = async (msg, userstate) => {
    return countLength(msg, userstate) <= await getSetting('moderation.maxMessageLength', MAX_LENGTH);
};

export const countUrls = (msg, _) => {
    return get(msg.match(URL_REGEX), 'length', 0);
};

const checkUrls = async (msg, userstate) => {
    return countUrls(msg, userstate) <= await getSetting('moderation.maxUrlCount', MAX_URL_COUNT);
};

export const countBlacklistedWords = (msg, _, blacklistedWords: Array<IListEntry> = []) => {
    const matches = blacklistedWords.map(e => {
        return msg.match(e.entryText);
    }).filter(e => !!e);

    return flatten(matches).length;
};

const checkBlacklistedWords = async (msg, userstate, options?) => {
    const blacklistedWords = ((options && options.blacklistEntries) || []);
    return countBlacklistedWords(msg, userstate, blacklistedWords) <= await getSetting('moderation.maxBlacklistedWordsCount', MAX_BLACKLISTED_WORDS_COUNT);
};

const getBlacklistedEntries = async () => {
    const finder = BlacklistEntryModel.find({
            active: true,
        }) as any;

    return finder
        .cache(15 * 60);
};

const rules = {
    emotes: {
        description: 'Too many emotes',
        useTriggerLength: false,
        detectFn: checkEmotes,
    },
    blacklist: {
        description: 'Blacklisted word(s)',
        useTriggerLength: false,
        detectFn: checkBlacklistedWords,
    },
    urls: {
        description: 'URL(s)',
        useTriggerLength: false,
        detectFn: checkUrls,
    },
    length: {
        description: 'Message too long',
        useTriggerLength: false,
        detectFn: checkLength,
    },
}

export const findModerationIssues = async (message, userstate, options?) => {
    if (!message || !message.trim) {
        return [];
    }

    const triggerLength = await getSetting('moderation.triggerLength', MODERATION_TRIGGER_LENGTH);

    message = message.trim();

    const brokenRules = await Promise.all(Object.keys(rules).map(async (ruleKeyName) => {
        const rule = rules[ruleKeyName];
        if (!rule.useTriggerLength || message && message.length > triggerLength) {
            const result = await rule.detectFn.call(rule, message, userstate, options);
            if (!result)  {
                return rule.description;
            }
        }
    }));

    return brokenRules.filter(e => !!e);
};

const getCurrentWarningThreshold = async (userId) => {
    // Commence anti-pattern...
    const $d = Bluebird.defer<number>();

    const redisKeyName = `warning_threshold:${userId}`;

    redis
        .multi()
        .incr(redisKeyName)
        .expire(redisKeyName, MAX_WARNING_TIMEOUT)
        .exec((err, _) => {
            if (err) {
                return $d.reject(err);
            }

            redis.getAsync(redisKeyName).then(res => {
                return $d.resolve(parseInt(res));
            });
        });

    return $d.promise;
};

const incomingMessage = async (details, _) => {
    // details -> { channel, userstate, message }

    // We can't timeout/delete broadcaster or mods, so don't bother
    if (get(details, 'userstate.mod', false) === true || get(details, 'userstate.badges.broadcaster', 0) === 1) {
        return;
    }

    const blacklistEntries = await getBlacklistedEntries();
    const issues = await findModerationIssues(details.message, details.userstate, {
        blacklistEntries,
    });

    if (issues.length) {
        const warningThreshold = await getCurrentWarningThreshold(details.userstate['user-id']);
        const maxNum = await getSetting('moderation.maxWarningThreshold', MAX_WARNING_THRESHOLD);

        // console.log('warningThreshold', warningThreshold, 'maxNum', maxNum);

        if (warningThreshold >= maxNum) {
            // Unfortunately, most clients still don't support this.  Give it a few
            // months for the major ones to catch up.  Chatty is in beta, there are
            // others.
            // The in meantime, 1 second timeout clears all chat history
            // client.deleteMessage(details.channel, details.userstate['id']);
            client.timeout(details.channel, details.userstate['username'], 1, 'Triggered moderation -- clearing chat');
        } else {
            // Write a strongly worded message...
            client.say(details.channel, `@${details.userstate['username']}: You triggered moderation rule: "${issues.join(', ')}". This is warning ${warningThreshold} of ${maxNum}.`);
        }
    }
};

events.addListener('chat', 'message', incomingMessage);

export default {};
