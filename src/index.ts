import _ from 'lodash';

import client from './client';
import commands from './commands';
import api from './api';

import { getClient, getDb } from './servers/mongo';
import state from './state';
import config from '../config/config.json';
import logger from './logger';

(async () => {
    const mongoClient = await getClient();
    const db = await getDb();

    logger.setLevel(_.get(config, 'options.logLevel', 'info'));

    commands.init();
    state.init();

    client.connect();
})();
