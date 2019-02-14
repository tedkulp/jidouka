import _ from 'lodash';
const { SPLAT } = require('triple-beam'); // tslint:disable-line
import util from 'util';
import { createLogger, format, transports } from 'winston';

import config from './config';

// {
//     error: 0,
//     warn: 1,
//     info: 2,
//     verbose: 3,
//     debug: 4,
//     silly: 5
// }

const logger = createLogger({
    level: config.getLogLevel(),
    format: format.combine(
        format.splat(),
        format.timestamp({ format: 'HH:mm:ss' }),
        format.colorize(),
        format.printf(info => {
            if (info[SPLAT] && info[SPLAT].length > 0) {
                const msg = [info.message, ...info[SPLAT]].map(i => util.inspect(i)).join(' ');
                return `[${info.timestamp}] ${info.level}: ${msg}`;
            } else if (info.meta && info.meta.length > 0) {
                const msg = [info.message, ...info.meta].map(i => util.inspect(i)).join(' ');
                return `[${info.timestamp}] ${info.level}: ${msg}`;
            } else {
                return `[${info.timestamp}] ${info.level}: ${util.inspect(info.message)}`;
            }
        })
    ),
    transports: [new transports.Console()],
});

export default logger;
