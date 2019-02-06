import config from '../config';
import { UserModel } from '../models/user';

const resolvers = {
    user: async (_, args) => UserModel.findOne(args),
    users: async (_, args) => UserModel.find(args),
    userCount: async () => UserModel.count({}),
    config: () => config.toJSON()
};

export default resolvers;
