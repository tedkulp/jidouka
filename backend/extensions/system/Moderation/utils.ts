import { flatten, get } from 'lodash';
import { IListEntry } from '../../../src/models/listEntry';

export const MODERATION_TRIGGER_LENGTH = 15;
export const MAX_EMOTE_COUNT = 15;
export const MAX_LENGTH = 300;
export const MAX_URL_COUNT = 0;
export const MAX_CAPS_COUNT = 15;
export const MAX_BLACKLISTED_WORDS_COUNT = 0;
export const MAX_WARNING_THRESHOLD = 3;
export const MAX_WARNING_TIMEOUT = 10 * 60;

// From: https://gist.github.com/dperini/729294
export const URL_REGEX = /(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?/gi;

export const countEmotes = (_, userstate) => {
    return ((userstate['emotes-raw'] && userstate['emotes-raw'].match(/\-/g)) || []).length;
};

const checkEmotes = (msg, userstate, settings) => {
    return countEmotes(msg, userstate) <= (settings['moderation.maxEmoteCount'] || MAX_EMOTE_COUNT);
};

export const countLength = (msg, _) => {
    return msg.trim().length;
};

const checkLength = (msg, userstate, settings) => {
    return countLength(msg, userstate) <= (settings['moderation.maxMessageLength'] || MAX_LENGTH);
};

export const countUrls = (msg, _) => {
    return get(msg.match(URL_REGEX), 'length', 0);
};

const checkUrls = (msg, userstate, settings) => {
    return countUrls(msg, userstate) <= (settings['moderation.maxUrlCount'] || MAX_URL_COUNT);
};

export const countCaps = (msg, _) => {
    // Do this instead of regex so that we're taking Unicode stuff into account
    return [...msg].filter(c => c === c.toUpperCase()).length;
};

const checkCaps = (msg, userstate, settings) => {
    return countCaps(msg, userstate) <= (settings['moderation.maxCapsCount'] || MAX_CAPS_COUNT);
};

export const countBlacklistedWords = (msg, _, blacklistedWords: IListEntry[] = []) => {
    const matches = blacklistedWords
        .map(e => {
            return msg.match(e.entryText);
        })
        .filter(e => !!e);
    return flatten(matches).length;
};

const checkBlacklistedWords = (msg, userstate, settings, options?) => {
    const blacklistedWords = (options && options.blacklistEntries) || [];
    return (
        countBlacklistedWords(msg, userstate, blacklistedWords) <=
        (settings['moderation.maxBlacklistedWordsCount'] || MAX_BLACKLISTED_WORDS_COUNT)
    );
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
    caps: {
        description: 'Too many caps',
        useTriggerLength: true,
        detectFn: checkCaps,
    },
};

export const findModerationIssues = (message, userstate, settings, options?) => {
    if (!message || !message.trim) {
        return [];
    }
    message = message.trim();
    const brokenRules = Object.keys(rules).map(ruleKeyName => {
        const rule = rules[ruleKeyName];
        if (
            !rule.useTriggerLength ||
            (message && message.length > settings['moderation.triggerLength'])
        ) {
            const result = rule.detectFn.call(rule, message, userstate, settings, options);
            if (!result) {
                return rule.description;
            }
        }
    });
    return brokenRules.filter(e => !!e);
};

export default {};
