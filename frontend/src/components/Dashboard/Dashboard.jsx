import * as React from 'react';
import { connect } from 'react-redux';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

import { createStyles, withStyles } from '@material-ui/core/styles';
import { Card, CardContent, CardHeader, Grid } from '@material-ui/core';

const GET_CONFIG = gql`
    {
        config {
            streamer {
                username
            }
        }
    }
`;

const styles = ({ palette, spacing }) =>
    createStyles({
        root: {
            display: 'flex'
        },
        card: {
            // maxWidth: 450,
        },
        cardContent: {
            height: 400
        }
    });

class Dashboard extends React.Component {
    render() {
        const { classes, status } = this.props;

        return (
            <Query query={GET_CONFIG}>
                {({ loading, error, data }) => {
                    if (loading) {
                        return 'Loading...';
                    }
                    if (error) {
                        return `Error! ${error.message}`;
                    }

                    return (
                        <Grid container={true} spacing={24}>
                            <Grid item={true} xs={6}>
                                <Card className={classes.card}>
                                    <CardContent>
                                        Game: {status.gameTitle}
                                        <br />
                                        Title: {status.title}
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item={true} xs={6}>
                                <Card className={classes.card}>
                                    <CardContent>
                                        {status.online && (
                                            <span>
                                                Current: {status.numViewers} - Chat Messages: 25 -
                                                Uptime: {status.uptime}
                                                <br />
                                            </span>
                                        )}
                                        Views: 854 - Followers: 110 - Subs: 1
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item={true} xs={6}>
                                <Card className={classes.card}>
                                    <CardHeader title="Stream Monitor" />
                                    <CardContent className={classes.cardContent}>
                                        {/* <iframe style={{ width: '100%', height: '100%' }} title="Preview Window" src={`https://player.twitch.tv/?channel=${data.config.streamer.username}&autoplay=true&muted=true`} frameBorder="0" /> */}
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item={true} xs={6}>
                                <Card className={classes.card}>
                                    <CardHeader title="Chat" />
                                    <CardContent className={classes.cardContent}>
                                        {/* <iframe style={{ width: '100%', height: '100%' }} title="Chat Widget" id={data.config.streamer.username} src={`https://twitch.tv/embed/${data.config.streamer.username}/chat`} scrolling="no" frameBorder="0" /> */}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    );
                }}
            </Query>
        );
    }
}

const mapStateToProps = state => {
    return {
        status: state.status
    };
};

export default connect(mapStateToProps)(withStyles(styles)(Dashboard));
