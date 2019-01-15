import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';

momentDurationFormatSetup(moment);

const initialState = {
    numViewers: 0,
    gameTitle: '',
    gameId: 0,
    online: false,
    onlineStartTime: null,
    language: '',
    title: '',
    uptime: '0:00',
};

export const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'socket-action/STATUS.STREAM':
            return Object.assign({}, state, {
                gameId: action.gameId,
                gameTitle: action.gameTitle,
                language: action.language,
                numViewers: action.numViewers,
                online: action.online,
                onlineStartTime: action.onlineStartTime,
                title: action.title,
                uptime: moment.duration(moment().diff(moment(action.onlineStartTime))).format(),
            });
        default:
            return state;
    };
};
