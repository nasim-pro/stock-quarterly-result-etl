import type { StockData } from "../types.ts";
import { sendTeleGramMessage } from "./sendTelegramMessage.ts";

// interface GrowthRate {
//     oldGrowthRate?: number;
//     newGrowthRate?: number;
//     jumpPercent?: number;
// }

// interface Recommendation {
//     EPS?: GrowthRate;
//     Sales?: GrowthRate;
//     PAT?: GrowthRate;
//     OP?: GrowthRate;
//     PE?: number;
//     PEG?: number;
//     decision?: string;
// }

// interface Company {
//     ticker?: string;
//     stockName?: string;
//     recommendation: Recommendation;
//     roe?: number;
//     DPS?: number | string;
//     quarters?: string[];
// }

/**
 * Helper to safely get values or return fallback
 */
const safe = (value: any, fallback = "-"): string | number => {
    return value !== undefined && value !== null ? value : fallback;
};

/**
 * Format a Telegram-friendly message for a single company
 */
function formatMobileMessage(company: StockData): string {
    const r = company.recommendation || {};
    
    const latestQuarter = safe(company.quarters?.[company.quarters?.length - 1]);

    return `
📢 *${safe(company.ticker, company.stockName)}* (${latestQuarter})

GROWTH RATE CAGR:
EPS: ${safe(r?.EPS?.oldGrowthRate)}% → ${safe(r.EPS?.newGrowthRate)}%
Sales: ${safe(r?.Sales?.oldGrowthRate)}% → ${safe(r.Sales?.newGrowthRate)}%
PAT: ${safe(r?.PAT?.oldGrowthRate)}% → ${safe(r.PAT?.newGrowthRate)}%
OP: ${safe(r?.OP?.oldGrowthRate)}% → ${safe(r.OP?.newGrowthRate)}%

YOY JUMP PERCENT:
EPS: ${safe(r?.EPS?.jumpPercent)}%
Sales: ${safe(r?.Sales?.jumpPercent)}%
PAT: ${safe(r?.PAT?.jumpPercent)}%
OP: ${safe(r?.OP?.jumpPercent)}%

PE: ${safe(r?.PE)} | PEG: ${safe(r?.PEG)} | ROE: ${safe(company?.roe)}%
DPS: ${safe(company?.DPS)}
Decision: ${safe(r?.decision)}
`.trim();
}

/**
 * Send formatted messages for an array of companies
 */
export async function sendCompanyResults(companies: StockData[]): Promise<void> {
    for (const company of companies) {
        if (company.recommendation.decision != "BUY") continue;
        const message = formatMobileMessage(company);
        await sendTeleGramMessage(message);
    }
}
