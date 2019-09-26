import React from 'react';
import ReactDOM from 'react-dom';
import './Resources/css/styles.css';

import { BrowserRouter } from 'react-router-dom';

import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import promiseMiddleware from 'redux-promise';
import ReduxThunk from 'redux-thunk';

import Routes from './routes';
import Reducer from './reducers';



const createStoreWithMiddleware = applyMiddleware(promiseMiddleware,ReduxThunk)(createStore);
const store = createStoreWithMiddleware( Reducer , 
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())

ReactDOM.render(
    <Provider store={store}>
        <BrowserRouter>
            <Routes />
        </BrowserRouter>
    </Provider>

, document.getElementById('root'));

