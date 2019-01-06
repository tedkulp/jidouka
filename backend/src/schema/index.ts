import { ApolloServer, mergeSchemas, makeExecutableSchema } from 'apollo-server-express';
import Query from './query';
import ISODate from './ISODate';
import extMgr from '../extensions';

const typeDefs = `
    type User {
        id: ID!
        username: String
        twitchId: Int
        displayName: String
        watchedTime: Int
        numMessages: Int
        followDate: ISODate
        createdAt: ISODate
        updatedAt: ISODate
    }

    type ConfigUser {
        username: String
    }

    type ConfigOptions {
        hostname: String
        clientId: String
    }

    type ConfigScopes {
        streamer: [String]
        bot: [String]
    }

    type Config {
        streamer: ConfigUser
        bot: ConfigUser
        options: ConfigOptions
        stateToken: String
        scopes: ConfigScopes
    }

    type Query {
        user(twitchId: Int, username: String): User
        users(username: String, twitchId: Int): [User]
        userCount: Int
        config: Config
    }

    scalar ISODate
`;

let server = null;

export function getServer() {
    if (!server) {
        const extensionConfigs = extMgr.getGraphQLConfig();
        const extensionSchemas = extensionConfigs.map(e => e.schema).filter(e => !!e);
        const extensionResolvers = extensionConfigs.map(e => e.resolvers).filter(e => !!e);
        const resolvers = { ISODate, Query };

        const mainSchema = makeExecutableSchema({
            typeDefs,
            resolvers,
        });

        const merged = mergeSchemas({
            schemas: [ mainSchema, ...extensionSchemas ],
            resolvers: [ resolvers, ...extensionResolvers ],
        });

        server = new ApolloServer({
            schema: merged,
            debug: true,
        });
    }

    return server;
};
