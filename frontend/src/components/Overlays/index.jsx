import * as React from 'react';
import { withRouter } from 'react-router';

import ViewerCount from './ViewerCount';

import './index.scss';

class OverlayIndex extends React.Component {
    render() {
        const { classes } = this.props;

        return (
            <div className="overlay-wrapper">
                <ViewerCount />
            </div>
        );
    }
}

export default withRouter(OverlayIndex);
