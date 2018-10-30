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
        createdAt: ISODate
        updatedAt: ISODate
    }

    type Query {
        user(twitchId: Int, username: String): User
        users(username: String, twitchId: Int): [User]
        userCount: Int
    }

    scalar ISODate
`;

const resolvers = { ISODate, Query };

// export default makeExecutableSchema({ typeDefs, resolvers });
export default new ApolloServer({ typeDefs, resolvers, debug: true });
