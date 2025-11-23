"use client";
import React, { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [isPending, startTransition] = useTransition();

  // Keep local state in sync with server-provided watchlist status
  useEffect(() => {
    setAdded(!!isInWatchlist);
  }, [isInWatchlist]);

  const label = useMemo(() => {
    if (type === "icon") return "";
    if (isPending) return added ? "Removing..." : "Adding...";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type, isPending]);

  const handleClick = () => {
    if (isPending) return;

    const targetState = !added;

    // Optimistic update for snappy UI
    setAdded(targetState);
    onWatchlistChange?.(symbol, targetState);

    startTransition(async () => {
      try {
        const result = targetState
          ? await addToWatchlist(symbol, company)
          : await removeFromWatchlist(symbol);

        if (!result?.success) {
          // Revert on failure
          setAdded(!targetState);
          onWatchlistChange?.(symbol, !targetState);

          toast.error("Watchlist update failed", {
            description: result?.message ?? "Please try again.",
          });
          return;
        }

        toast.success(targetState ? "Added to watchlist" : "Removed from watchlist", {
          description: `${symbol.toUpperCase()} • ${company}`,
        });
      } catch (error) {
        console.error("WatchlistButton error", error);
        setAdded(!targetState);
        onWatchlistChange?.(symbol, !targetState);
        toast.error("Something went wrong", {
          description: "We couldn't update your watchlist. Please try again.",
        });
      }
    });
  };

  if (type === "icon") {
    return (
      <button
        type="button"
        disabled={isPending}
        title={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        aria-label={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""}`}
        onClick={handleClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={added ? "#FACC15" : "none"}
          stroke="#FACC15"
          strokeWidth="1.5"
          className="watchlist-star"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      className={`watchlist-btn ${added ? "watchlist-remove" : ""}`}
      onClick={handleClick}
    >
      {showTrashIcon && added ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 mr-2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6" />
        </svg>
      ) : null}
      <span>{label}</span>
    </button>
  );
};

export default WatchlistButton;