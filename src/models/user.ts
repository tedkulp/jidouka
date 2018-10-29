import mongoose from 'mongoose';

export interface IUser {
    twitchId?: number;
    username?: string;
    displayName?: string;
    watchedTime: number;
}

export interface IUserModel extends IUser, mongoose.Document {
}

export const UserSchema: mongoose.Schema = new mongoose.Schema({
    twitchId: { type: Number, required: true, unique: true },
    username: { type: String, required: true }, // Not unique in weird cases of username switches
    displayName: { type: String },
    watchedTime: { type: Number, required: true, default: 0 },
}, {
    timestamps: true,
    collection: 'users',
});

export const UserModel: mongoose.Model<IUserModel> = mongoose.model<IUserModel>('UserModel', UserSchema);
