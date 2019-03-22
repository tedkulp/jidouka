import React, { Component } from 'react';
import './App.css';

import Wrapper from './components/Wrapper/Wrapper';
import { ApolloProvider } from 'react-apollo';
import apolloClient from './util/apollo-client';

class App extends Component {
    render() {
        return (
            <ApolloProvider client={apolloClient}>
                <div className="App">
                    <Wrapper />
                </div>
            </ApolloProvider>
        );
    }
}

export default App;
