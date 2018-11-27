import mongoose from 'mongoose';

import { IListEntryModel } from './listEntry';

export const BlacklistEntrySchema: mongoose.Schema = new mongoose.Schema({
    createdByUser: { type: String, required: true },
    entryText: { type: String },
    active: { type: Boolean, required: true, default: true },
}, {
    timestamps: true,
    collection: 'blacklist',
});

export const BlacklistEntryModel: mongoose.Model<IListEntryModel> = mongoose.model<IListEntryModel>('BlacklistEntryModel', BlacklistEntrySchema);
