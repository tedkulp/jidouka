import mongoose from 'mongoose';

// tslint:disable:variable-name

export interface IUser {
    twitchId?: number;
    username?: string;
    displayName?: string;
    watchedTime: number;
    followDate: Date;
    numMessages: number;
    updatedAt: Date;
    createdAt: Date;
}

export interface IUserModel extends IUser, mongoose.Document {}

export const UserSchema: mongoose.Schema = new mongoose.Schema(
    {
        twitchId: { type: Number, required: true, unique: true, index: true },
        username: { type: String, required: true, index: true }, // Not unique in weird cases of username switches
        displayName: { type: String },
        watchedTime: { type: Number, required: true, default: 0 },
        followDate: { type: Date },
        numMessages: { type: Number, required: true, default: 0 }
    },
    {
        timestamps: true,
        collection: 'users'
    }
);

export const UserModel: mongoose.Model<IUserModel> = mongoose.model<IUserModel>(
    'UserModel',
    UserSchema
);
