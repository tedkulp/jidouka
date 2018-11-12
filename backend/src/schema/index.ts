import { gql, ApolloServer } from 'apollo-server-express';
import Query from './query';
import ISODate from './ISODate';

const typeDefs = gql`
    type User {
        id: ID!
        twitchId: Int
        username: String
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

const resolvers = { ISODate, Query };

// export default makeExecutableSchema({ typeDefs, resolvers });
export default new ApolloServer({ typeDefs, resolvers, debug: true });
