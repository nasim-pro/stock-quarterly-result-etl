
export interface GrowthRate {
    oldGrowthRate?: number | string | null;
    newGrowthRate?: number | string | null;
    impliedValue?: number | string | null;
    jumpPercent?: number | string | null;
    change?: number | string | null;
    qoqGrowth?: number | string | null;
    yoySameQuarterGrowth?: number | string | null;
}

export interface Recommendation {
    EPS: GrowthRate;
    Sales: GrowthRate;
    OP: GrowthRate;
    PAT: GrowthRate;
    PEG: number;
    decision: "BUY" | "SELL" | "HOLD" | string; // fallback string for unknown cases
    [key: string]: any;
}

export interface StockData {
    stockName: string;
    ticker?: string;
    peRatio: number;
    currentPrice: number;
    marketCap: number;
    debt: number;
    promoterHolding: number;
    roe: number;
    roce: number;

    quarters: number[];
    quarterlySales: number[];
    quarterlyPat: number[];
    quarterlyEps: number[];
    quarterlyOpProfit: number[];

    years: number[];
    yearlySales: number[];
    yearlyEps: number[];
    yearlyOpProfit: number[];
    yearlyPat: number[];


    recommendation: Recommendation;
    DPS: number;
}
