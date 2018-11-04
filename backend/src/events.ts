import { Set, hash } from 'immutable';
import logger from './logger';
import io from './io';
import _ from 'lodash';

type EventCallback = (details: Object, description?: string) => void;

class EventDefinition {
    eventName: string;
    description: string;
    listeners: Set<EventCallback> = Set();

    constructor(eventName: string, description: string) {
        this.eventName = eventName;
        this.description = description;
        this.listeners = Set();
    }

    addListener(fn: EventCallback): void {
        this.listeners = this.listeners.add(fn);
    }

    removeListener(fn: EventCallback): void {
        this.listeners = this.listeners.remove(fn);
    }

    clearListeners(): void {
        this.listeners = this.listeners.clear();
    }

    trigger(details: Object): void {
        // logger.debug(['event triggered', this.eventName, this.description, details]);
        this.listeners.forEach(fn => _.defer((details, description) => fn(details, description), details, this.description));
        io.broadcast(this.eventName, details);
    }

    equals(v: EventDefinition): boolean {
        return this.eventName === v.eventName;
    }

    hashCode(): number {
        return hash(this.eventName);
    }
}

class EventManager {
    events: Set<EventDefinition>;

    register(group: string, eventName: string, description: string): EventDefinition {
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

    addListener(group: string, eventName: string, fn: EventCallback): void {
        let event: EventDefinition = this.getDefinition(group, eventName);
        if (!event) {
            event = this.register(group, eventName, '');
        }

        event.addListener(fn);
    }

    removeListener(group: string, eventName: string, fn: EventCallback): void {
        const event: EventDefinition = this.getDefinition(group, eventName);
        if (event) {
            event.removeListener(fn);
        }
    }

    trigger(group: string, eventName: string, details?: Object): void {
        const event: EventDefinition = this.getDefinition(group, eventName);
        if (event) {
            event.trigger(details || {});
        }
    }

    getEventNames(group?: string): Array<string> {
        if (group) {
            return this.events
                .filter(event => event.eventName.startsWith(group + '.'))
                .map((event): string => event.eventName)
                .toArray();
        } else {
            return this.events
                .map((event): string => event.eventName)
                .toArray();
        }
    }

    getDefinition(group: string, eventName: string): EventDefinition {
        this.events = this.events || Set();
        return this.events.find(event => event.eventName === this.createEventName(group, eventName));
    }

    createEventName(group: string, eventName: string): string {
        return `${group}.${eventName}`;
    }
}

export default new EventManager();
