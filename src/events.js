// @flow
/* eslint-disable no-console */
const immutable = require('immutable');

class EventDefinition {
    eventName: string;
    description: string;
    listeners: immutable.Set<(Object, ?string) => void>;

    constructor(eventName: string, description: string) {
        this.eventName = eventName;
        this.description = description;
        this.listeners = immutable.Set();
    }

    addListener(fn: (Object, ?string) => void): void {
        this.listeners = this.listeners.add(fn);
    }

    removeListener(fn: (Object, ?string) => void): void {
        this.listeners = this.listeners.remove(fn);
    }

    clearListeners(): void {
        this.listeners = this.listeners.clear();
    }

    trigger(details: Object): void {
        console.log('trigger', this.eventName, this.description, details);
        this.listeners.forEach(fn => fn(details, this.description));
    }

    equals(v: EventDefinition): boolean {
        return this.eventName === v.eventName;
    }

    hashCode(): number {
        return immutable.hash(this.eventName);
    }
}

class EventManager {
    events: immutable.Set<EventDefinition>;

    register(group: string, eventName: string, description: string): void {
        this.events = this.events || immutable.Set();
        this.events = this.events.add(new EventDefinition(this.createEventName(group, eventName), description));
        // console.log(this.events.toJSON());
    }

    addListener(group: string, eventName: string, fn: (Object, ?string) => void): void {
        const event: EventDefinition = this.getDefinition(group, eventName);
        if (event) {
            event.addListener(fn);
        }
    }

    removeListener(group: string, eventName: string, fn: (Object, ?string) => void): void {
        const event: EventDefinition = this.getDefinition(group, eventName);
        if (event) {
            event.removeListener(fn);
        }
    }

    trigger(group: string, eventName: string, details: Object): void {
        const event: EventDefinition = this.getDefinition(group, eventName);
        if (event) {
            event.trigger(details);
        }
    }

    getEventNames(group: string = ''): Array<string> {
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
        return this.events.find(event => event.eventName === this.createEventName(group, eventName));
    }

    createEventName(group: string, eventName: string): string {
        return `${group}.${eventName}`;
    }
}

module.exports = new EventManager();
