/* eslint-disable no-console */

const levels = { "trace": 0, "debug": 1, "info": 2, "warn": 3, "error": 4, "fatal": 5 };
let currentLevel = "info";

const formatDate = date => {
    var hours = date.getHours();
    var mins = date.getMinutes();

    hours = (hours < 10 ? "0" : "") + hours;
    mins = (mins < 10 ? "0" : "") + mins;

    return `${hours}:${mins}`;
};

// Logger implementation..
const log = level => {
    // Return a console message depending on the logging level..
    return (message: any, marker?: string) => {
        if (levels[level] >= levels[currentLevel]) {
            if (marker && marker !== '') {
                console.log(`[${formatDate(new Date())}] ${level}: ${marker} - ${message}`);
            } else {
                console.log(`[${formatDate(new Date())}] ${level}: ${message}`);
            }
        }
    };
};

export default {
    // Change the current logging level..
    setLevel: level => {
        currentLevel = level;
    },
    trace: log("trace"),
    debug: log("debug"),
    info: log("info"),
    warn: log("warn"),
    error: log("error"),
    fatal: log("fatal")
};
