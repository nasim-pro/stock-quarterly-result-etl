// bse-driver.ts
import { fetchBSEFinancialResults } from "./bseFilings.ts";
import { searchFinology } from "./finologySearch.ts";
import { stockDetailsFromScreener } from './stockDetailsFromScreener.ts';
import { recommend } from '../utility/recommend.ts'
import { buyOrSell } from '../dbtransaction/buyorsell.ts'
import { sendResultMessage } from '../comn/sendCompanyNames.ts'
import { sendCompanyResults } from '../comn/sendCompanyResults.ts'
import { addDPSScore } from "../utility/dpsScore.ts";
import { getDataLocally, storeDataLocally } from "../utility/storageUtil.ts";
import { removeNSEResultFromBSEResult } from "../utility/removeNSEResultFromBSEResult.ts";
/**
 * Normalize company name for comparison
 * Removes common suffixes like Ltd, Limited, Pvt, etc., and trailing dots
 */
function normalizeCompanyName(name: any) {
    return name
        .replace(/\b(Ltd|LTD|Limited)\b\.?/gi, '') // remove suffixes
        .replace(/\.+$/g, '') // remove trailing dots
        .replace(/\s+/g, ' ')
        .replace('-$', '')  // normalize spaces
        .trim()
        .toLowerCase();
}


/**
 * Fetches BSE results and enriches them with FINCODE and stock details
 */
export async function bseDriver() {
    try {
        console.log('<=====================================================>');
        console.log(`[${new Date().toLocaleString()}] Starting BSE scraper`);
        // Uncomment below line to fetch live results from BSE
        const bseResults: any = await fetchBSEFinancialResults();

        // Hardcoded results for testing to avoid calling BSE too frequently
        // const bseResults = [
        //     { "company": "Esaar India Ltd" },
        //     // { "company": "Another Company Pvt Ltd" }
        // ];
        console.log(`BSE Fresh Filings Found: ${bseResults.length}`);
        await sendResultMessage(bseResults)
        if (!bseResults || bseResults.length === 0) return [];

        // remove the already processed NSE results from the bse
        const newBSEResult = await removeNSEResultFromBSEResult(bseResults)
        
        const enrichedResults = [];

        for (const item of newBSEResult) {
            const companyName = item.company.trim();
            const words = companyName.split(/\s+/);
            const searchQuery = words[0].length >= 3 ? words[0] : words.slice(0, 2).join(' ');
            // console.log("companyName", companyName);
            
            // console.log("searchQuery", searchQuery);

            try {
                // Search in Finology
                const searchResults = await searchFinology(searchQuery);
                // console.log("searchResults", searchResults);

                if (!searchResults || searchResults.length === 0 || searchResults == null) {
                    console.log(`No search results for company: ${companyName}`);
                    continue;
                }

                // Normalize names for exact comparison
                const normalizedTarget = normalizeCompanyName(companyName);
                let matched = searchResults?.find((r: { compname: string; }) => normalizeCompanyName(r.compname) === normalizedTarget);
                // console.log("normalizedTarget", normalizedTarget);
                
                // console.log("matched", matched);
                if (!matched) {
                    matched = searchResults[0]; // fallback to first result
                }

                const fincode = matched?.FINCODE;
                const ticker = `SCRIP-${fincode}`;

                // Fetch stock details
                const stockDetails = await stockDetailsFromScreener(ticker);

                enrichedResults.push({
                    stockName: matched.compname || companyName,
                    ...stockDetails
                });
            } catch (err: any) {
                console.error(`Error processing company ${companyName}:`, err.message || err);
            }
        }

        // return enrichedResults;

        let stockRecommendation = []
        for (const result of enrichedResults) {
            try {
                // get the recommendation for the stock to buy or sell
                const recommendation = recommend(
                    result?.yearlyEps,
                    result?.quarterlyEps,
                    result?.yearlySales,
                    result?.quarterlySales,
                    result?.yearlyOpProfit,
                    result?.quarterlyOpProfit,
                    result?.yearlyPat,
                    result?.quarterlyPat,
                    result?.quarters,
                    result?.peRatio,
                    result?.currentPrice,
                )
                result["recommendation"] = recommendation;
                stockRecommendation.push(result);
            } catch (err) {
                console.log("Error finding recommendation", err);
            }
        }

        // send telegram message with details
        await sendCompanyResults(stockRecommendation)
        // add dps score
        addDPSScore(stockRecommendation)
        // method to buy or sell
        await buyOrSell(stockRecommendation)
        const existing = await getDataLocally() // get existing local async storage data
        // console.log("existing", JSON.stringify(existing, null, 2));
        const toStoredata = [...existing, ...stockRecommendation]
        storeDataLocally(toStoredata) // store locally in async storage
        console.log(`[${new Date().toLocaleString()}] Closing BSE scraper`);
    } catch (err) {
        console.log('Error in bse driver', err);
    }

}

// bseDriver()