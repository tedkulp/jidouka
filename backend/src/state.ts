import { get, has, isEmpty } from 'lodash';
import moment from 'moment';

import api from './api';
import events from './events';
import logger from './logger';

interface IApiLimitValues {
    limit: number | null;
    remaining: number | null;
    refresh: moment.Moment | null;
}

interface IApiLimitMap {
    [s: string]: IApiLimitValues;
}

class State {
    public online: boolean = false;
    public onlineStartTime: moment.Moment | null = null;
    public apiLimits: IApiLimitMap = {};
    public numViewers: number | null = 0;
    public title: string | null = '';
    public gameId: number | null = 0;
    public gameTitle: string | null = '';
    public language: string | null = '';

    public async init() {
        events.register(
            'status',
            'stream',
            'Constantly updated status of stream. Fires every 30 seconds.'
        );
        events.register('status', 'changegame', 'Fired when the game changes');
        this.updateStatus();
        setInterval(this.updateStatus.bind(this), 30 * 1000);
    }

    public async updateStatus() {
        try {
            const streamData = await api.getStreamData();
            this.setNumViewers(parseInt(get(streamData, 'viewer_count', 0), 10));
            this.setTitle(get(streamData, 'title', ''));
            this.setLanguage(get(streamData, 'language', 'en'));
            this.setOnline(get(streamData, 'type', '') === 'live');
            this.setOnlineStartTime(
                has(streamData, 'started_at') ? moment(get(streamData, 'started_at')) : null
            );
            await this.setGameId(parseInt(get(streamData, 'game_id', 0), 10));

            events.trigger('status', 'stream', this.toJSON());

            logger.silly('current state', this);
        } catch (e) {
            // TODO: What are we doing with errors?
            console.error(e);
        }
    }

    public setNumViewers(numViewers: number) {
        this.numViewers = numViewers;
    }

    public setTitle(title: string) {
        this.title = title;
    }

    public async setGameId(gameId: number) {
        if (this.gameId !== gameId) {
            logger.debug('Updating game title');

            const gameTitle = get(await api.getGameInfo(gameId), 'name', '');
            this.setGameTitle(gameTitle);

            if (!isEmpty(gameTitle)) {
                logger.debug('Trigger changegame event');
                events.trigger('status', 'changegame', {
                    title: gameTitle
                });
            }
        }
        this.gameId = gameId;
    }

    public setGameTitle(gameTitle: string) {
        this.gameTitle = gameTitle;
    }

    public setLanguage(language: string) {
        this.language = language;
    }

    public isOnline() {
        // TODO: redis
        return this.online;
    }

    public setOnline(online: boolean) {
        if (!online && this.online) {
            // We went offline
            this.clearOnlineStartTime();
        }
        this.online = online;
    }

    public getOnlineStartTime(): moment.Moment {
        return this.onlineStartTime;
    }

    public setOnlineStartTime(startTime: moment.Moment) {
        this.onlineStartTime = startTime;
    }

    public clearOnlineStartTime() {
        this.onlineStartTime = null;
    }

    public getApiLimit(type) {
        return this.apiLimits[type];
    }

    public setApiLimit(type: string, limit, remaining, refresh) {
        const limits: IApiLimitValues = {
            limit,
            remaining,
            refresh: moment.unix(refresh)
        };

        this.apiLimits[type] = limits;

        // console.log(this.apiLimits);
    }

    public toJSON() {
        return {
            online: this.online,
            onlineStartTime: this.onlineStartTime ? this.onlineStartTime.format() : '',
            numViewers: this.numViewers,
            title: this.title,
            gameId: this.gameId,
            gameTitle: this.gameTitle,
            language: this.language
        };
    }
}

export default new State();
