import moment from 'moment';
import api from './api';
import log from './logger';

class State {

    online: boolean = false;
    onlineStartTime: moment.Moment | null = null;
    apiLimit = {
        limit: null as number | null,
        remaining: null as number | null,
        refresh: null as moment.Moment | null,
    };

    async init() {
        this.setOnline(await api.getOnlineStatus());
        this.setOnlineStartTime(await api.getOnlineStartTime());

        log.info(this, 'state init');
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

    getApiLimit() {
        return this.apiLimit;
    }

    setApiLimit(limit, remaining, refresh) {
        this.apiLimit.limit = limit;
        this.apiLimit.remaining = remaining;
        this.apiLimit.refresh = moment.unix(refresh);
    }
}

export default new State();
