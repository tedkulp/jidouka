import _ from 'lodash';

import client from './client';
import commands from './commands';

import { getClient, getDb } from './servers/mongo';
import state from './state';

(async () => {
    const mongoClient = await getClient();
    const db = await getDb();

    commands.init();
    state.init();

    client.connect();
})();
