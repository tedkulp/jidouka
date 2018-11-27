import mongoose from 'mongoose';

export interface IListEntry {
    createdByUser: String,
    entryText: String,
    active: Boolean,
    updatedAt: Date,
    createdAt: Date,
};

export interface IListEntryModel extends IListEntry, mongoose.Document {
};
