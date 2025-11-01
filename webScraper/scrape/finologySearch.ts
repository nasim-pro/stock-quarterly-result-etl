

// scrape/finologySearch.ts
import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";

// Setup cookie jar
const jar = new CookieJar();
const client = wrapper(
    axios.create({
        withCredentials: true,
        timeout: 20000,
    })
);

(client.defaults as any).jar = jar;

const USER_AGENTS: string[] = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
];

const CHOSEN_UA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms = 1000): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getHeaders() {
    return {
        "User-Agent": CHOSEN_UA,
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://ticker.finology.in/",
        "X-Requested-With": "XMLHttpRequest",
        DNT: "1",
        Connection: "keep-alive",
    };
}

/**
 * Preflight request to simulate browser visiting the site
 */
async function preflight(): Promise<void> {
    try {
        await client.get("https://ticker.finology.in", {
            headers: getHeaders(),
        });
        await sleep(randomInt(400, 1000));

        console.log("Preflight successful.");
    } catch (err: any) {
        console.error("Preflight request failed:", err.message || err.code);
    }
}

/**
 * Search company on Finology Ticker
 * @param query - stock symbol or part of company name
 */
export async function searchFinology(query: string): Promise<any | null> {
    const url = `https://ticker.finology.in/GetSearchData.ashx?q=${encodeURIComponent(query)}`;

    try {
        await preflight();

        const response = await client.get(url, {
            headers: getHeaders(),
        });
        console.log("search query", query);
        console.log("response", response.data);

        return response?.data;
    } catch (err: any) {
        console.error("Error searching Finology:", err.response?.status, err.message);
        return null;
    }
}


// (async () => {
//     const data = await searchFinology('tcs');
//     console.log(JSON.stringify(data, null, 2));
// })();

