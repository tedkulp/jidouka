import { createStore as _createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import reducer from './reducer';
import { connectRouter, routerMiddleware } from 'connected-react-router';
import logger from 'redux-logger';
import createHistory from 'history/createBrowserHistory';
// import socket from './util/socket';

export function createStore(historyObj, client, data) {
    const composeEnhancers = window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] || compose;
    const historyMiddleware = routerMiddleware(historyObj);
    const middleware = [thunk, historyMiddleware, logger];
    const finalCreateStore = composeEnhancers(applyMiddleware(...middleware))(_createStore);
    return finalCreateStore(connectRouter(historyObj)(reducer), data);
}

export const history = createHistory();
export const store = createStore(history, null, {});
export const dispatch = store.dispatch;
