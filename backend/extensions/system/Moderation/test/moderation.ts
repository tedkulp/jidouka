import { expect } from 'chai';
import { chunk } from 'lodash';
import loremIpsum from 'lorem-ipsum';
import 'mocha';

import { IListEntry } from '../../../../src/models/listEntry';
import { countBlacklistedWords, countEmotes, findModerationIssues } from '../utils';

describe('moderation', () => {
    // emotes: {randId: [0, 3, 6, 15], anotherId: ...} // some id, start and end pos
    const settings = {};

    const createUserState = (emotes?) => {
        const rawEmotes = [];
        const emoteObj = {};

        if (emotes) {
            Object.keys(emotes).forEach(k => {
                const v = emotes[k];

                if (v.length) {
                    const pairs = chunk(v, 2).map(pair => {
                        return pair.join('-');
                    });

                    emoteObj[k] = pairs;
                    rawEmotes.push(k + ':' + pairs.join(','));
                }
            });
        }

        return {
            badges: {
                broadcaster: '1',
                subscriber: '0',
                premium: '1',
            },
            color: '#B39619',
            'display-name': 'N3rdStreetTV',
            emotes: emoteObj,
            flags: null,
            id: '9591782e-5722-456d-b2b2-4ead30babcfc',
            mod: false,
            'room-id': '143989508',
            subscriber: true,
            'tmi-sent-ts': '1543070014569',
            turbo: false,
            'user-id': '143989508',
            'user-type': null,
            'emotes-raw': rawEmotes.join('/'),
            'badges-raw': 'broadcaster/1,subscriber/0,premium/1',
            username: 'n3rdstreettv',
            'message-type': 'chat',
        };
    };

    describe('plain old messages', () => {
        it('allow a normal message to go through', async () => {
            const message = loremIpsum();
            const userState = createUserState();
            const issues = await findModerationIssues(message, userState, settings);
            expect(issues.length).to.eq(0);
        });
    });

    describe('long messages', () => {
        it(`it doesn't allow messages over 300 characters`, async () => {
            const message = loremIpsum({
                count: 100,
            });
            const userState = createUserState();
            const issues = await findModerationIssues(message, userState, settings);
            expect(issues.length).to.eq(1);
        });
    });

    describe('links', () => {
        it(`it doesn't allow links in messages`, async () => {
            const message = 'This is a message with a link https://twitch.tv/n3rdstreettv in it';
            const userState = createUserState();
            const issues = await findModerationIssues(message, userState, settings);
            expect(issues.length).to.eq(1);
        });

        it('it understands multiple links', async () => {
            const message =
                'This is a message with a link https://twitch.tv/n3rdstreettv and https://twitter.com/n3rdstreettv in it';
            const userState = createUserState();
            const issues = await findModerationIssues(message, userState, settings);
            expect(issues.length).to.eq(1);
        });
    });

    describe('blacklist', () => {
        const blacklistEntries: IListEntry[] = [
            {
                entryText: 'blacklist',
                createdByUser: 'test user',
                active: true,
                updatedAt: new Date(),
                createdAt: new Date(),
            },
            {
                entryText: 'cheeseball',
                createdByUser: 'test user',
                active: true,
                updatedAt: new Date(),
                createdAt: new Date(),
            },
        ];

        it(`doesn't false positive`, async () => {
            const message = 'There are no flagged words in this message';
            const userState = createUserState();
            const issues = await findModerationIssues(message, userState, blacklistEntries);
            expect(issues.length).to.eq(0);
        });

        it('counts blacklisted words correctly', () => {
            const message = 'The word blacklist is on the list';
            const userState = createUserState();
            expect(countBlacklistedWords(message, userState, blacklistEntries)).to.eq(1);

            const message2 = 'The word blacklist is on the list as is cheeseball';
            const userState2 = createUserState();
            expect(countBlacklistedWords(message2, userState2, blacklistEntries)).to.eq(2);
        });

        it('works with findModerationIssues', async () => {
            const message = 'The word blacklist is on the list';
            const userState = createUserState();
            const issues = await findModerationIssues(message, userState, settings, {
                blacklistEntries,
            });
            expect(issues.length).to.eq(1);
        });
    });

    describe('emotes', () => {
        describe('checkEmotes', () => {
            it('counts correctly', () => {
                const message = 'The best Kappa Kappa message';
                const userState = createUserState({ 1: [9, 13, 15, 19], 2: [0, 2] });
                expect(countEmotes(message, userState)).to.eq(3);
            });
            it('including nothing', () => {
                const message = 'This is a message';
                const userState = createUserState();
                expect(countEmotes(message, userState)).to.eq(0);
            });
            it('including nothing', () => {
                const message = 'This is a message';
                const userState = createUserState();
                expect(countEmotes(message, userState)).to.eq(0);
            });
            it('including and nulls', () => {
                const message = 'This is a message';
                const userState = createUserState();
                userState['emotes-raw'] = null;
                expect(countEmotes(message, userState)).to.eq(0);
            });
        });

        it('allows messages under the limit to go through', async () => {
            const message = 'This is a Kappa Kappa message';
            const userState = createUserState({ 1: [10, 14, 16, 20], 2: [0, 3] });
            const issues = await findModerationIssues(message, userState, settings);
            expect(issues.length).to.eq(0);
        });

        it('even right at the limit', async () => {
            const message =
                'Kappa Kappa Kappa Kappa Kappa Kappa Kappa Kappa Kappa Kappa Kappa Kappa Kappa Kappa PogChamp';
            //    01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901
            //              10        20        30        40        50        60        70        80        90
            const userState = createUserState({
                1: [
                    0,
                    4,
                    6,
                    10,
                    12,
                    16,
                    18,
                    22,
                    24,
                    28,
                    30,
                    34,
                    36,
                    40,
                    42,
                    46,
                    48,
                    52,
                    54,
                    58,
                    60,
                    64,
                    66,
                    70,
                    72,
                    76,
                    78,
                    82,
                ],
                2: [84, 91],
            });
            const issues = await findModerationIssues(message, userState, settings);
            expect(issues.length).to.eq(0);
        });

        it("doesn't allow messages over the limit", async () => {
            const message =
                'Kappa Kappa Kappa Kappa Kappa Kappa Kappa Kappa Kappa Kappa Kappa Kappa Kappa Kappa Kappa PogChamp';
            //    01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567
            //              10        20        30        40        50        60        70        80        90
            const userState = createUserState({
                1: [
                    0,
                    4,
                    6,
                    10,
                    12,
                    16,
                    18,
                    22,
                    24,
                    28,
                    30,
                    34,
                    36,
                    40,
                    42,
                    46,
                    48,
                    52,
                    54,
                    58,
                    60,
                    64,
                    66,
                    70,
                    72,
                    76,
                    78,
                    82,
                    84,
                    88,
                ],
                2: [90, 97],
            });
            const issues = await findModerationIssues(message, userState, settings);
            expect(issues.length).to.eq(1);
        });
    });
});
