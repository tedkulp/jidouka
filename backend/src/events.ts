import { hash, Set } from 'immutable';
import _ from 'lodash';

import io from './io';
// import logger from './logger';

type EventCallback = (details: object, description?: string) => void;

class EventDefinition {
    public eventName: string;
    public description: string;
    public listeners: Set<EventCallback> = Set();

    constructor(eventName: string, description: string) {
        this.eventName = eventName;
        this.description = description;
        this.listeners = Set();
    }

    public addListener(fn: EventCallback): void {
        this.listeners = this.listeners.add(fn);
    }

    public removeListener(fn: EventCallback): void {
        this.listeners = this.listeners.remove(fn);
    }

    public clearListeners(): void {
        this.listeners = this.listeners.clear();
    }

    public trigger(details: object): void {
        // logger.debug(['event triggered', this.eventName, this.description, details]);
        this.listeners.forEach(fn =>
            _.defer(
                (fnDetails, description) => fn(fnDetails, description),
                details,
                this.description
            )
        );
        io.broadcast(this.eventName, details);
    }

    public equals(v: EventDefinition): boolean {
        return this.eventName === v.eventName;
    }

    public hashCode(): number {
        return hash(this.eventName);
    }
}

// tslint:disable:max-classes-per-file

class EventManager {
    public events: Set<EventDefinition>;

    public register(group: string, eventName: string, description: string): EventDefinition {
        this.events = this.events || Set();

        let event: EventDefinition = this.getDefinition(group, eventName);
        if (!event) {
            event = new EventDefinition(this.createEventName(group, eventName), description);
            this.events = this.events.add(event);
        } else {
            event.description = description;
        }

        return event;
    }

    public addListener(group: string, eventName: string, fn: EventCallback): void {
        let event: EventDefinition = this.getDefinition(group, eventName);
        if (!event) {
            event = this.register(group, eventName, '');
        }

        event.addListener(fn);
    }

    public removeListener(group: string, eventName: string, fn: EventCallback): void {
        const event: EventDefinition = this.getDefinition(group, eventName);
        if (event) {
            event.removeListener(fn);
        }
    }

    public trigger(group: string, eventName: string, details?: object): void {
        const event: EventDefinition = this.getDefinition(group, eventName);
        if (event) {
            event.trigger(details || {});
        }
    }

    public getEventNames(group?: string): string[] {
        if (group) {
            return this.events
                .filter(event => event.eventName.startsWith(group + '.'))
                .map((event): string => event.eventName)
                .toArray();
        } else {
            return this.events.map((event): string => event.eventName).toArray();
        }
    }

    public getDefinition(group: string, eventName: string): EventDefinition {
        this.events = this.events || Set();
        return this.events.find(
            event => event.eventName === this.createEventName(group, eventName)
        );
    }

    public createEventName(group: string, eventName: string): string {
        return `${group}.${eventName}`;
    }
}

export default new EventManager();
