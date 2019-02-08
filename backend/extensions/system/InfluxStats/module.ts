import config from '../../../src/config';
import events from '../../../src/events';
import { influx } from '../../../src/servers/influx';
import state from '../../../src/state';

if (config.useInflux()) {
    let numMessages = 0;

    events.addListener('status', 'stream', (details, description) => {
        if (state.isOnline()) {
            influx
                .writePoints([
                    {
                        measurement: 'viewers',
                        tags: { channel: config.getStreamerName() },
                        fields: { numViewers: details['numViewers'] },
                    },
                    {
                        measurement: 'numMessages',
                        tags: { channel: config.getStreamerName() },
                        fields: { numMessages },
                    },
                ])
                .then(() => {
                    numMessages = 0;
                })
                .catch(err => {
                    console.error(`Error saving data to InfluxDB! ${err.stack}`);
                    numMessages = 0;
                });
        }
    });

    events.addListener('status', 'changegame', (details, description) => {
        influx
            .writePoints([
                {
                    measurement: 'events',
                    tags: { channel: config.getStreamerName(), type: 'changegame' },
                    fields: {
                        title: details['title'],
                        text: 'Game changed to ' + details['title'],
                    },
                },
            ])
            .catch(err => {
                console.error(`Error saving data to InfluxDB! ${err.stack}`);
            });
    });

    events.addListener('webhook', 'online', (details, description) => {
        influx
            .writePoints([
                {
                    measurement: 'events',
                    tags: { channel: config.getStreamerName(), type: 'online' },
                    fields: { title: 'Online', text: 'Stream went online' },
                },
            ])
            .catch(err => {
                console.error(`Error saving data to InfluxDB! ${err.stack}`);
            });
    });

    events.addListener('webhook', 'offline', (details, description) => {
        influx
            .writePoints([
                {
                    measurement: 'events',
                    tags: { channel: config.getStreamerName(), type: 'offline' },
                    fields: { title: 'Offline', text: 'Stream went offline' },
                },
            ])
            .catch(err => {
                console.error(`Error saving data to InfluxDB! ${err.stack}`);
            });
    });

    events.addListener('webhook', 'follow', (details, description) => {
        influx
            .writePoints([
                {
                    measurement: 'events',
                    tags: {
                        channel: config.getStreamerName(),
                        type: 'follow',
                        username: details['from_name'],
                    },
                    fields: {
                        title: 'Follow',
                        text: details['from_name'] + ' followed the stream!',
                    },
                },
            ])
            .catch(err => {
                console.error(`Error saving data to InfluxDB! ${err.stack}`);
            });
    });

    events.addListener('chat', 'sub', (details, _) => {
        influx
            .writePoints([
                {
                    measurement: 'events',
                    tags: {
                        channel: config.getStreamerName(),
                        type: 'sub',
                        username: details['username'],
                    },
                    fields: {
                        title: 'Subscription',
                        text: details['username'] + ' subscribed to the stream!',
                    },
                },
            ])
            .catch(err => {
                console.error(`Error saving data to InfluxDB! ${err.stack}`);
            });
    });

    events.addListener('chat', 'resub', (details, _) => {
        influx
            .writePoints([
                {
                    measurement: 'events',
                    tags: {
                        channel: config.getStreamerName(),
                        type: 'resub',
                        username: details['username'],
                    },
                    fields: {
                        title: 'Resub',
                        text:
                            details['username'] +
                            ' resubscribed for ' +
                            details['months'] +
                            ' months.',
                    },
                },
            ])
            .catch(err => {
                console.error(`Error saving data to InfluxDB! ${err.stack}`);
            });
    });

    events.addListener('chat', 'cheer', (details, _) => {
        influx
            .writePoints([
                {
                    measurement: 'events',
                    tags: {
                        channel: config.getStreamerName(),
                        type: 'cheer',
                        username: details['username'],
                    },
                    fields: {
                        title: 'Cheer',
                        text:
                            details['username'] +
                            ' cheered ' +
                            details['userstate']['bits'] +
                            ' bits.',
                    },
                },
            ])
            .catch(err => {
                console.error(`Error saving data to InfluxDB! ${err.stack}`);
            });
    });

    events.addListener('chat', 'hosted', (details, _) => {
        influx
            .writePoints([
                {
                    measurement: 'events',
                    tags: {
                        channel: config.getStreamerName(),
                        type: 'hosted',
                        username: details['username'],
                    },
                    fields: {
                        title: 'Hosted',
                        text:
                            details['username'] +
                            ' hosted the stream for ' +
                            details['viewers'] +
                            ' viewers.',
                        autohost: details['autohost'],
                    },
                },
            ])
            .catch(err => {
                console.error(`Error saving data to InfluxDB! ${err.stack}`);
            });
    });

    events.addListener('chat', 'message', (details, description) => {
        if (state.isOnline()) {
            numMessages++;
        }
    });
}

export default {};
