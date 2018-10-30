import * as React from 'react';
import { Route } from 'react-router';

import Dashboard from './Dashboard';

export default function() {
  return (
    <div>
      <Route path='/' exact={true} component={Dashboard} />
    </div>
  );
};
