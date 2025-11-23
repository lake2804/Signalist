'use server';

import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';
import { getNews } from '@/lib/actions/finnhub.actions';
import { NEWS_SUMMARY_EMAIL_PROMPT } from '@/lib/inngest/prompts';
import { NEWS_SUMMARY_EMAIL_TEMPLATE } from '@/lib/nodemailer/templates';
import { getFormattedTodayDate } from '@/lib/utils';

/**
 * Generate a full News Summary email HTML for a given user email.
 *
 * This mirrors the Inngest `sendDailyNewsSummary` logic:
 * - Fetch watchlist symbols for the user
 * - Pull recent news via Finnhub
 * - Summarize via Gemini using the same NEWS_SUMMARY_EMAIL_PROMPT
 * - Inject into NEWS_SUMMARY_EMAIL_TEMPLATE with today's date
 */
export async function generateNewsSummaryEmailHtmlForUser(email: string): Promise<{
  html: string;
  newsContent: string;
}> {
  if (!email) {
    throw new Error('Email is required to generate news summary preview');
  }

  // Step 1: Get symbols from the user's watchlist and fetch news
  const symbols = await getWatchlistSymbolsByEmail(email);

  let articles = await getNews(symbols);
  articles = (articles || []).slice(0, 6);

  // Fallback to general market news if nothing for watchlist
  if (!articles || articles.length === 0) {
    articles = await getNews();
    articles = (articles || []).slice(0, 6);
  }

  // Step 2: Call Gemini directly using the same prompt as Inngest
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
    '{{newsData}}',
    JSON.stringify(articles, null, 2),
  );

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Gemini generateContent failed ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  const part = data?.candidates?.[0]?.content?.parts?.[0];
  const newsContent: string =
    (part && typeof part.text === 'string' ? part.text : null) ||
    'No market news available today.';

  // Step 3: Inject into the full email template with today's formatted date
  const date = getFormattedTodayDate();
  const html = NEWS_SUMMARY_EMAIL_TEMPLATE
    .replace('{{date}}', date)
    .replace('{{newsContent}}', newsContent);

  return { html, newsContent };
}
