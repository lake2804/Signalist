'use client';

import React from 'react';
import { formatTimeAgo } from '@/lib/utils';

type NewsSectionProps = {
  news?: MarketNewsArticle[];
  isLoading?: boolean;
};

const NewsSection: React.FC<NewsSectionProps> = ({ news, isLoading }) => {
  const hasNews = !!news && news.length > 0;

  return (
    <div className="mt-12">
      <h2 className="watchlist-title mb-6">News</h2>
      <div className="watchlist-news">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="news-item">
              <div className="mb-4 h-5 w-16 rounded bg-gray-700" />
              <div className="mb-3 h-5 w-3/4 rounded bg-gray-700" />
              <div className="mb-2 h-4 w-1/2 rounded bg-gray-700" />
              <div className="h-4 w-full rounded bg-gray-700" />
            </div>
          ))
        ) : !hasNews ? (
          <div className="alert-empty">
            No market news available right now. Please check back later.
          </div>
        ) : (
          news!.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="news-item"
            >
              <span className="news-tag">
                {item.related?.split(',')[0] || 'MARKET'}
              </span>
              <h3 className="news-title">{item.headline}</h3>
              <div className="news-meta">
                <span>{item.source}</span>
                <span className="mx-1">•</span>
                <span>{formatTimeAgo(item.datetime)}</span>
              </div>
              <p className="news-summary">{item.summary}</p>
              <button className="news-cta">Read More →</button>
            </a>
          ))
        )}
      </div>
    </div>
  );
};

export default NewsSection;
