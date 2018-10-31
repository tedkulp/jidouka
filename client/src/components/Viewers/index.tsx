import * as React from 'react';
import { Route } from 'react-router';

import List from './List';

export default function () {
    return (
        <div>
            <Route path='/viewers' component={List} />
        </div>
    );
};
