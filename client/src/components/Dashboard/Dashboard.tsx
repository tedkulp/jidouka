import * as React from 'react';

import { createStyles, withStyles } from '@material-ui/core/styles';
import { Theme, Card, CardContent, CardHeader, Grid } from '@material-ui/core';

const styles = ({ palette, spacing }: Theme) => createStyles({
    root: {
        display: 'flex',
    },
    card: {
        // maxWidth: 450,
    },
    cardContent: {
        height: 400,
    },
});

interface IProps {
    classes: any,
};

class Dashboard extends React.Component {
    public render() {
        const { classes } = this.props as IProps;

        return (
            <Grid container={true} spacing={24}>
                <Grid item={true} xs={6}>
                    <Card className={classes.card}>
                        <CardHeader title="Stream Monitor" />
                        <CardContent className={classes.cardContent}>
                            <iframe style={{ width: '100%', height: '100%' }} src={"https://player.twitch.tv/?channel=n3rdstreettv&autoplay=true&muted=true"} frameBorder="0" />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item={true} xs={6}>
                    <Card className={classes.card}>
                        <CardHeader title="Chat" />
                        <CardContent className={classes.cardContent}>
                            <iframe style={{ width: '100%', height: '100%' }} id="n3rdstreettv" src={"https://twitch.tv/embed/n3rdstreettv/chat"} scrolling="no" frameBorder="0" />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    }
}

export default withStyles(styles)(Dashboard);
