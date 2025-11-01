// utils/save-stock.ts
import axios from "axios";
import type { StockData } from "../types.ts";
import { config } from "dotenv";
config()

const API_BASE=process.env.API_BASE

/**
 * save released result in dynamodb every time result released for the stock by calling backend API
 * @param stockData StockData object
 */
export async function storeResultStock(stockData: StockData): Promise<void> {
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
            yearlyOpProfit,
            yearlyPat,

            recommendation,
            DPS,
        } = stockData;

        let nseBse = ticker ? "NSE" : "BSE";

        const storeObj = {
            stockName,
            ticker,
            nseBse,
            status: recommendation?.decision,
            
            currentQuarter: quarters[quarters?.length - 1] || 'na',
            price: currentPrice,
            peRatio: peRatio,
            marketCap: marketCap,
            debt: debt,
            roe: roe,
            roce: roce,
            promoterHolding: promoterHolding,
            peg: recommendation?.PEG,
            dps: DPS,

            quarters: quarters,
            quarterlySales: quarterlySales,
            quarterlyPat: quarterlyPat,
            quarterlyEps: quarterlyEps,
            quarterlyOpProfit: quarterlyOpProfit,

            years: years,
            yearlySales: yearlySales,
            yearlyEps: yearlyEps,
            yearlyOpProfit: yearlyOpProfit,
            yearlyPat: yearlyPat,
            
            epsOldGrowthRateCagr: recommendation?.EPS?.oldGrowthRate,
            epsNewGrowthRateCagr: recommendation?.EPS?.newGrowthRate,
            epsJumpPercent: recommendation?.EPS?.jumpPercent,
            epsImpliedValue: recommendation?.EPS?.impliedValue,

            salesOldGrowthRateCagr: recommendation?.Sales?.oldGrowthRate,
            salesNewGrowthRateCagr: recommendation?.Sales?.newGrowthRate,
            salesJumpPercent: recommendation?.Sales?.jumpPercent,
            salesImpliedValue: recommendation?.Sales?.impliedValue,

            opGrowthRateCagr: recommendation?.OP?.oldGrowthRate,
            opNewGrowthRateCagr: recommendation?.OP?.newGrowthRate,
            opJumpPercent: recommendation?.OP?.jumpPercent,
            opImliedVlaue: recommendation?.OP?.impliedValue,

            patOldGrowthRateCagr: recommendation.PAT?.oldGrowthRate,
            patNewGrowthRateCagr: recommendation?.PAT?.newGrowthRate,
            patJumpPercent: recommendation?.PAT?.jumpPercent,
            patImpliedValue: recommendation?.PAT?.impliedValue,

            qoqPatGrowth: recommendation?.PAT?.qoqGrowth,
            qoqEpsGrowth: recommendation?.EPS?.qoqGrowth,
            qoqSalesGrowth: recommendation?.Sales?.qoqGrowth,
            qoqOpGrowth: recommendation?.OP?.qoqGrowth,

            yoySameQuarterGrowthEps: recommendation?.EPS?.yoySameQuarterGrowth,
            yoySameQuarterGrowthSales: recommendation?.Sales?.yoySameQuarterGrowth,
            yoySameQuarterGrowthOp: recommendation?.OP?.yoySameQuarterGrowth,
            yoySameQuarterGrowthPat: recommendation?.PAT?.yoySameQuarterGrowth,
            
        };

        console.log("storing stock object", JSON.stringify(storeObj, null, 2));
        
        // Call backend API
        await axios.post(`${API_BASE}/api/save-result`, storeObj);
    } catch (error: any) {
        console.error("Error storing stock:", error.message);
        // throw error;
    }
}
