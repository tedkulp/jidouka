import * as React from 'react';
import { Route } from 'react-router';

import Authentication from './Authentication/Authentication';
import CustomCommands from './CustomCommands/CustomCommands';

export default function () {
    return (
        <div>
            <Route path='/settings/auth' component={Authentication} />
            <Route path='/settings/custcmds' component={CustomCommands} />
        </div>
    );
};
