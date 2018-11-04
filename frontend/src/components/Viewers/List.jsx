import * as React from 'react';
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Table, TableHead, TableBody, TableRow, TableCell, Paper, createStyles } from '@material-ui/core';

const GET_USERS = gql`
{
    users {
        twitchId
        username
        watchedTime
        createdAt
    }
}`;

const styles = ({ palette, spacing }) => createStyles({
    root: {
        width: '100%',
        overflowX: 'auto',
    },
    tableContainer: {
        minWidth: 700,
    },
});

const formatSeconds = (totalSeconds) => {
    let result = '';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
    const seconds = totalSeconds - (hours * 3600) - (minutes * 60);

    if (hours > 0) {
        result = result + `${hours}h `;
    }

    if (minutes > 0) {
        result = result + `${minutes}m `;
    }

    result = result + `${seconds}s`;

    return result;
}

const UserList = (props) => {
    const { classes } = props;

    return (
        <div>
            <Typography variant="h4" gutterBottom={true} component="h2">
                Viewers
            </Typography>
            <div className={classes.tableContainer}>
                <Query query={GET_USERS}>
                    {({ loading, error, data }) => {
                        if (loading) {
                            return "Loading...";
                        }
                        if (error) {
                            return `Error! ${error.message}`;
                        }

                        return (
                            <Paper className={classes.root}>
                                <Table className={classes.tableContainer}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Twitch ID</TableCell>
                                            <TableCell>Username</TableCell>
                                            <TableCell numeric={true}>Watched Time</TableCell>
                                            <TableCell>First Seen</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.users.map((user) => (
                                            <TableRow key={user.twitchId}>
                                                <TableCell>{user.twitchId}</TableCell>
                                                <TableCell>{user.username}</TableCell>
                                                <TableCell numeric={true}>{formatSeconds(user.watchedTime)}</TableCell>
                                                <TableCell>{user.createdAt}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Paper>
                        );
                    }}
                </Query>
            </div>
        </div>
    );
};

export default withStyles(styles)(UserList);
