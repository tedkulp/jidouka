/* eslint-disable no-console */

import { OrderedMap } from 'immutable';
import moment from 'moment';

import events from './events';
import client from './client';

type ResponseList = Array<string>;
type CommandReponse = (args: string) => string | ResponseList;

class CommandManager {
    commands: OrderedMap<string, CommandReponse> = OrderedMap();

    constructor() {
        events.addListener('chat', 'message', this.chatHandler.bind(this));
    }

    register(commandName: string, fn: CommandReponse) {
        this.commands = this.commands.set(commandName, fn);
        console.log('commands', this.commands);
    }

    chatHandler(details: any) {
        // details: { channel, userstate, message }
        if (details && details.message) {
            const foundCmd = this.commands
                .sortBy((val: CommandReponse, key: string) => key.length * -1) // reverse sort
                .findKey((val: CommandReponse, key: string) => details.message.startsWith(key));
            if (foundCmd) {
                const foundCmdFn = this.commands.get(foundCmd);
                const result = foundCmdFn(details.message.replace(`${foundCmd} `, ''));
                if (typeof result === 'string') {
                    client.say(details.channel, result);
                } else if (result && result.forEach) { // Why do I have to check it this way?
                    result.forEach(line => {
                        client.say(details.channel, line);
                    });
                }
            }
        }
    }

}

const mgr = new CommandManager();

mgr.register('!time', (args: string): string => {
    const time = moment().format('h:mm:ss A');
    return `Streamer's current time is: ${time}`;
});

mgr.register('!time utc', (args: string): string => {
    const time = moment.utc().format('h:mm:ss A');
    return `Streamer's current time in UTC is: ${time}`;
});

// mgr.register('abc', (args: string): Array<string> => {
//     console.log('abc args', args);
//     return new Array('a', 'b', 'c');
// });

export default mgr;
