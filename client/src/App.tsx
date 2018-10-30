import * as React from 'react';
import './App.css';

import Wrapper from './components/Wrapper/Wrapper';
import { ApolloProvider } from 'react-apollo';
import apolloClient from './util/apollo-client';
// import logo from './logo.svg';

class App extends React.Component {
    public render() {
        return (
            <ApolloProvider client={apolloClient}>
                <div className="App">
                    <Wrapper />
                    {/* <UserList /> */}
                    {/* <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <h1 className="App-title">Welcome to React</h1>
                    </header>
                    <p className="App-intro">
                    To get started, edit <code>src/App.tsx</code> and save to reload.
                    </p> */}
                </div>
            </ApolloProvider>
        );
    }
}

export default App;
