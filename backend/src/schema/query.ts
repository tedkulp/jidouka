import { UserModel } from '../models/user';
import config from '../config';

const resolvers = {
    user: async (_, args) => await UserModel.findOne(args),
    users: async (_, args) => await UserModel.find(args),
    userCount: async () => await UserModel.count({}),
    config: () => config.toJSON(),
};

export default resolvers;
