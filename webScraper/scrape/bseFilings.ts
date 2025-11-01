
// scrape/bseFilings.ts
import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";

// Create cookie jar and axios instance with it
const jar = new CookieJar();

const client = wrapper( axios.create({ withCredentials: true, timeout: 20000,}));

// attach jar to axios defaults (avoid passing unknown 'jar' in create options to satisfy TypeScript)
(client.defaults as any).jar = jar;

const USER_AGENTS: string[] = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
];

const CHOSEN_UA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

function sleep(ms = 1000): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getHeaders() {
    return {
        "User-Agent": CHOSEN_UA,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Origin: "https://www.bseindia.com",
        Referer: "https://www.bseindia.com/corporates/ann.aspx",
        Connection: "keep-alive",
        DNT: "1",
        "Sec-Fetch-Site": "same-site",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
    };
}

/**
 * Preflight to simulate browser visiting BSE pages
 */
async function preflight(): Promise<void> {
    try {
        await client.get("https://www.bseindia.com", {
            headers: getHeaders(),
        });
        await sleep(800);

        await client.get("https://www.bseindia.com/corporates/ann.html", {
            headers: getHeaders(),
        });

        console.log("✅ BSE Preflight successful.");
        await sleep(1000);
    } catch (err: any) {
        console.error("❌ BSE Preflight failed:", err.message || err.code);
    }
}

/**
 * Convert JS Date to YYYYMMDD string
 */
function formatDateYYYYMMDD(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
}

/**
 * Remove duplicates by company/scripCode
 */
function removeBseDuplicates<T extends { scripCode?: string; company?: string }>(arr: T[]): T[] {
    const seen = new Set<string>();
    return arr.filter((item) => {
        const keySource = item?.scripCode ?? item?.company ?? "";
        const key = keySource.toString().trim().toLowerCase();
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Fetch BSE financial results for yesterday
 */
export async function fetchBSEFinancialResults(): Promise<any[] | null> {
    const page = 1;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const fromDate = formatDateYYYYMMDD(yesterday);
    const toDate = formatDateYYYYMMDD(yesterday);

    const url = `https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?pageno=${page}&strCat=Result&strPrevDate=${fromDate}&strScrip=&strSearch=P&strToDate=${toDate}&strType=C&subcategory=Financial+Results`;

    try {
        await sleep(700);
        await preflight();

        const response = await client.get(url, {
            headers: getHeaders(),
        });

        const rawData = response?.data || {};
        const results = (rawData?.Table || []).map((item: any) => ({
            id: item.NEWSID,
            company: item?.SLONGNAME,
            scripCode: item?.SCRIP_CD,
            date: item?.NEWS_DT || item?.News_submission_dt,
            headline: item?.HEADLINE,
        }));

        return removeBseDuplicates(results);
    } catch (err: any) {
        console.error("⚠️ Error fetching BSE filings:", err.response?.status, err.message);
        return null;
    }
}

// Example usage
// (async () => {
//   const data = await fetchBSEFinancialResults();
//   console.log(JSON.stringify(data, null, 2));
// })();
