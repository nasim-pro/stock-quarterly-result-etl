// utils/buy-stock.ts
import axios from "axios";
// import { StockData } from "./type";
import { config } from "dotenv";
import type { StockData } from "../types.ts";
config();
const API_BASE = process.env.API_BASE || "";
/**
 * Buy a new stock by calling backend API
 * @param stockData StockData object
 */
export async function buyStock(stockData: StockData): Promise<void> {
    try {
        const {
            stockName,
            ticker,
            peRatio,
            currentPrice,
            marketCap,
            debt,
            promoterHolding,
            roe,
            roce,
            quarters,
            quarterlySales,
            quarterlyPat,
            quarterlyEps,
            quarterlyOpProfit,
            years,
            yearlySales,
            yearlyEps,
            recommendation,
            DPS,
        } = stockData;

        let nseBse = ticker ? "NSE" : "BSE";

        const buyObj = {
            stockName,
            ticker,
            nseBse,
            status: "bought",

            // buy snapshot
            buyPrice: currentPrice,
            buyPeRatio: peRatio,
            buyMarketCap: marketCap,
            buyDebt: debt,
            buyRoe: roe,
            buyRoce: roce,
            buyPromoterHolding: promoterHolding,

            buyQuarters: quarters,
            buyQuarterlySales: quarterlySales,
            buyQuarterlyPat: quarterlyPat,
            buyQuarterlyEps: quarterlyEps,
            buyQuarterlyOpProfit: quarterlyOpProfit,

            buyYears: years,
            buyYearlySales: yearlySales,
            buyYearlyEps: yearlyEps,
            buyDate: new Date().toISOString(),

            buyEPSGrowthRateCagr: recommendation?.EPS?.oldGrowthRate,
            buyImpliedEPSGrowthRateCagr: recommendation?.EPS?.newGrowthRate,
            buySalesGrowthRateCagr: recommendation?.Sales?.oldGrowthRate,
            buySalesImpliedGrowthRateCagr: recommendation?.Sales?.newGrowthRate,

            buyJumpPercent: recommendation?.EPS?.jumpPercent,
            buyChangeInEPSGrowthCagr: recommendation?.EPS?.change,

            buyPeg: recommendation?.PEG,
            buyImpliedEPS: recommendation?.EPS?.impliedValue,
            buyImpliedSales: recommendation?.Sales?.impliedValue,
            buyDPS: DPS,
        };
        
        // console.log("sellObj", JSON.stringify(buyObj, null, 2));
        // Call backend API
        await axios.post(`${API_BASE}/api/buy`, buyObj);
        // console.log(`✅ Stock ${stockName} buy request sent`);
    } catch (error: any) {
        console.error("Error buying stock:", error.message);
    }
}
