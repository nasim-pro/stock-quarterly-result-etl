import { getDataLocally } from "./storageUtil.ts";

interface BseResult {
    company: string;
    [key: string]: any;
}

interface NseResult {
    stockName: string;
    [key: string]: any;
}

/**
 * Removes duplicates from bseResults by comparing with nseResults
 */
export async function removeNSEResultFromBSEResult(bseResults: BseResult[]): Promise<BseResult[]> {
    const nseResults: NseResult[] = await getDataLocally();
    // Create a Set of normalized NSE names
    const nseSet = new Set(nseResults.map(n => normalizeCompanyName(n.stockName)));
    // Filter BSE results
    const bseArr =  bseResults?.filter(bse => !nseSet.has(normalizeCompanyName(bse.company)));
    return bseArr;
}

function normalizeCompanyName(name: any) {
    return name
        .replace(/\b(Ltd|LTD|Limited)\b\.?/gi, '') // remove suffixes
        .replace(/\.+$/g, '') // remove trailing dots
        .replace(/\s+/g, ' ')
        .replace('-$', '')  // normalize spaces
        .trim()
        .toLowerCase();
}