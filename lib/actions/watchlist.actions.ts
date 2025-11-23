'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { getStockOverview } from '@/lib/actions/finnhub.actions';
import { formatMarketCapValue } from '@/lib/utils';

export async function getCurrentUserWatchlistWithData(): Promise<StockWithData[]> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return [];

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const items = await Watchlist.find({ userId: session.user.id })
      .sort({ addedAt: -1 })
      .lean();

    if (!items || items.length === 0) return [];

    const overviews = await Promise.all(
      items.map(async (item) => {
        try {
          const overview = await getStockOverview(item.symbol);
          return { symbol: item.symbol, overview };
        } catch (e) {
          console.error('getCurrentUserWatchlistWithData overview error', item.symbol, e);
          return { symbol: item.symbol, overview: {} } as {
            symbol: string;
            overview: {
              currentPrice?: number;
              changePercent?: number;
              marketCapUsd?: number;
              peRatio?: number;
            };
          };
        }
      }),
    );

    const overviewMap = new Map<string, {
      currentPrice?: number;
      changePercent?: number;
      marketCapUsd?: number;
      peRatio?: number;
    }>();

    overviews.forEach(({ symbol, overview }) => {
      overviewMap.set(symbol.toUpperCase(), overview);
    });

    const result: StockWithData[] = items.map((item) => {
      const key = String(item.symbol || '').toUpperCase();
      const o = overviewMap.get(key) ?? {};

      const marketCapFormatted =
        typeof o.marketCapUsd === 'number'
          ? formatMarketCapValue(o.marketCapUsd * 1_000_000)
          : undefined;

      const peRatioFormatted =
        typeof o.peRatio === 'number' ? o.peRatio.toFixed(1) : undefined;

      return {
        userId: session.user.id,
        symbol: key,
        company: item.company,
        addedAt: item.addedAt ?? new Date(),
        currentPrice: o.currentPrice,
        changePercent: o.changePercent,
        priceFormatted:
          typeof o.currentPrice === 'number'
            ? `$${o.currentPrice.toFixed(2)}`
            : undefined,
        changeFormatted:
          typeof o.changePercent === 'number'
            ? `${o.changePercent > 0 ? '+' : ''}${o.changePercent.toFixed(2)}%`
            : undefined,
        marketCap: marketCapFormatted,
        peRatio: peRatioFormatted,
      };
    });

    return result;
  } catch (err) {
    console.error('getCurrentUserWatchlistWithData error:', err);
    return [];
  }
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Better Auth stores users in the "user" collection
    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

export async function isStockInWatchlist(symbol: string): Promise<boolean> {
  if (!symbol) return false;

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return false;

    await connectToDatabase();

    const exists = await Watchlist.exists({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    });

    return Boolean(exists);
  } catch (err) {
    console.error('isStockInWatchlist error:', err);
    return false;
  }
}

export async function addToWatchlist(symbol: string, company: string): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    await connectToDatabase();

    const symbolUpper = symbol.toUpperCase();

    const existing = await Watchlist.findOne({
      userId: session.user.id,
      symbol: symbolUpper,
    });

    if (existing) {
      return { success: false, message: 'Already in watchlist' };
    }

    await Watchlist.create({
      userId: session.user.id,
      symbol: symbolUpper,
      company,
      addedAt: new Date(),
    });

    return { success: true, message: 'Added to watchlist' };
  } catch (err) {
    console.error('addToWatchlist error:', err);
    return { success: false, message: 'Failed to add to watchlist' };
  }
}

export async function removeFromWatchlist(symbol: string): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    await connectToDatabase();

    const result = await Watchlist.deleteOne({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    });

    if (result.deletedCount === 0) {
      return { success: false, message: 'Stock not in watchlist' };
    }

    return { success: true, message: 'Removed from watchlist' };
  } catch (err) {
    console.error('removeFromWatchlist error:', err);
    return { success: false, message: 'Failed to remove from watchlist' };
  }
}
