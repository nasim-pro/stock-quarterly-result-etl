
// scrape/nseFilings.ts

import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";

const USER_AGENTS: string[] = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
];

const CHOSEN_UA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
const jar = new CookieJar();

// TypeScript-safe way — define separately, then wrap
const client = wrapper( axios.create({ withCredentials: true, timeout: 20000,}));

// Add cookie support
(client.defaults as any).jar = jar; // attach jar dynamically (avoids TS error)

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms = 1000): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getHeaders() {
    return {
        "User-Agent": CHOSEN_UA,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Origin: "https://www.nseindia.com",
        Referer: "https://www.nseindia.com/companies-listing/corporate-integrated-filing?integratedType=integratedfilingfinancials",
        Connection: "keep-alive",
        DNT: "1",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
    };
}

/**
 * Preflight to set NSE cookies (simulate browser)
 */
async function preflight(): Promise<void> {
    try {
        await client.get("https://www.nseindia.com", { headers: getHeaders() });
        await sleep(randomInt(600, 1500));

        await client.get(
            "https://www.nseindia.com/companies-listing/corporate-integrated-filing?integratedType=integratedfilingfinancials",
            { headers: getHeaders() }
        );

        console.log("Preflight successful, cookies set.");
        await sleep(randomInt(600, 1500));
    } catch (err: any) {
        console.error("Preflight failed:", err.message || err.code);
    }
}

/**
 * Remove duplicates by stock symbol
 */
function removeDuplicatesBySymbol<T extends { symbol?: string }>(arr: T[]): T[] {
    const seen = new Set<string>();
    return arr.filter((item) => {
        if (!item?.symbol) return true;
        if (seen.has(item.symbol)) return false;
        seen.add(item.symbol);
        return true;
    });
}

/**
 * Fetch NSE corporate integrated financial filings
 */
export async function fetchNSEFinancialFilings(

): Promise<any[] | null> {
    const page = 1;
    const size = 60;
    const url = `https://www.nseindia.com/api/integrated-filing-results?&type=Integrated%20Filing-%20Financials&page=${page}&size=${size}`;

    try {
        await sleep(randomInt(600, 1500));
        await preflight();

        const response = await client.get(url, {
            headers: getHeaders(),
            timeout: 20000,
        });

        const filings = removeDuplicatesBySymbol(response?.data?.data || []);
        console.log(`Fetched ${filings.length} filings.`);
        return filings;
    } catch (err: any) {
        console.warn("Initial fetch failed, retrying...");
        try {
            await sleep(randomInt(800, 2000));
            await preflight();

            const response = await client.get(url, {
                headers: getHeaders(),
                timeout: 20000,
            });

            const filings = removeDuplicatesBySymbol(response?.data?.data || []);
            console.log(`Fetched ${filings.length} filings after retry.`);
            return filings;
        } catch (err2: any) {
            console.error(
                "Error fetching NSE filings:",
                err2.response?.status,
                err2.message
            );
            return null;
        }
    }
}

// Example usage
// (async () => {
//     const data = await fetchNSEFinancialFilings();
//     console.log(JSON.stringify(data, null, 2));
// })();
