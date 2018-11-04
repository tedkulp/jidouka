import _ from 'lodash';
import { init as mongoInit } from './src/servers/mongo';
import { app, http } from './src/servers/express';

import client from './src/client';
import apolloServer from './src/schema';
import commands from './src/commands';
import io from './src/io';
import logger from './src/logger';
import { init as oauthInit } from './src/oauth';

import state from './src/state';
import webhooks from './src/webhooks';

// Handle ctrl-c
process.on('SIGINT', function () {
    webhooks.unsubscribe();

    // Give webhooks 2.5 seconds to cleanly unsub
    _.delay(process.exit, 2500);
});

(async () => {
    // Just to force mongoose to init
    mongoInit();

    apolloServer.applyMiddleware({ app });
    io.init(http);
    webhooks.init(app);
    oauthInit();

    // TODO: Remove this delay... it's for testing events
    _.delay(() => {
        commands.init();
        state.init();

        client.connect();
    }, 5000);

    const port = process.env.port || 4000;
    http.listen(port, () => {
        logger.info(`now listening for requests on port ${port}`);
    });
})();
