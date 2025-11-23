'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Alert } from '@/database/models/alert.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { getStockOverview } from '@/lib/actions/finnhub.actions';

function mapAlert(doc: any): Alert {
  return {
    id: String(doc._id),
    symbol: doc.symbol,
    company: doc.company,
    alertName: doc.alertName,
    alertType: doc.alertType,
    threshold: doc.threshold,
    currentPrice: doc.currentPrice ?? 0,
    changePercent: doc.changePercent ?? 0,
  };
}

export async function getAlertsForCurrentUser(): Promise<Alert[]> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return [];

    await connectToDatabase();
    const docs = await Alert.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();
    return docs.map(mapAlert);
  } catch (err) {
    console.error('getAlertsForCurrentUser error:', err);
    return [];
  }
}

export async function createPriceAlert(data: AlertData): Promise<{
  success: boolean;
  message: string;
  alert?: Alert;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const symbolUpper = data.symbol.toUpperCase();

    await connectToDatabase();

    // Fetch latest price/change so we can snapshot into the alert record
    let currentPrice: number | undefined;
    let changePercent: number | undefined;
    try {
      const overview = await getStockOverview(symbolUpper);
      currentPrice = overview.currentPrice;
      changePercent = overview.changePercent;
    } catch (e) {
      console.error('createPriceAlert getStockOverview error', symbolUpper, e);
    }

    const doc = await Alert.create({
      userId: session.user.id,
      symbol: symbolUpper,
      company: data.company,
      alertName: data.alertName,
      alertType: data.alertType,
      threshold: Number(data.threshold),
      currentPrice,
      changePercent,
    });

    return { success: true, message: 'Alert created', alert: mapAlert(doc) };
  } catch (err: any) {
    console.error('createPriceAlert error:', err);
    if (err?.code === 11000) {
      return { success: false, message: 'An alert with this configuration already exists.' };
    }
    return { success: false, message: 'Failed to create alert' };
  }
}

export async function updateAlert(
  id: string,
  data: AlertData,
): Promise<{
  success: boolean;
  message: string;
  alert?: Alert;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const symbolUpper = data.symbol.toUpperCase();

    await connectToDatabase();

    let currentPrice: number | undefined;
    let changePercent: number | undefined;
    try {
      const overview = await getStockOverview(symbolUpper);
      currentPrice = overview.currentPrice;
      changePercent = overview.changePercent;
    } catch (e) {
      console.error('updateAlert getStockOverview error', symbolUpper, e);
    }

    const doc = await Alert.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      {
        symbol: symbolUpper,
        company: data.company,
        alertName: data.alertName,
        alertType: data.alertType,
        threshold: Number(data.threshold),
        currentPrice,
        changePercent,
      },
      { new: true },
    ).lean();

    if (!doc) {
      return { success: false, message: 'Alert not found' };
    }

    return { success: true, message: 'Alert updated', alert: mapAlert(doc) };
  } catch (err: any) {
    console.error('updateAlert error:', err);
    if (err?.code === 11000) {
      return {
        success: false,
        message: 'An alert with this configuration already exists.',
      };
    }
    return { success: false, message: 'Failed to update alert' };
  }
}

export async function deleteAlert(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    await connectToDatabase();

    const result = await Alert.deleteOne({ _id: id, userId: session.user.id });
    if (result.deletedCount === 0) {
      return { success: false, message: 'Alert not found' };
    }

    return { success: true, message: 'Alert deleted' };
  } catch (err) {
    console.error('deleteAlert error:', err);
    return { success: false, message: 'Failed to delete alert' };
  }
}
