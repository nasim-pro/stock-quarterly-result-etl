import { nseDriver } from "./scrape/nse-driver.ts";
import { bseDriver } from "./scrape/bse-driver.ts";
import { closeMongoConnection } from "./dbtransaction/savetoMongodb.ts";


export async function mainDriver() {
    try {
        await nseDriver()
    } catch (err: any) {
        console.log(`Error in nse driver ${err}`);
    }

    try {
        await bseDriver()
    } catch (err: any) {
        console.log(`Error in bse driver ${err}`);
    }

    return true;
}


(async () => {
    try {
        // Run main scraping logic
        await mainDriver();
    } catch (err) {
        console.error("Error in main driver:", err);
    } finally {
        await closeMongoConnection()
        process.exit(0); // exit Node.js
    }
})();