import express from 'express';
import { createServer } from 'http';
import bodyParser from "body-parser";
import basicAuth from 'express-basic-auth';
import { decorateApp } from '@awaitjs/express';
import { GracefulShutdownManager } from '@moebius/http-graceful-shutdown';
import config from '../config';

export const app: any = decorateApp(express());
export const http = createServer(app);
export const shutdownManager = new GracefulShutdownManager(http);

app.use(bodyParser.json({
    verify: (req, res, buf, encoding) => {
        if (buf && buf.length) {
            req['rawBody'] = buf.toString(encoding || 'utf8');
        }
    },
}));

if (config.getPanelUser() && config.getPanelPass()) {
    var middleware = basicAuth({
        challenge: true,
        authorizer: (u, p) => {
            return u === config.getPanelUser() && p === config.getPanelPass();
        },
    });

    app.use((req, res, next) => {
        if (req.path.startsWith('/webhooks') || req.path.startsWith('/oauth')) {
            next();
        } else {
            middleware(req, res, next);
        }
    });
}