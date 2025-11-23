import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface AlertDocument extends Document {
  userId: string;
  symbol: string;
  company: string;
  alertName: string;
  alertType: 'upper' | 'lower';
  threshold: number;
  currentPrice?: number;
  changePercent?: number;
  createdAt: Date;
}

const AlertSchema = new Schema<AlertDocument>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    alertName: { type: String, required: true, trim: true },
    alertType: { type: String, required: true, enum: ['upper', 'lower'] },
    threshold: { type: Number, required: true },
    currentPrice: { type: Number },
    changePercent: { type: Number },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

AlertSchema.index({ userId: 1, symbol: 1, alertType: 1, threshold: 1 }, { unique: true });

export const Alert: Model<AlertDocument> =
  (models.Alert as Model<AlertDocument>) || model<AlertDocument>('Alert', AlertSchema);
