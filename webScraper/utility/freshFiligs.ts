
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface Filing {
    creation_Date: string;
    [key: string]: any;
}

/**
 * Parse a "DD-Mon-YYYY HH:MM:SS" string in IST → JS Date
 */
function parseDate(customDateString: string): Date {
    const IST_OFFSET_MINUTES = 330; // +5:30
    const monthMap: Record<string, number> = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };

    const regex = /(\d{2})-(\w{3})-(\d{4}) (\d{2}):(\d{2}):(\d{2})/;
    const parts = customDateString.match(regex);
    if (!parts) return new Date(NaN);

    const [_, d, m, y, h, min, s] = parts;
    const day = parseInt(d, 10);
    const monthIndex = monthMap[m];
    const year = parseInt(y, 10);
    const hour = parseInt(h, 10);
    const minute = parseInt(min, 10);
    const second = parseInt(s, 10);

    let utcTimestamp = Date.UTC(year, monthIndex, day, hour, minute, second);
    utcTimestamp -= IST_OFFSET_MINUTES * 60 * 1000;
    return new Date(utcTimestamp);
}

export async function getFreshFilings(filings: Filing[]): Promise<Filing[]> {
    try {
        // Step 1: Yesterday at 1 AM IST
        const lastProcessedTime = dayjs()
            .tz("Asia/Kolkata")
            .subtract(1, "day")
            .hour(1)
            .minute(0)
            .second(0)
            .millisecond(0)
            .utc();

        // Step 2: Filter fresh filings
        const fresh = filings.filter((filing) => {
            const filingDate = dayjs(parseDate(filing.creation_Date));
            if (!filingDate.isValid()) return false;
            return filingDate.isAfter(lastProcessedTime);
        });

        return fresh;
    } catch (err) {
        console.error("Error in getFreshFilings:", err);
        return [];
    }
}
