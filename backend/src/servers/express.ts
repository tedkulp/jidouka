import express from 'express';
import { createServer } from 'http';
import bodyParser from "body-parser";
import { decorateApp } from '@awaitjs/express';

export const app: any = decorateApp(express());
export const http = createServer(app);

app.use(bodyParser.json({
    verify: (req, res, buf, encoding) => {
        if (buf && buf.length) {
            req['rawBody'] = buf.toString(encoding || 'utf8');
        }
    },
}));
