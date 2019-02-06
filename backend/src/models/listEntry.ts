import mongoose from 'mongoose';

export interface IListEntry {
    createdByUser: string;
    entryText: string;
    active: boolean;
    updatedAt: Date;
    createdAt: Date;
}

export interface IListEntryModel extends IListEntry, mongoose.Document {}
