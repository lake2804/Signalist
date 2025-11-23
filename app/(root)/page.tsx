import TradingViewWidget from "@/components/TradingViewWidget";
import {
    HEATMAP_WIDGET_CONFIG,
    MARKET_DATA_WIDGET_CONFIG,
    MARKET_OVERVIEW_WIDGET_CONFIG,
    TOP_STORIES_WIDGET_CONFIG
} from "@/lib/constants";
import NewsSummaryPreviewTrigger from "@/components/NewsSummaryPreviewTrigger";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { generateNewsSummaryEmailHtmlForUser } from "@/lib/actions/news-summary-preview.actions";

const Home = async () => {
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    let newsSummaryHtml: string | undefined;

    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (session?.user?.email) {
            const { html } = await generateNewsSummaryEmailHtmlForUser(session.user.email);
            newsSummaryHtml = html;
        }
    } catch (error) {
        console.error("Failed to load news summary preview", error);
    }

    return (
        <div className="flex min-h-screen home-wrapper">
          <section className="grid w-full gap-8 home-section">
              <div className="md:col-span-1 xl:col-span-1">
                  <TradingViewWidget
                    title="Market Overview"
                    scriptUrl={`${scriptUrl}market-overview.js`}
                    config={MARKET_OVERVIEW_WIDGET_CONFIG}
                    className="custom-chart"
                    height={600}
                  />
              </div>
              <div className="md-col-span xl:col-span-2">
                  <TradingViewWidget
                      title="Stock Heatmap"
                      scriptUrl={`${scriptUrl}stock-heatmap.js`}
                      config={HEATMAP_WIDGET_CONFIG}
                      height={600}
                  />
              </div>
          </section>
            <section className="grid w-full gap-8 home-section">
                <div className="h-full md:col-span-1 xl:col-span-1">
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}timeline.js`}
                        config={TOP_STORIES_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
                <div className="h-full md:col-span-1 xl:col-span-2">
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}market-quotes.js`}
                        config={MARKET_DATA_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
            </section>
            <NewsSummaryPreviewTrigger html={newsSummaryHtml} />
        </div>
    )
}

export default Home;
