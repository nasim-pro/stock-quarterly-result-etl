import mongoose, { Schema, Document, Model } from "mongoose";
import { v4 as uuidv4 } from 'uuid';
const MONGO_URI =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/stockrecommendation";

interface GenericDoc extends Document {
    [key: string]: any;
}

// Flexible schema that allows any structure
const GenericSchema = new Schema({}, { strict: false });

// Reuse model across imports
const COLLECTION_NAME = "stocks-financial-result";
const GenericModel: Model<GenericDoc> = mongoose.models[COLLECTION_NAME] || mongoose.model<GenericDoc>(COLLECTION_NAME, GenericSchema, COLLECTION_NAME);

/**
 * Ensure MongoDB connection (only once)
 */
async function connectDB(): Promise<typeof mongoose> {
    if (mongoose.connection.readyState === 0) {
        try {
            await mongoose.connect(MONGO_URI);
            console.log("✅ Connected to MongoDB");
        } catch (err) {
            console.error("MongoDB connection failed:", err);
            throw err;
        }
    }
    return mongoose;
}

/**
 * Save any object to MongoDB.
 * Always saves in the "stocks-quarterly-result" collection.
 * @param data - Object to be saved
 */
export async function saveToMongo(data: Record<string, any>): Promise<void> {
    try {
        await connectDB();

        // Generate a composite key to uniquely identify a record
        const compositeKey = `${data?.stockName || data?.ticker || uuidv4()}_${data?.nseBse}_${data.currentQuarter}`
            ?.replaceAll(' ', '_')
            .toLowerCase();

        // Merge the key into data
        const payload = {
            ...data,
            compositeKey,
            createdAt: new Date(),
        };

        // Replace the old record if same compositeKey exists
        await GenericModel.findOneAndUpdate(
            { compositeKey },
            payload,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`✅ Record saved/updated for: ${compositeKey}`);
    } catch (err) {
        console.error("❌ Error saving data:", err);
    }
}


/**
 * Close MongoDB connection manually (optional)
 */
export async function closeMongoConnection(): Promise<void> {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log("🔒 MongoDB connection closed");
    }
}





// (async () => {
//     await saveToMongo({
//         stockName: "Tata Cosnsulatancy Services",
//         ticker: "TCS",
//         peRatio: 30.4,
//         quarterlySales: [60000, 65000, 70000],
//         quarterlyEps: [24.3, 25.7, 27.2],
//         nseBse: "nse",
//         currentQuarter: "Jun 2025",
//         currentPrice: 3500,
//         marketCap: 1200000,
//         recommendation: { decision: "BUY", PEG: 1.2 },
//     });
// })();
