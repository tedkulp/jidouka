import * as React from 'react';
import * as _ from 'lodash';
import { Route, withRouter } from 'react-router';

import Dashboard from './Dashboard';

class DashboardIndex extends React.Component<any> {

    public getDisplayValue() {
        return _.get(this.props, 'location.pathname', '') === '/' ? 'block' : 'none';
    }

    public render() {
        return (
            <div style={{ display: this.getDisplayValue() }}>
                <Route path='/' component={Dashboard} />
            </div>
        );
    }
}

export default withRouter(DashboardIndex);
