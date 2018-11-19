import events from '../../src/events';
import state from '../../src/state';
import config from '../../src/config';
import { influx } from '../../src/servers/influx';

if (config.useInflux()) {
    let numMessages = 0;

    events.addListener('status', 'stream', (details, description) => {
        if (state.isOnline()) {
            influx.writePoints([
                {
                    measurement: 'viewers',
                    tags: { channel: config.getStreamerName() },
                    fields: { numViewers: details['numViewers'] },
                },
                {
                    measurement: 'numMessages',
                    tags: { channel: config.getStreamerName() },
                    fields: { numMessages: numMessages },
                }
            ]).catch(err => {
                console.error(`Error saving data to InfluxDB! ${err.stack}`)
            }).finally(() => {
                numMessages = 0;
            });
        }
    });

    events.addListener('status', 'changegame', (details, description) => {
        influx.writePoints([
            {
                measurement: 'events',
                tags: { channel: config.getStreamerName(), type: 'changegame' },
                fields: { title: details['title'], text: 'Game changed to ' + details['title'] },
            }
        ]).catch(err => {
            console.error(`Error saving data to InfluxDB! ${err.stack}`)
        });
    });

    events.addListener('webhook', 'online', (details, description) => {
        influx.writePoints([
            {
                measurement: 'events',
                tags: { channel: config.getStreamerName(), type: 'online' },
                fields: { title: 'Online', text: 'Stream went online' },
            }
        ]).catch(err => {
            console.error(`Error saving data to InfluxDB! ${err.stack}`)
        });
    });

    events.addListener('webhook', 'offline', (details, description) => {
        influx.writePoints([
            {
                measurement: 'events',
                tags: { channel: config.getStreamerName(), type: 'offline' },
                fields: { title: 'Offline', text: 'Stream went offline' },
            }
        ]).catch(err => {
            console.error(`Error saving data to InfluxDB! ${err.stack}`)
        });
    });

    events.addListener('webhook', 'follow', (details, description) => {
        influx.writePoints([
            {
                measurement: 'events',
                tags: { channel: config.getStreamerName(), type: 'follow', username: details['from_name'] },
                fields: { title: 'Follow', text: details['from_name'] + ' followed the stream!' },
            }
        ]).catch(err => {
            console.error(`Error saving data to InfluxDB! ${err.stack}`)
        });
    });

    events.addListener('chat', 'message', (details, description) => {
        if (state.isOnline()) {
            numMessages++;
        }
    });
};

export default {};
