import * as _ from 'lodash';
import mongoose from 'mongoose';

import CommandManager from '../../src/commands';

// tslint:disable:variable-name

export interface ICustomCommand {
    commandName: string;
    message: string;
    timesRun: number;
    updatedAt: Date;
    createdAt: Date;
}

export interface ICustomCommandModel extends ICustomCommand, mongoose.Document {}

export const CustomCommandSchema: mongoose.Schema = new mongoose.Schema(
    {
        commandName: { type: String, required: true },
        message: { type: String, required: true },
        timesRun: { type: Number, required: true, default: 0 }
    },
    {
        timestamps: true,
        collection: 'customCommands'
    }
);

export const CustomCommandModel: mongoose.Model<ICustomCommandModel> = mongoose.model<
    ICustomCommandModel
>('CustomCommandModel', CustomCommandSchema);

export function graphQLConfig() {
    return {
        schema: `
            type CustomCommand {
                id: ID!
                commandName: String
                message: String
                timesRun: Int
                createdAt: ISODate
                updatedAt: ISODate
            }

            type Query {
                customCommands: [CustomCommand]
            }

            type Mutation {
                addCustomCommand(commandName: String!, message: String!): CustomCommand
                editCustomCommand(id: String!, commandName: String!, message: String!): CustomCommand
                deleteCustomCommand(id: String!): Boolean
            }
        `,
        resolvers: {
            Query: {
                customCommands: async (_i, args) => CustomCommandModel.find(args)
            },
            Mutation: {
                addCustomCommand: async (_root, args) => {
                    return CustomCommandModel.create(args).then(res => {
                        unregisterCommands();
                        return registerCommands().then(() => {
                            return _.isArray(res) ? _.first(res) : res;
                        });
                    });
                },
                editCustomCommand: async (_root, args) => {
                    return CustomCommandModel.findOneAndUpdate({ _id: args.id }, args)
                        .exec()
                        .then(res => {
                            unregisterCommands();
                            return registerCommands().then(() => {
                                return _.isArray(res) ? _.first(res) : res;
                            });
                        });
                },
                deleteCustomCommand: async (_root, args) => {
                    return CustomCommandModel.findOneAndDelete({ _id: args.id })
                        .exec()
                        .then(res => {
                            unregisterCommands();
                            return registerCommands().then(() => {
                                return true;
                            });
                        });
                }
            }
        }
    };
}

let commands: ICustomCommand[] = [];

function registerCommands() {
    return CustomCommandModel.find().then(res => {
        res.forEach(cmd => {
            CommandManager.register(cmd.commandName, () => {
                return cmd
                    .update({
                        $inc: {
                            timesRun: 1
                        }
                    })
                    .exec()
                    .then(() => {
                        return cmd.message;
                    });
            });
            commands.push(cmd);
        });
    });
}

function unregisterCommands() {
    commands.forEach(cmd => {
        CommandManager.unregister(cmd.commandName);
    });

    commands = [];
}

registerCommands();

export default {};
