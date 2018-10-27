import * as React from 'react';
import './App.css';

import Dashboard from './Dashboard/Dashboard';
// import logo from './logo.svg';

class App extends React.Component {
    public render() {
        return (
            <div className="App">
                <Dashboard />
                {/* <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <h1 className="App-title">Welcome to React</h1>
                </header>
                <p className="App-intro">
                To get started, edit <code>src/App.tsx</code> and save to reload.
                </p> */}
            </div>
        );
    }
}

export default App;
