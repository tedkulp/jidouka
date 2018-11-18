import * as React from 'react';
import { Route, withRouter } from 'react-router';

import ViewerCount from './ViewerCount';

class OverlayIndex extends React.Component {
    render() {
        return (
            <div>
                <ViewerCount />
                {/* <Route path='/overlays/viewer_count' component={ViewerCount} /> */}
            </div>
        );
    }
}

export default withRouter(OverlayIndex);
