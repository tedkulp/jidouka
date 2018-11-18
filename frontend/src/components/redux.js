const initialState = {
    numViewers: 0,
    gameTitle: '',
    gameId: 0,
    online: false,
    onlineStartTime: null,
    language: '',
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
            });
        default:
            return state;
    };
};
