import mongoose from 'mongoose';

// tslint:disable:variable-name

export interface ISetting {
    key: string;
    value: mongoose.Schema.Types.Mixed;
    updatedAt: Date;
    createdAt: Date;
}

export interface ISettingModel extends ISetting, mongoose.Document {}

export const SettingSchema: mongoose.Schema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, index: true },
        value: { type: mongoose.Schema.Types.Mixed, required: true }
    },
    {
        timestamps: true,
        collection: 'settings'
    }
);

export const SettingModel: mongoose.Model<ISettingModel> = mongoose.model<ISettingModel>(
    'SettingModel',
    SettingSchema
);
