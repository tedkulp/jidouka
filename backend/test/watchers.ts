import { expect } from 'chai';
import { delay } from 'lodash';
import 'mocha';

import events from '../src/events';
import watchers from '../src/watchers';
import state from '../src/state';

const asyncDelay = fn => {
    return delay(fn, 5);
};

describe('watchers', () => {
    beforeEach(() => {
        watchers.init(false);
    });

    afterEach(() => {
        watchers.clear();
    });

    describe('event handlers', () => {
        describe('chat.join', () => {
            it('should add a watcher to the list when the chat.join event fires', done => {
                events.trigger('chat', 'join', { channel: 'test', username: 'test', self: false });

                asyncDelay(() => {
                    expect(watchers.getWatchers('test').map(w => w.username)).to.include('test');
                    done();
                });
            });

            it('should not try to add the user again if it gets re-added', done => {
                events.trigger('chat', 'join', { channel: 'test', username: 'test', self: false });
                events.trigger('chat', 'join', { channel: 'test', username: 'test', self: false });

                asyncDelay(() => {
                    expect(watchers.getWatchers('test')).to.have.lengthOf(1);
                    done();
                });
            });
        });

        describe('chat.part', () => {
            it('should remove the watcher from the list when the chat.part event fires', done => {
                events.trigger('chat', 'join', { channel: 'test', username: 'test', self: false });
                events.trigger('chat', 'part', { channel: 'test', username: 'test', self: false });

                asyncDelay(() => {
                    expect(watchers.getWatchers('test')).to.be.empty;
                    done();
                });
            });
        });

        describe('chat.names', () => {
            it('should add/re-add watchers when the chat.names event fires', done => {
                events.trigger('chat', 'join', { channel: 'test', username: 'test', self: false });
                events.trigger('chat', 'names', { channel: 'test', usernames: ['test', 'test2'] });

                asyncDelay(() => {
                    expect(watchers.getWatchers('test')).to.be.lengthOf(2);
                    done();
                });
            });
        });

        describe('chat.mod', () => {
            it('should add mods when the chat.mod event fires', done => {
                events.trigger('chat', 'mod', { channel: 'test', username: 'test' });

                asyncDelay(() => {
                    expect(watchers.getMods('test')).to.be.lengthOf(1);
                    done();
                });
            });

            it('should also add users when the chat.mod event fires in case things come in out of order', done => {
                events.trigger('chat', 'mod', { channel: 'test', username: 'test' });

                asyncDelay(() => {
                    expect(watchers.getWatchers('test')).to.be.lengthOf(1);
                    done();
                });
            });
        });

        describe('chat.unmod', () => {
            it('should remove mods when the chat.unmod event fires', done => {
                events.trigger('chat', 'mod', { channel: 'test', username: 'test' });
                events.trigger('chat', 'unmod', { channel: 'test', username: 'test' });

                asyncDelay(() => {
                    expect(watchers.getMods('test')).to.be.empty;
                    done();
                });
            });
        });
    });

    describe('updateWatchedTime', () => {
        it('should do something', done => {
            // watchers.updateWatchedTime().then(done);
            done();
        });
    });
});
