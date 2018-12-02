import moment, { now } from 'moment';
import { isEmpty, has, get } from 'lodash';
import api from './api';
import log from './logger';
import events from './events';
import logger from './logger';

type apiLimitValues = {
    limit: number | null,
    remaining: number | null,
    refresh: moment.Moment | null,
};

type apiLimitMap = { [s: string]: apiLimitValues };

class State {
    online: boolean = false;
    onlineStartTime: moment.Moment | null = null;
    apiLimits: apiLimitMap = {};
    numViewers: number | null = 0;
    title: string | null = '';
    gameId: number | null = 0;
    gameTitle: string | null = '';
    language: string | null = '';

    async init() {
        events.register('status', 'stream', 'Constantly updated status of stream. Fires every 30 seconds.');
        events.register('status', 'changegame', 'Fired when the game changes');
        this.updateStatus();
        setInterval(this.updateStatus.bind(this), 30 * 1000);
    }

    async updateStatus() {
        try {
            const streamData = await api.getStreamData();
            this.setNumViewers(parseInt(get(streamData, 'viewer_count', 0)));
            this.setTitle(get(streamData, 'title', ''));
            this.setLanguage(get(streamData, 'language', 'en'));
            this.setOnline(get(streamData, 'type', '') === 'live');
            this.setOnlineStartTime(has(streamData, 'started_at') ? moment(get(streamData, 'started_at')) : null);
            await this.setGameId(parseInt(get(streamData, 'game_id', 0)));

            events.trigger('status', 'stream', this.toJSON());

            log.silly('current state', this);
        } catch (e) {
            // TODO: What are we doing with errors?
            console.error(e);
        }
    }

    setNumViewers(numViewers: number) {
        this.numViewers = numViewers;
    }

    setTitle(title: string) {
        this.title = title;
    }

    async setGameId(gameId: number) {
        if (this.gameId !== gameId) {
            logger.debug('Updating game title');

            const gameTitle = get(await api.getGameInfo(gameId), 'name', '');
            this.setGameTitle(gameTitle);

            if (!isEmpty(gameTitle)) {
                logger.debug('Trigger changegame event');
                events.trigger('status', 'changegame', {
                    title: gameTitle,
                });
            }
        }
        this.gameId = gameId;
    }

    setGameTitle(gameTitle: string) {
        this.gameTitle = gameTitle;
    }

    setLanguage(language: string) {
        this.language = language;
    }

    isOnline() {
        // TODO: redis
        return this.online;
    }

    setOnline(online: boolean) {
        if (!online && this.online) {
            // We went offline
            this.clearOnlineStartTime();
        }
        this.online = online;
    }

    getOnlineStartTime() : moment.Moment {
        return this.onlineStartTime;
    }

    setOnlineStartTime(startTime: moment.Moment) {
        this.onlineStartTime = startTime;
    }

    clearOnlineStartTime() {
        this.onlineStartTime = null;
    }

    getApiLimit(type) {
        return this.apiLimits[type];
    }

    setApiLimit(type: string, limit, remaining, refresh) {
        const limits: apiLimitValues = {
            limit,
            remaining,
            refresh: moment.unix(refresh),
        };

        this.apiLimits[type] = limits;

        // console.log(this.apiLimits);
    }

    toJSON() {
        return {
            online: this.online,
            onlineStartTime: this.onlineStartTime ? this.onlineStartTime.format() : '',
            numViewers: this.numViewers,
            title: this.title,
            gameId: this.gameId,
            gameTitle: this.gameTitle,
            language: this.language,
        };
    }
}

export default new State();
