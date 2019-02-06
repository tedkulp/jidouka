import * as React from 'react';
import * as _ from 'lodash';
import { Route, withRouter } from 'react-router';

import Dashboard from './Dashboard';

import './index.scss';

class DashboardIndex extends React.Component {
    getDisplayValue() {
        return _.get(this.props, 'location.pathname', '') === '/' ? 'block' : 'none';
    }

    render() {
        return (
            <div style={{ display: this.getDisplayValue() }}>
                <Route path="/" component={Dashboard} />
            </div>
        );
    }
}

export default withRouter(DashboardIndex);
