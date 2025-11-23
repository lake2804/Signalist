"use client";

import React from "react";
import InngestAIPreviewDialog from "@/components/InngestAIPreviewDialog";
import { NEWS_SUMMARY_EMAIL_TEMPLATE } from "@/lib/nodemailer/templates";

const SAMPLE_NEWS_SUMMARY_CONTENT = `
<h3 class="mobile-news-title dark-text" style="margin: 30px 0 15px 0; font-size: 20px; font-weight: 600; color: #f8f9fa; line-height: 1.3;">Today's Market Highlights</h3>

<div class="dark-info-box" style="background-color: #212328; padding: 24px; margin: 20px 0; border-radius: 8px;">
  <h4 class="dark-text" style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #FDD458; line-height: 1.4;">
    Inflation and Tariffs Could Challenge Back-to-School Spending
  </h4>
  <ul style="margin: 16px 0 20px 0; padding-left: 0; margin-left: 0; list-style: none;">
    <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
      <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>Families face higher prices for everyday items like food and school supplies.
    </li>
    <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
      <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>New tariffs on imported goods are making some back-to-school items more expensive.
    </li>
    <li class="dark-text-secondary" style="margin: 0 0 16px 0; padding: 0; margin-left: 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
      <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>These pressures could make the stock market more unpredictable for consumer and retail stocks.
    </li>
  </ul>
  <div style="background-color: #141414; border: 1px solid #374151; padding: 15px; border-radius: 6px; margin: 16px 0;">
    <p class="dark-text-secondary" style="margin: 0; font-size: 14px; color: #CCDADC; line-height: 1.4;">💡 <strong style="color: #FDD458;">Bottom Line:</strong> Back-to-school costs are rising, so budget-conscious families may spend less on non-essential items this season.</p>
  </div>
  <div style="margin: 20px 0 0 0;">
    <a href="https://example.com/article1" style="color: #FDD458; text-decoration: none; font-weight: 500; font-size: 14px;" target="_blank" rel="noopener noreferrer">Read Full Story →</a>
  </div>
</div>
`;

type NewsSummaryPreviewTriggerProps = {
  /**
   * Full email HTML generated from the real Inngest-style pipeline.
   * If not provided, we fall back to a static sample so the UI still works.
   */
  html?: string;
};

const NewsSummaryPreviewTrigger: React.FC<NewsSummaryPreviewTriggerProps> = ({ html }) => {
  const [open, setOpen] = React.useState(false);

  // Open the dialog automatically when the component mounts (first page load).
  React.useEffect(() => {
    setOpen(true);
  }, []);

  const fallbackHtml = NEWS_SUMMARY_EMAIL_TEMPLATE
    .replace("{{date}}", "Friday, September 5, 2025")
    .replace("{{newsContent}}", SAMPLE_NEWS_SUMMARY_CONTENT);

  const finalHtml = html || fallbackHtml;

  return (
    <>
      {/* Small button fixed to the top-right to reopen the summary any time */}
      <button
        type="button"
        className="summary-floating-btn"
        onClick={() => setOpen(true)}
      >
        <span className="hidden md:inline">Today's market summary</span>
        <span className="md:hidden">Summary</span>
      </button>

      <InngestAIPreviewDialog
        html={finalHtml}
        title="Today's Market News Summary"
        triggerLabel="Preview News Summary Email"
        open={open}
        onOpenChange={setOpen}
        hideTrigger
      />
    </>
  );
};

export default NewsSummaryPreviewTrigger;
