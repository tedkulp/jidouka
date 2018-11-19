import * as Influx from 'influx';

import config from '../config';

export function useInflux() {
    return config.useInflux();
};

export const influx = new Influx.InfluxDB({
    host: config.getInfluxHost(),
    port: config.getInfluxPort(),
    database: config.getInfluxDbName(),
    schema: [
        {
            measurement: 'viewers',
            fields: {
                numViewers: Influx.FieldType.INTEGER,
            },
            tags: [
                'channel'
            ],
        },
        {
            measurement: 'messages',
            fields: {
                numMessages: Influx.FieldType.INTEGER,
            },
            tags: [
                'channel',
            ]
        },
        {
            measurement: 'events',
            fields: {
                title: Influx.FieldType.STRING,
                text: Influx.FieldType.STRING,
            },
            tags: [
                'type',
                'channel',
                'username',
                'amount',
            ],
        }
    ],
});