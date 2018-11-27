import _ from 'lodash';
import { init as mongoInit, close as mongoClose } from './src/servers/mongo';
import redis from './src/servers/redis';
import { app, http, shutdownManager, proxy, staticServer } from './src/servers/express';
import fs from 'fs';

import { connect as client } from './src/client';
import apolloServer from './src/schema';
import commands from './src/commands';
import io from './src/io';
import logger from './src/logger';
import extensions from './src/extensions';
import { init as oauthInit } from './src/oauth';

import state from './src/state';
import webhooks from './src/webhooks';

var shuttingDown = false;

// Handle ctrl-c
const shutdown = async () => {
    if (!shuttingDown) {
        shuttingDown = true;
    } else {
        return;
    }

    logger.info('Shutting down gracefully');

    await webhooks.unsubscribe();

    if (redis && redis.connected) {
        redis.quit();
    }

    mongoClose();

    // Give webhooks 2.5 seconds to cleanly unsub
    _.delay(() => {
        shutdownManager.terminate(() => {
            process.exit(0);
        });

        setTimeout(() => {
            console.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 5000);
    }, 2500);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGUSR2', shutdown);

(async () => {
    // Just to force mongoose to init
    mongoInit();

    // Init ALL the things!
    apolloServer.applyMiddleware({ app });
    io.init(http);
    webhooks.init(app);
    oauthInit();
    extensions.init();
    commands.init();
    state.init();

    // Last, so that everything that's not caught goes to the frontend
    const clientDir = `${__dirname}/client`;
    if (fs.existsSync(clientDir)) {
        app.use(staticServer(clientDir));
        app.get('*', (req, res) => {
            res.sendFile(clientDir, 'index.html');
            res.end();
        });
    } else {
        app.use(proxy);
    }

    const port = process.env.port || 4000;
    http.listen(port, () => {
        logger.info(`now listening for requests on port ${port}`);
    });

    // Now connect to chat (which might not happen right away)
    client();
})();
