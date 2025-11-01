
import type { GrowthRate, Recommendation } from "../types.ts";

/**
 * Flexible CAGR calculation that handles negative → positive transitions
 * @param begin - Starting value
 * @param final - Ending value
 * @param years - Number of years
 * @returns CAGR as decimal (%) (e.g. 25 = 25%)
 */
export function CAGR_flexible(begin: number, final: number, years: number): number | undefined {
    try {
        if (years <= 0) return NaN;
        let cagr = 0;

        if (begin > 0 && final > 0) {
            cagr = Math.pow(final / begin, 1 / years) - 1;
        } else if (begin < 0 && final < 0) {
            cagr = Math.pow(Math.abs(final) / Math.abs(begin), 1 / years) - 1;
            cagr *= -1; // stays negative
        } else if (begin < 0 && final > 0) {
            cagr = Math.pow((final + 2 * Math.abs(begin)) / Math.abs(begin), 1 / years) - 1;
        } else if (begin > 0 && final < 0) {
            cagr = -1 * (Math.pow((Math.abs(final) + 2 * begin) / begin, 1 / years) - 1);
        }

        return cagr * 100;
    } catch (err) {
        console.error("Error calculating CAGR", err);
        return undefined;
    }
}


/**
 * Calculate growth change after adding latest year (using CAGR_flexible)
 * @param yearlyDataArr - EPS values (oldest → latest)
 * @returns object with growth metrics
 */
export function growthAndJumpCalculator(yearlyDataArr: number[]): GrowthRate {
    try {
        if (yearlyDataArr.length < 2) {
            throw new Error("Need at least 2 values (oldest → latest).");
        }

        const oldStart = yearlyDataArr[0];
        const oldEnd = yearlyDataArr[yearlyDataArr.length - 2];
        const oldYears = yearlyDataArr.length - 2;
        const oldGrowthRate = CAGR_flexible(oldStart, oldEnd, oldYears) || 0;

        const newStart = yearlyDataArr[0];
        const newEnd = yearlyDataArr[yearlyDataArr.length - 1];
        const newYears = yearlyDataArr.length - 1;
        const newGrowthRate = CAGR_flexible(newStart, newEnd, newYears) || 0;

        const change = parseFloat((newGrowthRate - oldGrowthRate).toFixed(2));
        const jumpPercent = oldGrowthRate !== 0
            ? ((newGrowthRate - oldGrowthRate) / Math.abs(oldGrowthRate)) * 100
            : NaN;

        return {
            oldGrowthRate: parseFloat(oldGrowthRate.toFixed(2)),
            newGrowthRate: parseFloat(newGrowthRate.toFixed(2)),
            jumpPercent: isNaN(jumpPercent) ? null : parseFloat(jumpPercent?.toFixed(2)),
            change,
            impliedValue: yearlyDataArr[yearlyDataArr.length - 1]
        };
    } catch (err) {
        console.error("Error in growth jump calculator", err);
        return {}
    }
}


function removePreviousYearsQuarters(quarters: string[]): string[] {
    const now = new Date();
    const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const fyStart = new Date(fyStartYear, 3, 1);
    const fyEnd = new Date(fyStartYear + 1, 2, 31);

    const monthMap: Record<string, number> = {
        Jan: 0, Feb: 1, Mar: 2,
        Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8,
        Oct: 9, Nov: 10, Dec: 11,
    };

    return quarters.filter((q) => {
        const [monthStr, yearStr] = q.split(" ");
        const year = parseInt(yearStr);
        const month = monthMap[monthStr];
        if (month === undefined) return false;
        const date = new Date(year, month, 1);
        return date >= fyStart && date <= fyEnd;
    });
}

/**
 * Calculate implied yearly value from quarterly data
 * @param quarterlyArr - EPS/Sales/Profit values (oldest → latest)
 * @returns implied yearly value
 */
export function yearlyImpliedGrowth(quarterlyArr: number[]): number | null {
    try {

        if (quarterlyArr.length === 0) throw new Error("Need at least 1 quarterly value.");

        const sum = quarterlyArr.reduce((a, b) => a + b, 0);
        const rawImplied = (sum / quarterlyArr.length) * 4;

        let factor = 1;
        switch (quarterlyArr.length) {
            case 1: factor = 1.13; break;
            case 2: factor = 1.06; break;
            case 3: factor = 1.0; break;
            default: factor = 1.0;
        }

        return parseFloat((rawImplied * factor).toFixed(2));
    } catch (err: any) {
        console.error("Error in implied growth calculator", err.message);
        return null;
    }
}


/**
 * Year-over-Year (YoY) Same Quarter Growth
 * → Compares the most recent quarter with the oldest available (same quarter previous year)
 * → Ideal for seasonal businesses
 */
export function yoySameQuarterGrowth(quarterlyArr: number[]): string {
    try {
        const valid = quarterlyArr?.map(Number)?.filter((v) => !isNaN(v));
        if (!valid || valid.length === 0) return "0.00";
        if (valid.length === 1) return "100.00";

        const first = valid[0]; // same quarter last year (oldest)
        const last = valid[valid.length - 1]; // current quarter (latest)
        if (first === 0) return "0.00";

        const growth = ((last - first) / Math.abs(first)) * 100;
        return growth.toFixed(2);
    } catch (err) {
        console.error("error calculating yoySameQuarterGrowth:", err);
        return "0.00";
    }
}

/**
 * Recent Quarter-over-Quarter (QoQ) Growth
 * → Compares the last two valid quarters for short-term momentum
 */
export function qoqGrowth(quarterlyArr: number[]): string {
    try {
        const valid = quarterlyArr
            ?.map(Number)
            ?.filter((v) => !isNaN(v) && v !== null && v !== undefined);

        if (!valid || valid.length === 0) return "0.00";
        if (valid.length === 1) return "100.00"; // ✅ single quarter case handled

        const prev = valid[valid.length - 2];
        const last = valid[valid.length - 1];
        if (prev === 0) return "0.00";

        const growth = ((last - prev) / Math.abs(prev)) * 100;
        return growth.toFixed(2);
    } catch (err) {
        console.error("error calculating recentQoQGrowth:", err);
        return "0.00";
    }
}

/**
 * Driver function for EPS, Sales, OP, PAT CAGR + PEG + Jump filter
 */
export function recommend(
    yearlyEPS: number[],
    quarterlyEPS: number[],
    yearlySales: number[],
    quarterlySales: number[],
    yearlyOpProfit: number[],
    quarterlyOpProfit: number[],
    yearlyPat: number[],
    quarterlyPat: number[],
    quarters: string[],
    pe: number = 30,
    currentPrice: number | null = null
): Recommendation | undefined {
    try {
        const currentFinQuarters = removePreviousYearsQuarters(quarters);
        const sliceLength = quarters.length - currentFinQuarters.length;
        // quarterlyArr = quarterlyArr.slice(sliceLength)

        const impliedEPS = yearlyImpliedGrowth(quarterlyEPS.slice(sliceLength));
        const yearlyEpsCombined = [...yearlyEPS, impliedEPS || 0];
        const epsResult = growthAndJumpCalculator(yearlyEpsCombined);
        epsResult["qoqGrowth"] = qoqGrowth(quarterlyEPS);
        epsResult['yoySameQuarterGrowth'] = yoySameQuarterGrowth(quarterlyEPS);


        const impliedSales = yearlyImpliedGrowth(quarterlySales.slice(sliceLength));
        const yearlySalesCombined = [...yearlySales, impliedSales || 0];
        const salesResult = growthAndJumpCalculator(yearlySalesCombined);
        salesResult["qoqGrowth"] = qoqGrowth(quarterlySales);
        salesResult['yoySameQuarterGrowth'] = yoySameQuarterGrowth(quarterlySales);

        const impliedOp = yearlyImpliedGrowth(quarterlyOpProfit.slice(sliceLength));
        const yearlyOpCombined = [...yearlyOpProfit, impliedOp || 0];
        const opResult = growthAndJumpCalculator(yearlyOpCombined);
        opResult["qoqGrowth"] = qoqGrowth(quarterlyOpProfit);
        opResult['yoySameQuarterGrowth'] = yoySameQuarterGrowth(quarterlyOpProfit);

        const impliedPat = yearlyImpliedGrowth(quarterlyPat.slice(sliceLength));
        const yearlyPatCombined = [...yearlyPat, impliedPat || 0];
        const patResult = growthAndJumpCalculator(yearlyPatCombined);
        patResult["qoqGrowth"] = qoqGrowth(quarterlyPat);
        patResult['yoySameQuarterGrowth'] = yoySameQuarterGrowth(quarterlyPat);



        // const salesWithinRange = Math.abs((salesResult?.newGrowthRate || 0) - (epsResult?.newGrowthRate || 0)) <= 70;

        const peg = pe / Math.max(Number(epsResult?.newGrowthRate) || 1, 1);

        let peChange: number | null = null;
        if (currentPrice && yearlyEPS.length > 1) {
            const oldEPS = yearlyEPS[0];
            if (oldEPS > 0) {
                const oldPE = currentPrice / oldEPS;
                peChange = ((pe / oldPE) - 1) * 100;
            }
        }

        let decision = "HOLD";
        let rerating = false;

        if ((Number(epsResult?.jumpPercent) ?? 0) >= 50 && (Number(epsResult?.newGrowthRate) ?? 0) >= 5) {
            decision = "BUY";
            rerating = true;
        } else if ((Number(epsResult?.newGrowthRate) ?? 0) < 5 || (Number(epsResult?.jumpPercent) ?? 0) < -5) {
            decision = "SELL";
            rerating = false;
        }

        return {
            EPS: epsResult,
            Sales: salesResult,
            OP: opResult,
            PAT: patResult,
            PE: pe,
            PEG: parseFloat(peg.toFixed(2)),
            peChange: peChange !== null ? parseFloat(peChange?.toFixed(2)) : null,
            decision,
            reratingCandidate: rerating
        };
    } catch (err) {
        console.error("Error in recommend function", err);
        return undefined;
    }
}
