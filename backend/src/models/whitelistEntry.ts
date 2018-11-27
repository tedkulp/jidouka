import mongoose from 'mongoose';

import { IListEntryModel } from './listEntry';

export const WhitelistEntrySchema: mongoose.Schema = new mongoose.Schema({
    createdByUser: { type: String, required: true },
    entryText: { type: String },
    active: { type: Boolean, required: true, default: true },
}, {
    timestamps: true,
    collection: 'whitelist',
});

export const WhitelistEntryModel: mongoose.Model<IListEntryModel> = mongoose.model<IListEntryModel>('WhitelistEntryModel', WhitelistEntrySchema);
