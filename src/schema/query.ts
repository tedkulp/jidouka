import { UserModel } from '../models/user';

const resolvers = {
    user: async (_, args) => await UserModel.findOne(args),
    users: async (_, args) => {
        console.log(args);
        return await UserModel.find(args);
    },
    userCount: async () => await UserModel.count({}),
};

export default resolvers;
