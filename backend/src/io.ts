import io from 'socket.io';
import _ from 'lodash';
import { Set } from 'immutable';
import { Server } from 'http';

import logger from './logger';
import events from './events';

class IoServer {
    sockets: Set<io.Socket> = Set();
    server: io.Server | null = null;

    init(http: Server) {
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
                    const [ part1, part2 ] = _.get(data, 'event', '').split('.');
                    if (part1 && part2) {
                        events.trigger(part1, part2, _.get(data, 'data', {}));
                    }
                });
            });
        }
    }

    broadcast(eventName: string, details: any) {
        if (this.server) {
            this.sockets.forEach(socket => {
                socket.emit(eventName, details);
            });
        }
    }

    emit(id: string, eventName: string, details: any) {
        if (this.server) {
            const found = this.sockets.find(s => s.id === id);
            if (found) {
                found.emit(eventName, details);
            }
        }
    }
};

export default new IoServer();
