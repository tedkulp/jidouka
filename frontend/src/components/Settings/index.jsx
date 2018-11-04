import * as React from 'react';
import { Route } from 'react-router';

import Authentication from './Authentication/Authentication';

export default function () {
    return (
        <div>
            <Route path='/settings/auth' component={Authentication} />
        </div>
    );
};
