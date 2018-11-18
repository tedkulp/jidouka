import { combineReducers } from 'redux';

import { reducer } from './components/redux';

export default combineReducers({
    status: reducer,
});
