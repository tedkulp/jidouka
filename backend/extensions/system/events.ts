import events from '../../src/events';
import { EventModel } from '../../src/models/event';

events.addListener('webhook', 'follow', (details, _) => {
    EventModel.create({
        eventType: 'follow',
        userId: details['from_id'],
        username: details['from_name'],
    });
});

events.addListener('chat', 'sub', (details, _) => {
    EventModel.create({
        eventType: 'sub',
        message: details['message'],
        misc: details['method'],
        userId: details['userstate']['user-id'],
        username: details['username'],
    });
});

events.addListener('chat', 'resub', (details, _) => {
    EventModel.create({
        eventType: 'resub',
        message: details['message'],
        amount: details['months'],
        unit: 'months',
        // misc: details['methods'], // Can't find docs on what this would be
        userId: details['userstate']['user-id'],
        username: details['username'],
    });
});

events.addListener('chat', 'cheer', (details, _) => {
    EventModel.create({
        eventType: 'bits',
        message: details['message'],
        amount: details['userstate']['bits'],
        unit: 'bits',
        // misc: details['method'],
        userId: details['userstate']['user-id'],
        username: details['username'],
    });
});

events.addListener('chat', 'hosted', (details, _) => {
    EventModel.create({
        eventType: 'host',
        amount: details['viewers'],
        unit: 'viewers',
        misc: 'autohost: ' + details['autohost'] ? 'true' : 'false',
        username: details['username'],
    });
});

export default {};
