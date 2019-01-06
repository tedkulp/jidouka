import * as React from 'react';

import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';

import { Mutation } from "react-apollo";
import { adopt } from 'react-adopt';
import gql from "graphql-tag";
import { GET_CONFIG } from './CustomCommands';
import { Formik, Field, Form } from 'formik';
import { TextField } from 'formik-material-ui';

const ADD_COMMAND = gql`
mutation AddCustomCommand($commandName: String!, $message: String!) {
    addCustomCommand(commandName: $commandName, message: $message) {
        id
        commandName
        message
        timesRun
    }
}`;

const EDIT_COMMAND = gql`
mutation EditCustomCommand($id: String!, $commandName: String!, $message: String!) {
    editCustomCommand(id: $id, commandName: $commandName, message: $message) {
        id
        commandName
        message
        timesRun
    }
}`;

const addCommand = ({ render }) => (
    <Mutation mutation={ADD_COMMAND}>
        {(mutation, result) => render({ mutation, result })}
    </Mutation>
);

const editCommand = ({ render }) => (
    <Mutation mutation={EDIT_COMMAND}>
        {(mutation, result) => render({ mutation, result })}
    </Mutation>
)

const Mutations = adopt({
    addCommand,
    editCommand,
});

class CustomCommandsForm extends React.Component {
    state = {
        open: false,
        values: {
            commandName: '',
            message: '',
        },
    };

    handleClickOpen = (cmdObj = null) => {
        this.setState({ open: true });
        if (cmdObj) {
            this.setState({ values: cmdObj });
        } else {
            this.setState({ values: {
                commandName: '',
                message: '',
            }});
        }
    };

    handleClose = () => {
        this.setState({ open: false });
    };
MutationsMutations
    render() {
        return (
            <Mutations>
                {(mutations) => (
                    <Dialog open={this.state.open} onClose={this.handleClose} aria-labelledby="custom-command-form">
                        <Formik
                            initialValues={this.state.values}
                            validate={values => {
                                const errors = {};
                                if (!values.commandName) {
                                    errors.commandName = 'Required';
                                } else if (!values.commandName.startsWith('!')) {
                                    errors.commandName = 'Must start with a !';
                                } else if (values.commandName.length < 3) {
                                    errors.commandName = 'Must be at least 3 characters long';
                                }

                                if (!values.message) {
                                    errors.message = 'Required';
                                }
                                return errors;
                            }}
                            onSubmit={(values, { setSubmitting }) => {
                                let cmd = mutations.addCommand.mutation;
                                if (values.id) {
                                    cmd = mutations.editCommand.mutation;
                                }
                                cmd({
                                    variables: values,
                                    refetchQueries: [{
                                        query: GET_CONFIG,
                                    }],
                                }).then(resp => {
                                    setSubmitting(false);
                                    this.setState({ open: false });
                                });
                            }}
                            render={({ submitForm, isSubmitting, isValid }) => (
                                <Form>
                                    <DialogTitle id="custom-command-form">Add/Edit Custom Command</DialogTitle>

                                    <DialogContent>
                                        <DialogContentText>
                                            To subscribe to this website, please enter your email address here. We will send
                                            updates occasionally.
                                        </DialogContentText>

                                        <Field
                                            type="text"
                                            label="Command Name"
                                            name="commandName"
                                            fullWidth
                                            margin="dense"
                                            autoFocus
                                            component={TextField}
                                        />

                                        <Field
                                            type="text"
                                            label="Response Text"
                                            name="message"
                                            fullWidth
                                            margin="dense"
                                            component={TextField}
                                        />
                                    </DialogContent>

                                    <DialogActions>
                                        <Button onClick={this.handleClose.bind(this)} disabled={isSubmitting} color="primary">
                                            Cancel
                                        </Button>
                                        <Button onClick={submitForm} disabled={isSubmitting} color="primary">
                                            Submit
                                        </Button>
                                    </DialogActions>
                                </Form>
                            )}
                        />
                    </Dialog>
                )}
            </Mutations>
        );
    }
}

export default CustomCommandsForm;
