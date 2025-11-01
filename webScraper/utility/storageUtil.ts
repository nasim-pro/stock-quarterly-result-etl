import fs from "node:fs";
import path from "node:path";

// File paths
const DATA_DIR = path.resolve("./data");
const STORAGE_FILE = path.join(DATA_DIR, "stock.json");
const WATCHLIST_FILE = path.join(DATA_DIR, "watchlist.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Helper: Read JSON safely
 */
const readFileSafe = (filePath: string): any[] => {
    try {
        if (!fs.existsSync(filePath)) return [];
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
};

/**
 * Helper: Write JSON safely
 */
const writeFileSafe = (filePath: string, data: any[]): void => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
    }
};

/**
 * ✅ Store array in local file
 */
export const storeDataLocally = async (dataArray: any[]): Promise<void> => {
    try {
        writeFileSafe(STORAGE_FILE, dataArray);
        console.log("Data stored successfully");
    } catch (e) {
        console.error("Error storing data:", e);
    }
};

/**
 * ✅ Get array from local file
 */
export const getDataLocally = async <T = any>(): Promise<T[]> => {
    try {
        return readFileSafe(STORAGE_FILE);
    } catch (e) {
        console.error("Error retrieving data:", e);
        return [];
    }
};

/**
 * ✅ Delete data file
 */
export const deleteDataLocally = async (): Promise<void> => {
    try {
        if (fs.existsSync(STORAGE_FILE)) {
            fs.unlinkSync(STORAGE_FILE);
            console.log("Data deleted successfully");
        }
    } catch (e) {
        console.error("Error deleting data:", e);
    }
};

/**
 * ✅ Generate a unique ID with timestamp + random part
 */
const generateId = (): string => {
    const randomPart = Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now().toString(36);
    return `watch_${timestamp}_${randomPart}`;
};

/**
 * ✅ Add item to watchlist
 */
export const addToWatchlist = async (item: any): Promise<void> => {
    try {
        const watchlist = readFileSafe(WATCHLIST_FILE);
        const newItem = {
            ...item,
            _watchlistId: generateId(),
            addedAt: new Date().toISOString(),
        };
        watchlist.push(newItem);
        writeFileSafe(WATCHLIST_FILE, watchlist);
        console.log("Item added to watchlist");
    } catch (error) {
        console.error("Error adding to watchlist:", error);
    }
};

/**
 * ✅ Remove item from watchlist by generated ID
 */
export const removeFromWatchlist = async (stock: any): Promise<void> => {
    try {
        const watchlist = readFileSafe(WATCHLIST_FILE);
        const updated = watchlist.filter(
            (i: any) => i._watchlistId !== stock?._watchlistId
        );
        writeFileSafe(WATCHLIST_FILE, updated);
        console.log("Item removed from watchlist");
    } catch (error) {
        console.error("Error removing from watchlist:", error);
    }
};

/**
 * ✅ Get full watchlist
 */
export const getWatchlist = async (): Promise<any[]> => {
    try {
        return readFileSafe(WATCHLIST_FILE);
    } catch (error) {
        console.error("Error fetching watchlist:", error);
        return [];
    }
};


// (async () => {
//     // await storeDataLocally([{ symbol: "TCS", price: 3820 }]);
//     // console.log(await getDataLocally());
//     // await deleteDataLocally()
//     // await addToWatchlist({ symbol: "INFY" });
//     // console.log(await getWatchlist());
// })();