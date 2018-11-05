import { OrderedMap } from 'immutable';
import moment from 'moment';

import events from './events';
import client from './client';
import log from './logger'

export type ResponseList = Array<string>;
export type CommandReponse = (args: string, details: any) => Promise<string | ResponseList> | string | ResponseList;

class CommandManager {
    commands: OrderedMap<string, CommandReponse> = OrderedMap();

    init() {
        events.addListener('chat', 'message', this.chatHandler.bind(this));
    }

    register(commandName: string, fn: CommandReponse) {
        this.commands = this.commands.set(commandName, fn);
        log.info(['registered command', commandName]);
    }

    async chatHandler(details: any) {
        // details: { channel, userstate, message }
        if (details && details.message) {
            const foundCmd = this.commands
                .sortBy((val: CommandReponse, key: string) => key.length * -1) // reverse sort
                .findKey((val: CommandReponse, key: string) => details.message.startsWith(key));
            if (foundCmd) {
                const foundCmdFn = this.commands.get(foundCmd);
                const result = await foundCmdFn(details.message.replace(`${foundCmd} `, ''), details);
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

mgr.register('!time', (args: string, details: any) => {
    const time = moment().format('h:mm:ss A');
    return `Streamer's current time is: ${time}`;
});

export default mgr;
