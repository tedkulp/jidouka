import * as React from 'react';

import { createStyles, withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

import { Query } from "react-apollo";
import gql from "graphql-tag";

const styles = ({ palette, spacing }) => createStyles({
    root: {
        display: 'flex',
    },
});

const GET_CONFIG = gql`
{
    config {
        options {
            hostname
            clientId
        }
        stateToken
    }
}`;

// interface IProps {
//     classes: any,
// };

class Authentication extends React.Component {
    render() {
        // const { classes } = this.props as IProps;

        return (
            <Query query={GET_CONFIG}>
                {({ loading, error, data }) => {
                    if (loading) {
                        return "Loading...";
                    }
                    if (error) {
                        return `Error! ${error.message}`;
                    }

                    return (
                        <div>
                            <h2>Authentication</h2>

                            <Button variant="outlined" href={this.generateOauthUrl(data.config)}>Authenticate to Twitch</Button>
                        </div>
                    );
                }}
            </Query>
        );
    }

    generateOauthUrl(config) {
        let url = 'https://id.twitch.tv/oauth2/authorize';
        url += `?client_id=${config.options.clientId}`;
        url += `&redirect_uri=${config.options.hostname}/oauth`;
        url += `&state=${config.stateToken}`
        url += '&response_type=code&scope=channel_subscriptions+channel_check_subscription';

        return url;
    }
}

export default withStyles(styles)(Authentication);
