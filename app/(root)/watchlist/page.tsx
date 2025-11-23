'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import WatchlistButton from '@/components/WatchlistButton';
import NewsSection from '@/components/NewsSection';
import { WATCHLIST_TABLE_HEADER, ALERT_TYPE_OPTIONS } from '@/lib/constants';
import {
  getCurrentUserWatchlistWithData,
  removeFromWatchlist,
} from '@/lib/actions/watchlist.actions';
import {
  createPriceAlert,
  deleteAlert,
  getAlertsForCurrentUser,
  updateAlert,
} from '@/lib/actions/alert.actions';
import { getNews } from '@/lib/actions/finnhub.actions';
import {
  formatChangePercent,
  formatPrice,
  getAlertText,
  getChangeColorClass,
} from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SearchCommand from '@/components/SearchCommand';

type SelectedStockForAlert = {
  symbol: string;
  company: string;
  currentPrice?: number;
};

export default function WatchlistPage() {
  const router = useRouter();

  const [watchlist, setWatchlist] = useState<StockWithData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [news, setNews] = useState<MarketNewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<SelectedStockForAlert | null>(
    null,
  );
  const [alertForm, setAlertForm] = useState<AlertData | null>(null);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [isSavingAlert, setIsSavingAlert] = useState(false);
  const [deletingSymbol, setDeletingSymbol] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const [watchlistData, alertsData] = await Promise.all([
          getCurrentUserWatchlistWithData(),
          getAlertsForCurrentUser(),
        ]);
        if (cancelled) return;

        setWatchlist(watchlistData);
        setAlerts(alertsData);

        setIsNewsLoading(true);
        try {
          const symbols = watchlistData.map((item) => item.symbol);
          const newsData = await getNews(symbols.length ? symbols : undefined);
          if (!cancelled) {
            setNews(newsData);
          }
        } catch (err) {
          console.error('Error loading watchlist news', err);
        } finally {
          if (!cancelled) setIsNewsLoading(false);
        }
      } catch (err) {
        console.error('Error loading watchlist data', err);
        if (!cancelled) {
          toast.error('Failed to load your watchlist', {
            description: 'Please refresh the page or try again later.',
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [watchlistData, alertsData] = await Promise.all([
        getCurrentUserWatchlistWithData(),
        getAlertsForCurrentUser(),
      ]);

      setWatchlist(watchlistData);
      setAlerts(alertsData);

      setIsNewsLoading(true);
      try {
        const symbols = watchlistData.map((item) => item.symbol);
        const newsData = await getNews(symbols.length ? symbols : undefined);
        setNews(newsData);
      } catch (err) {
        console.error('Error refreshing news', err);
      } finally {
        setIsNewsLoading(false);
      }

      toast.success('Watchlist refreshed');
    } catch (err) {
      console.error('Error refreshing watchlist', err);
      toast.error('Failed to refresh watchlist', {
        description: 'Please try again.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const resetAlertDialogState = () => {
    setAlertDialogOpen(false);
    setSelectedStock(null);
    setAlertForm(null);
    setEditingAlertId(null);
    setIsSavingAlert(false);
  };

  const handleOpenCreateAlert = (stock: StockWithData) => {
    const currentPrice = stock.currentPrice;
    const defaultThreshold = currentPrice ?? 0;

    setSelectedStock({
      symbol: stock.symbol,
      company: stock.company,
      currentPrice,
    });

    setAlertForm({
      symbol: stock.symbol,
      company: stock.company,
      alertName:
        defaultThreshold > 0
          ? `Price above ${formatPrice(defaultThreshold)}`
          : 'Price alert',
      alertType: 'upper',
      threshold: defaultThreshold ? String(defaultThreshold) : '',
    });

    setEditingAlertId(null);
    setAlertDialogOpen(true);
  };

  const handleOpenEditAlert = (alert: Alert) => {
    setSelectedStock({
      symbol: alert.symbol,
      company: alert.company,
      currentPrice: alert.currentPrice,
    });

    setAlertForm({
      symbol: alert.symbol,
      company: alert.company,
      alertName: alert.alertName,
      alertType: alert.alertType,
      threshold: String(alert.threshold ?? ''),
    });

    setEditingAlertId(alert.id);
    setAlertDialogOpen(true);
  };

  const handleSubmitAlert = async (event: FormEvent) => {
    event.preventDefault();
    if (!alertForm) return;

    if (!alertForm.threshold || Number.isNaN(Number(alertForm.threshold))) {
      toast.error('Please enter a valid price threshold.');
      return;
    }

    setIsSavingAlert(true);
    try {
      if (editingAlertId) {
        const result = await updateAlert(editingAlertId, alertForm);
        if (!result.success || !result.alert) {
          toast.error('Failed to update alert', {
            description: result.message ?? 'Please try again.',
          });
          return;
        }

        setAlerts((prev) =>
          prev.map((existing) =>
            existing.id === editingAlertId ? result.alert! : existing,
          ),
        );
        toast.success('Alert updated', {
          description: `${result.alert.symbol} • ${getAlertText(result.alert)}`,
        });
      } else {
        const result = await createPriceAlert(alertForm);
        if (!result.success || !result.alert) {
          toast.error('Failed to create alert', {
            description: result.message ?? 'Please try again.',
          });
          return;
        }

        setAlerts((prev) => [result.alert!, ...prev]);
        toast.success('Alert created', {
          description: `${result.alert.symbol} • ${getAlertText(result.alert)}`,
        });
      }

      resetAlertDialogState();
    } catch (err) {
      console.error('Error saving alert', err);
      toast.error('Failed to save alert', {
        description: 'Please try again.',
      });
    } finally {
      setIsSavingAlert(false);
    }
  };

  const handleWatchlistChange = async (symbol: string, isInList: boolean) => {
    const upper = symbol.toUpperCase();

    if (!isInList) {
      // Removed
      setWatchlist((prev) => prev.filter((item) => item.symbol !== upper));
      setAlerts((prev) => prev.filter((alert) => alert.symbol !== upper));
      return;
    }

    // Added (e.g. from another page) – refresh from server to pick up pricing data
    try {
      const updated = await getCurrentUserWatchlistWithData();
      setWatchlist(updated);
    } catch (err) {
      console.error('Failed to refresh watchlist after add', err);
    }
  };

  const handleDeleteStock = async (symbol: string, company: string) => {
    const upper = symbol.toUpperCase();
    if (deletingSymbol === upper) return;

    setDeletingSymbol(upper);
    try {
      const result = await removeFromWatchlist(upper);
      if (!result.success) {
        toast.error('Failed to remove from watchlist', {
          description: result.message ?? 'Please try again.',
        });
        return;
      }

      setWatchlist((prev) => prev.filter((item) => item.symbol !== upper));
      setAlerts((prev) => prev.filter((alert) => alert.symbol !== upper));
      toast.success('Removed from watchlist', {
        description: `${upper} • ${company}`,
      });
    } catch (err) {
      console.error('Error removing stock from watchlist', err);
      toast.error('Something went wrong', {
        description: 'We could not update your watchlist. Please try again.',
      });
    } finally {
      setDeletingSymbol(null);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      const result = await deleteAlert(id);
      if (!result.success) {
        toast.error('Failed to delete alert', {
          description: result.message ?? 'Please try again.',
        });
        return;
      }

      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
      toast('Alert removed', {
        description: 'The alert has been removed.',
      });
    } catch (err) {
      console.error('Error deleting alert', err);
      toast.error('Failed to delete alert', {
        description: 'Please try again.',
      });
    }
  };

  return (
    <>
      <header className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="watchlist-title">Watchlist</h1>
          <p className="text-sm text-gray-500">
            Track your favorite stocks, manage price alerts, and follow related news.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SearchCommand renderAs="button" label="Add stock" initialStocks={[]} />
          <Button
            variant="outline"
            size="sm"
            className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 flex items-center gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </header>

      {isLoading ? (
        <section className="watchlist-container">
          <div className="watchlist">
            <div className="watchlist-table">
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full bg-gray-700" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-gray-700" />
                    <Skeleton className="h-3 w-24 bg-gray-700" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16 bg-gray-700" />
              </div>
            </div>
          </div>
        </section>
      ) : watchlist.length === 0 ? (
        <div className="watchlist-empty-container">
          <div className="watchlist-empty">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="watchlist-star"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
              />
            </svg>
            <h3 className="empty-title">Your watchlist is empty</h3>
            <p className="empty-description">
              Use the search to find stocks and add them to your personalized watchlist.
            </p>
            <SearchCommand renderAs="button" label="Add stocks" initialStocks={[]} />
          </div>
        </div>
      ) : (
        <section className="watchlist-container">
          {/* Left column: Watchlist table */}
          <div className="watchlist">
            <div className="watchlist-table">
              <table className="min-w-full table-fixed text-sm">
                <thead>
                  <tr className="table-header-row">
                    {WATCHLIST_TABLE_HEADER.map((header, index) => (
                      <th
                        key={header}
                        className={`table-header px-4 py-3 text-left text-xs font-medium uppercase tracking-wide ${
                          index >= 2 ? 'text-right' : ''
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {watchlist.map((stock) => {
                    const changeClass = getChangeColorClass(stock.changePercent);
                    const changeLabel = formatChangePercent(stock.changePercent) || '—';

                    return (
                      <tr
                        key={stock.symbol}
                        className="table-row"
                        onClick={() => router.push(`/stocks/${stock.symbol}`)}
                      >
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="watchlist-icon">
                              <span className="text-sm font-semibold text-gray-100">
                                {stock.symbol.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-100">
                                {stock.company}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-sm text-gray-300">
                          {stock.symbol}
                        </td>
                        <td className="px-4 py-3 align-middle text-right">
                          {typeof stock.currentPrice === 'number' ? (
                            <span className="table-cell">
                              {formatPrice(stock.currentPrice)}
                            </span>
                          ) : (
                            <Skeleton className="h-4 w-16 rounded bg-gray-700" />
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle text-right">
                          {typeof stock.changePercent === 'number' ? (
                            <span className={`text-sm font-medium ${changeClass}`}>
                              {changeLabel}
                            </span>
                          ) : (
                            <Skeleton className="h-4 w-12 rounded bg-gray-700" />
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle text-right text-sm text-gray-300">
                          {stock.marketCap ?? '—'}
                        </td>
                        <td className="px-4 py-3 align-middle text-right text-sm text-gray-300">
                          {stock.peRatio ?? '—'}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <button
                            className="add-alert"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCreateAlert(stock);
                            }}
                          >
                            <Bell className="h-4 w-4" />
                            <span>Add Alert</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center justify-end gap-3">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <WatchlistButton
                                symbol={stock.symbol}
                                company={stock.company}
                                isInWatchlist
                                type="icon"
                                onWatchlistChange={handleWatchlistChange}
                              />
                            </div>
                            <button
                              className="watchlist-icon-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteStock(stock.symbol, stock.company);
                              }}
                              disabled={deletingSymbol === stock.symbol.toUpperCase()}
                            >
                              <div className="watchlist-icon">
                                <Trash2 className="trash-icon" />
                              </div>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column: Alerts list */}
          <aside className="watchlist-alerts flex">
            <div className="flex w-full items-center justify-between pb-3">
              <h2 className="watchlist-title">Alerts</h2>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700"
                onClick={() => {
                  if (!watchlist.length) {
                    toast('Add a stock first', {
                      description:
                        'Add stocks to your watchlist to create price alerts.',
                    });
                    return;
                  }
                  handleOpenCreateAlert(watchlist[0]);
                }}
              >
                <Bell className="mr-2 h-4 w-4" />
                Create Alert
              </Button>
            </div>

            <div className="alert-list">
              {alerts.length === 0 ? (
                <div className="alert-empty">
                  No alerts yet. Use the watchlist table to add your first price alert.
                </div>
              ) : (
                alerts.map((alert) => {
                  const changeClass = getChangeColorClass(alert.changePercent);
                  const changeLabel = formatChangePercent(alert.changePercent) || '—';

                  return (
                    <div key={alert.id} className="alert-item">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="watchlist-icon">
                          <span className="text-sm font-semibold text-gray-100">
                            {alert.symbol.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="alert-name">{alert.company}</div>
                          <p className="text-xs text-gray-400">{alert.symbol}</p>
                        </div>
                        <span className={`text-sm font-medium ${changeClass}`}>
                          {changeLabel}
                        </span>
                      </div>

                      <div className="alert-details">
                        <div>
                          <p className="alert-company">Current</p>
                          <p className="alert-price">
                            {typeof alert.currentPrice === 'number'
                              ? formatPrice(alert.currentPrice)
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="alert-company">Condition</p>
                          <p className="alert-price">{getAlertText(alert)}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-300">
                          {alert.alertType === 'upper'
                            ? 'Price goes above'
                            : 'Price goes below'}
                        </span>
                      </div>

                      <div className="alert-actions mt-2">
                        <button
                          className="alert-update-btn px-3 py-1 text-xs flex items-center gap-1"
                          onClick={() => handleOpenEditAlert(alert)}
                        >
                          <Bell className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          className="alert-delete-btn px-3 py-1 text-xs flex items-center gap-1"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </section>
      )}

      {/* Bottom section: market news cards */}
      <NewsSection news={news} isLoading={isNewsLoading} />

      <Dialog
        open={alertDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetAlertDialogState();
          } else {
            setAlertDialogOpen(open);
          }
        }}
      >
        <DialogContent className="alert-dialog">
          <DialogHeader>
            <DialogTitle className="alert-title">
              {editingAlertId ? 'Edit price alert' : 'Create price alert'}
            </DialogTitle>
            <DialogDescription>
              Get notified when the price crosses your target level.
            </DialogDescription>
          </DialogHeader>

          {selectedStock && alertForm && (
            <form className="space-y-4" onSubmit={handleSubmitAlert}>
              <div className="space-y-2">
                <Label>Stock</Label>
                <div className="flex items-center justify-between rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200">
                  <span className="font-medium">
                    {selectedStock.company} ({selectedStock.symbol})
                  </span>
                  <span className="text-xs text-gray-400">
                    Current:{' '}
                    {typeof selectedStock.currentPrice === 'number'
                      ? formatPrice(selectedStock.currentPrice)
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alertName">Alert name</Label>
                <Input
                  id="alertName"
                  value={alertForm.alertName}
                  onChange={(e) =>
                    setAlertForm((prev) =>
                      prev ? { ...prev, alertName: e.target.value } : prev,
                    )
                  }
                  placeholder="e.g. Price breaks above $150"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="alertType">Alert type</Label>
                  <Select
                    value={alertForm.alertType}
                    onValueChange={(value) =>
                      setAlertForm((prev) =>
                        prev
                          ? { ...prev, alertType: value as 'upper' | 'lower' }
                          : prev,
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALERT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold">Threshold price</Label>
                  <Input
                    id="threshold"
                    type="number"
                    step="0.01"
                    min="0"
                    value={alertForm.threshold}
                    onChange={(e) =>
                      setAlertForm((prev) =>
                        prev ? { ...prev, threshold: e.target.value } : prev,
                      )
                    }
                    placeholder={
                      typeof selectedStock.currentPrice === 'number'
                        ? formatPrice(selectedStock.currentPrice)
                        : 'Enter target price'
                    }
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-600 text-gray-200 hover:bg-gray-800"
                  onClick={resetAlertDialogState}
                  disabled={isSavingAlert}
                >
                  Cancel
                </Button>
                <Button type="submit" className="yellow-btn" disabled={isSavingAlert}>
                  {isSavingAlert && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingAlertId ? 'Update alert' : 'Create alert'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
