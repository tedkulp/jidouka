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

function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || 'object' != typeof obj) return obj;

    // Use inspect if it exists...
    if (obj && obj.inspect) {
        if (_.isFunction(obj.inspect.custom)) {
            return obj.inspect.custom();
        } else if (_.isFunction(obj.inspect)) {
            return obj.inspect();
        }
    }

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    // throw new Error("Unable to copy obj! This type isn't supported.");
    return "Unable to copy obj! This type isn't supported.";
}

const logger = createLogger({
    level: config.getLogLevel(),
    format: format.combine(
        format.splat(),
        format.timestamp({ format: 'HH:mm:ss' }),
        format.colorize(),
        format.printf(info => {
            if (info[SPLAT] && info[SPLAT].length > 0) {
                const splat = clone(info[SPLAT]);
                const msg = [info.message, ...splat].map(i => util.inspect(i)).join(' ');
                return `[${info.timestamp}] ${info.level}: ${msg}`;
            } else if (info.meta && info.meta.length > 0) {
                const meta = clone(info.meta);
                const msg = [info.message, ...meta].map(i => util.inspect(i)).join(' ');
                return `[${info.timestamp}] ${info.level}: ${msg}`;
            } else {
                return `[${info.timestamp}] ${info.level}: ${util.inspect(info.message)}`;
            }
        })
    ),
    transports: [new transports.Console()],
});

export default logger;
