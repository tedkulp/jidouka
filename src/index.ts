import _ from 'lodash';
import express from 'express';
import { createServer } from 'http';
import bodyParser from "body-parser";
import { decorateApp } from '@awaitjs/express';

import { getClient, getDb } from './servers/mongo';

import client from './client';
import commands from './commands';
import io from './io';

import state from './state';
import webhooks from './webhooks';

// Handle ctrl-c
process.on('SIGINT', function () {
    webhooks.unsubscribe();

    // Give webhooks 2.5 seconds to cleanly unsub
    _.delay(process.exit, 2500);
});

(async () => {
    const mongoClient = await getClient();
    const db = await getDb();

    const app: any = decorateApp(express());
    const http = createServer(app);

    app.use(bodyParser.json({
        verify: (req, res, buf, encoding) => {
            if (buf && buf.length) {
                req['rawBody'] = buf.toString(encoding || 'utf8');
            }
        },
    }));

    io.init(http);
    webhooks.init(app);

    // TODO: Remove this delay... it's for testing events
    _.delay(() => {
        commands.init();
        state.init();

        client.connect();
    }, 5000);

    http.listen(process.env.port || 4000, () => {
        console.log("now listening for requests on port 4000");
    });
})();
