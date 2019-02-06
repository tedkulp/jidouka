import * as React from 'react';

import { createStyles, withStyles } from '@material-ui/core/styles';
import {
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Paper,
    Fab,
    IconButton,
    Menu,
    MenuItem
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import MoreVertIcon from '@material-ui/icons/MoreVert';

import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './Form';

const styles = theme =>
    createStyles({
        root: {
            display: 'flex'
        },
        fab: {
            position: 'absolute',
            bottom: theme.spacing.unit * 2,
            right: theme.spacing.unit * 2
        }
    });

export const GET_CONFIG = gql`
    {
        customCommands {
            id
            commandName
            message
            timesRun
        }
    }
`;

const DELETE_COMMAND = gql`
    mutation DeleteCustomCommand($id: String!) {
        deleteCustomCommand(id: $id)
    }
`;

class ListItemMenu extends React.Component {
    state = {
        anchorEl: null
    };

    handleClick = event => {
        this.setState({ anchorEl: event.currentTarget });
    };

    handleClose = () => {
        this.setState({ anchorEl: null });
    };

    onEditClick = cmd => {
        this.props.onEditClick(cmd);
        this.setState({ anchorEl: null });
    };

    onDeleteClick = cmd => {
        this.props.onDeleteClick(cmd);
        this.setState({ anchorEl: null });
    };

    render() {
        const { cmd } = this.props;
        const { anchorEl } = this.state;

        return (
            <TableCell>
                <IconButton
                    aria-owns={`simple-menu-${cmd.id}`}
                    aria-haspopup="true"
                    onClick={this.handleClick}
                >
                    <MoreVertIcon />
                </IconButton>

                <Menu
                    id={`simple-menu-${cmd.id}`}
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleClose}
                >
                    <MenuItem onClick={() => this.onEditClick(cmd)}>Edit</MenuItem>
                    <MenuItem onClick={() => this.onDeleteClick(cmd)}>Delete</MenuItem>
                </Menu>
            </TableCell>
        );
    }
}

class CustomCommands extends React.Component {
    deleteCustomCommand = null;

    constructor(props) {
        super(props);
        this.form = React.createRef();
    }

    onAddClick = () => {
        this.form.current.handleClickOpen();
    };

    onEditClick = cmdObj => {
        this.form.current.handleClickOpen(cmdObj);
    };

    onDeleteClick = cmdObj => {
        if (this.deleteCustomCommand) {
            this.deleteCustomCommand({
                variables: cmdObj,
                refetchQueries: [
                    {
                        query: GET_CONFIG
                    }
                ]
            });
        }
    };

    render() {
        const { classes } = this.props;

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
                        <Mutation mutation={DELETE_COMMAND}>
                            {deleteCustomCommand => {
                                this.deleteCustomCommand = deleteCustomCommand;
                                return (
                                    <React.Fragment>
                                        <Form ref={this.form} />
                                        <Paper className={classes.root}>
                                            <Table className={classes.tableContainer}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Command</TableCell>
                                                        <TableCell>Message</TableCell>
                                                        <TableCell align="right">
                                                            Times Run
                                                        </TableCell>
                                                        <TableCell />
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {data.customCommands.map(cmd => (
                                                        <TableRow key={cmd.id}>
                                                            <TableCell>{cmd.commandName}</TableCell>
                                                            <TableCell>{cmd.message}</TableCell>
                                                            <TableCell align="right">
                                                                {cmd.timesRun}
                                                            </TableCell>
                                                            <ListItemMenu
                                                                key={cmd.id}
                                                                cmd={cmd}
                                                                onEditClick={this.onEditClick}
                                                                onDeleteClick={this.onDeleteClick}
                                                            />
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </Paper>
                                        <Fab
                                            color="primary"
                                            className={classes.fab}
                                            onClick={this.onAddClick}
                                        >
                                            <AddIcon />
                                        </Fab>
                                    </React.Fragment>
                                );
                            }}
                        </Mutation>
                    );
                }}
            </Query>
        );
    }
}

export default withStyles(styles, { withTheme: true })(CustomCommands);
