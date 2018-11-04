import { createLogger, format, transports } from 'winston';

import util from 'util';
import _ from 'lodash';
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
        format.timestamp({format: 'HH:mm:ss'}),
        format.colorize(),
        format.printf(info => `[${info.timestamp}] ${info.level}: ${util.inspect(info.message)}`),
    ),
    transports: [new transports.Console()],
});

export default logger;
