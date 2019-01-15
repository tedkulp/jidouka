import * as React from 'react';
import { createStyles, withStyles } from '@material-ui/core/styles';
import { Button, Card, CardHeader, CardContent } from '@material-ui/core';

import socket from '../../../util/socket';

const styles = ({ palette, spacing }) => createStyles({
    root: {
        display: 'flex',
    },
});

class DevTools extends React.Component {
    clickFollow() {
        socket.emit('event', {
            event: 'webhook.follow',
            data: {
                from_id: '12345',
                from_name: 'test_follower',
                to_id: '12346',
                to_name: 'streamer',
                followed_at: Date.now(),
            },
        });
    }

    render() {
        const { classes } = this.props;

        return (
            <div>
                <Card className={classes.card}>
                    <CardHeader title="Dev Utilities" />
                    <CardContent className={classes.cardContent}>
                        <Button variant="outlined" onClick={this.clickFollow}>Test Follow</Button>
                        <Button variant="outlined" onClick={this.clickSubscribe}>Test Subscribe</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
}

export default withStyles(styles)(DevTools);
