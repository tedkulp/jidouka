import _ from 'lodash';
import express from 'express';
import bodyParser from "body-parser";
import { decorateApp } from '@awaitjs/express';

import client from './client';
import commands from './commands';

import { getClient, getDb } from './servers/mongo';
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
    app.use(bodyParser.json());

    commands.init();
    state.init();
    webhooks.init(app);

    client.connect();

    app.listen(process.env.port || 4000, () => {
        console.log("now listening for requests on port 4000");
    });
})();
