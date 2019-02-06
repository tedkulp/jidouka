import * as React from 'react';

import { createStyles, withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const styles = ({ palette, spacing }) =>
    createStyles({
        root: {
            display: 'flex'
        }
    });

const GET_CONFIG = gql`
    {
        config {
            options {
                hostname
                clientId
            }
            stateToken
            scopes {
                streamer
                bot
            }
        }
    }
`;

class Authentication extends React.Component {
    // TODO: Use scope lists from gql instead
    streamerScopes = [
        'chat:edit',
        'chat:read',
        'whispers:read',
        'whispers:edit',
        'channel_subscriptions',
        'channel_check_subscription'
    ];

    botScopes = [
        'channel:moderate',
        'chat:edit',
        'chat:read',
        'whispers:read',
        'whispers:edit',
        'channel_editor',
        'channel_commercial',
        'clips:edit',
        'user:edit:broadcast',
        'user:read:broadcast'
    ];

    generateOauthUrl(type, config) {
        let scope = this.streamerScopes.join('+');
        if (type === 'bot') {
            scope = this.botScopes.join('+');
        }

        let url = 'https://id.twitch.tv/oauth2/authorize';
        url += `?client_id=${config.options.clientId}`;
        url += `&redirect_uri=${config.options.hostname}/oauth`;
        url += `&state=${type}:${config.stateToken}`;
        url += `&response_type=code&scope=${scope}`;

        return url;
    }

    render() {
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
                        <div>
                            <h2>Authentication</h2>

                            <h3>Streamer</h3>

                            <Button
                                variant="outlined"
                                href={this.generateOauthUrl('streamer', data.config)}
                            >
                                Authenticate to Twitch
                            </Button>

                            <h3>Bot</h3>

                            <Button
                                variant="outlined"
                                href={this.generateOauthUrl('bot', data.config)}
                            >
                                Authenticate to Twitch
                            </Button>
                        </div>
                    );
                }}
            </Query>
        );
    }
}

export default withStyles(styles)(Authentication);
