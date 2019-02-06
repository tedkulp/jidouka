import mongoose from 'mongoose';

// tslint:disable:variable-name

export interface IEvent {
    eventType: string;
    message: string;
    amount: number;
    unit: string;
    misc: string;
    userId: number;
    username: string;
    updatedAt: Date;
    createdAt: Date;
}

export interface IEventModel extends IEvent, mongoose.Document {}

export const EventSchema: mongoose.Schema = new mongoose.Schema(
    {
        eventType: { type: String, required: true },
        message: { type: String, required: false },
        amount: { type: Number, required: false },
        unit: { type: String, required: false },
        misc: { type: String, required: false },
        userId: { type: Number, required: false },
        username: { type: String, required: true }
    },
    {
        timestamps: true,
        collection: 'events'
    }
);

export const EventModel: mongoose.Model<IEventModel> = mongoose.model<IEventModel>(
    'EventModel',
    EventSchema
);
