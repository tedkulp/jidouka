import { Server } from 'http';
import { Set } from 'immutable';
import _ from 'lodash';
import io from 'socket.io';

import events from './events';
import logger from './logger';

class IoServer {
    public sockets: Set<io.Socket> = Set();
    public server: io.Server | null = null;

    public init(http: Server) {
        if (!this.server) {
            this.server = io(http, { path: '/socket.io' });

            this.server.on('connection', socket => {
                this.sockets = this.sockets.add(socket);
                logger.debug('a user connected');

                socket.emit('client', { message: 'Connected' });
                socket.on('disconnect', () => {
                    logger.debug('a user disconnected');
                    this.sockets = this.sockets.remove(socket);
                });

                socket.on('event', data => {
                    const [part1, part2] = _.get(data, 'event', '').split('.');
                    if (part1 && part2) {
                        events.trigger(part1, part2, _.get(data, 'data', {}));
                    }
                });
            });
        }
    }

    public broadcast(eventName: string, details: any) {
        if (this.server) {
            this.sockets.forEach(socket => {
                socket.emit(eventName, details);
            });
        }
    }

    public emit(id: string, eventName: string, details: any) {
        if (this.server) {
            const found = this.sockets.find(s => s.id === id);
            if (found) {
                found.emit(eventName, details);
            }
        }
    }
}

export default new IoServer();
