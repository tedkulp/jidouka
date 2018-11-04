import * as io from 'socket.io-client';
import { forOwn } from 'lodash';

import { dispatch } from '../store';

const socket = io('/');
const patch = require('socketio-wildcard')(io.Manager);
patch(socket);

socket.on('*', (msg) => {
    const props = forOwn(msg.data[1], (v, k) => {
        return [k, v];
    });
    dispatch({
        ...props,
        type: `socket-action/${msg.data[0].toUpperCase()}`,
    });
});

export default socket;
