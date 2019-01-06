import { OrderedMap } from 'immutable';
import moment from 'moment';

import events from './events';
import { client, isConnected } from './client';
import log from './logger'

export type ResponseList = Array<string>;
export type CommandResponse = (args: string, details: any) => Promise<string | ResponseList> | string | ResponseList;

class CommandManager {
    commands: OrderedMap<string, CommandResponse> = OrderedMap();

    init() {
        events.addListener('chat', 'message', this.chatHandler.bind(this));
    }

    register(commandName: string, fn: CommandResponse) {
        this.commands = this.commands.set(commandName, fn);
        log.info('Registered command:', commandName);
    }

    unregister(commandName: string) {
        this.commands = this.commands.remove(commandName);
        log.info('Unregistered command:', commandName);
    }

    async chatHandler(details: any) {
        // details: { channel, userstate, message }
        if (details && details.message) {
            const foundCmd = this.commands
                .sortBy((val: CommandResponse, key: string) => key.length * -1) // reverse sort
                .findKey((val: CommandResponse, key: string) => details.message.startsWith(key));
            if (foundCmd) {
                const foundCmdFn = this.commands.get(foundCmd);
                const result = await foundCmdFn(details.message.replace(`${foundCmd}`, '').trim(), details);
                if (typeof result === 'string') {
                    if (isConnected()) {
                        client.say(details.channel, result);
                    }
                } else if (result && result.forEach) { // Why do I have to check it this way?
                    result.forEach(line => {
                        if (isConnected()) {
                            client.say(details.channel, line);
                        }
                    });
                }
            }
        }
    }
}

const mgr = new CommandManager();

mgr.register('!time', (args: string, details: any) => {
    const time = moment().format('h:mm:ss A');
    return `Streamer's current time is: ${time}`;
});

export default mgr;
