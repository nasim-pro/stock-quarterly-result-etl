

/**
 * scrape/stockDetailsFromScreener.ts
 *
 * Node.js version (with cookie + cheerio)
 * Scrapes Finology Ticker company pages (financial results)
 * Returns quarterly + yearly filings, valuation ratios, and ownership data.
 */

import axios from "axios";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import { searchFinology } from "./finologySearch.ts";

// Cookie setup
const jar = new CookieJar();
const client = wrapper(
    axios.create({
        withCredentials: true,
        timeout: 20000,
    })
);
(client.defaults as any).jar = jar;

export function getScripCode(symbol: string): string | null {
    // @ts-ignore
    const mapping = stockMapping.find(
        (m: { symbol: string }) => m.symbol.toUpperCase() === symbol.toUpperCase()
    );
    return mapping?.scripCode || null;
}

// UA Pool
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
];

const CHOSEN_UA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const defaultHeaders = {
    "User-Agent": CHOSEN_UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://www.google.com/",
};

// === Helpers ===
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function sleep(ms = 1000): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
}

// === Core Scraper ===
export async function stockDetailsFromScreener(ticker: string): Promise<any | null> {
    try {
        await sleep(randomInt(400, 1000));
        const baseUrl = "https://ticker.finology.in/Company/";

        let resp: any = null;
        try {
            resp = await client.get(baseUrl + ticker, { headers: defaultHeaders });
        } catch {
            try {
                const comArr = await searchFinology(ticker);
                const code = comArr[0]?.FINCODE;
                if (code) {
                    resp = await client.get(baseUrl + `SCRIP-${code}`, {
                        headers: defaultHeaders,
                    });
                }
            } catch {
                console.log("Fallback with FINCODE failed");
            }
        }

        if (!resp?.data) return null;

        const $ = cheerio.load(resp.data);

        // === Quarters ===
        const quarters: string[] = [];
        $("h4:contains('Quarterly Result')")
            .closest(".card")
            .find("table thead th")
            .each((i: number, el: any) => {
                if (i > 0) quarters.push($(el).text().trim());
            });

        // === Years ===
        const years: string[] = [];
        $("#profit table thead tr th").each((i: number, el: any) => {
            if (i > 0) years.push($(el).text().trim());
        });

        // === Quarterly Data ===
        const quarterlyTable = $("#mainContent_quarterly table tbody");
        const quarterlyData: any = {
            quarterlySales: [],
            quarterlyEps: [],
            quarterlyPat: [],
            quarterlyOpProfit: [],
        };

        quarterlyTable.find("tr").each((_: any, tr: any) => {
            const rowName = $(tr)
                .find("th")
                .clone()
                .children()
                .remove()
                .end()
                .text()
                .replace(/\s+/g, " ")
                .trim();

            const values: (number | null)[] = [];
            $(tr)
                .find("td span")
                .each((__: any, td: any) => {
                    values.push(parseFloat($(td).text().trim()) || null);
                });

            if (/Net Sales|Operating Revenue|Interest Earned/i.test(rowName))
                quarterlyData.quarterlySales = values;
            else if (/EPS/i.test(rowName)) quarterlyData.quarterlyEps = values;
            else if (/Profit After Tax|Net Profit/i.test(rowName))
                quarterlyData.quarterlyPat = values;
            else if (/Operating Profit|Profit Before Tax/i.test(rowName))
                quarterlyData.quarterlyOpProfit = values;
        });

        // === Yearly Data ===
        const yearlyTable = $("#profit table tbody");
        const yearlyData: any = {
            yearlySales: [],
            yearlyEps: [],
            yearlyOpProfit: [],
            yearlyPat: [],
        };

        yearlyTable.find("tr").each((_: any, tr: any) => {
            const rowName = $(tr)
                .find("th")
                .clone()
                .children()
                .remove()
                .end()
                .text()
                .replace(/\s+/g, " ")
                .trim();

            const values: (number | null)[] = [];
            $(tr)
                .find("td span")
                .each((__: any, td: any) => {
                    values.push(parseFloat($(td).text().trim()) || null);
                });

            if (/Net Sales|Operating Income/i.test(rowName))
                yearlyData.yearlySales = values;
            else if (/EPS/i.test(rowName)) yearlyData.yearlyEps = values;
            else if (/Operating Profit|Net Interest Income/i.test(rowName))
                yearlyData.yearlyOpProfit = values;
            else if (/Net Profit|Profit After Tax/i.test(rowName))
                yearlyData.yearlyPat = values;
        });

        // === Ratios / Stats ===
        const peRatio =
            parseFloat(
                $("small:contains('P/E')").parent().find("p").first().text().trim()
            ) || null;

        const currentPrice =
            parseFloat($("#mainContent_clsprice .currprice .Number").first().text().trim()) ||
            null;

        const marketCap =
            parseFloat(
                $("small:contains('Market Cap')")
                    .parent()
                    .find("p .Number")
                    .first()
                    .text()
                    .trim()
            ) || null;

        const debt =
            parseFloat($("#mainContent_ltrlDebt .Number").first().text().trim()) ||
            null;

        const promoterHolding =
            parseFloat(
                $("small:contains('Promoter Holding')")
                    .parent()
                    .find("p")
                    .first()
                    .text()
                    .replace("%", "")
                    .trim()
            ) || null;

        const roe =
            parseFloat(
                $("small:contains('ROE')")
                    .parent()
                    .find(".Number")
                    .first()
                    .text()
                    .trim()
            ) || null;

        const roce =
            parseFloat(
                $("small:contains('ROCE')")
                    .parent()
                    .find(".Number")
                    .first()
                    .text()
                    .trim()
            ) || null;

        return {
            quarters,
            quarterlySales: quarterlyData.quarterlySales,
            quarterlyPat: quarterlyData.quarterlyPat,
            quarterlyEps: quarterlyData.quarterlyEps,
            quarterlyOpProfit: quarterlyData.quarterlyOpProfit,
            years,
            yearlySales: yearlyData.yearlySales,
            yearlyEps: yearlyData.yearlyEps,
            yearlyOpProfit: yearlyData.yearlyOpProfit,
            yearlyPat: yearlyData.yearlyPat,
            peRatio,
            currentPrice,
            marketCap,
            debt,
            promoterHolding,
            roe,
            roce,
        };
    } catch (err: any) {
        console.error("Scraper error:", err.message);
        return null;
    }
}
