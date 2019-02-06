import fs from 'fs';
import _ from 'lodash';

import { app, http, proxy, shutdownManager, staticServer } from './src/servers/express';
import { close as mongoClose, init as mongoInit } from './src/servers/mongo';
import redis from './src/servers/redis';

import { connect as client } from './src/client';
import commands from './src/commands';
import extensions from './src/extensions';
import io from './src/io';
import logger from './src/logger';
import { init as oauthInit } from './src/oauth';
import { getServer } from './src/schema';
import state from './src/state';
import webhooks from './src/webhooks';

let shuttingDown = false;

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
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGUSR2', shutdown);

(async () => {
    // Just to force mongoose to init
    mongoInit(); // Mongo before extensions, so we can define model/schemas directly

    // Init ALL the things!
    io.init(http);
    webhooks.init(app);
    oauthInit();
    commands.init();
    state.init();
    await extensions.init(); // Extensions before apollo, so that we can define schemas
    getServer().applyMiddleware({ app });

    // Last, so that everything that's not caught goes to the frontend
    const clientDir = `${__dirname}/client`;
    if (fs.existsSync(clientDir)) {
        app.use(staticServer(clientDir));
        app.get('*', (req, res) => {
            res.sendFile(`${clientDir}/index.html`);
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
