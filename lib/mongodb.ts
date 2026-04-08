import { MongoClient, MongoClientOptions } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

const options: MongoClientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

if (!global._mongoClient) {
  global._mongoClient = new MongoClient(uri, options);
}

if (!global._mongoClientPromise) {
  global._mongoClientPromise = global._mongoClient.connect().catch((err) => {
    // Clear cached rejected promise so the next request retries
    global._mongoClientPromise = undefined;
    return Promise.reject(err);
  });
}

const clientPromise: Promise<MongoClient> = global._mongoClientPromise;

/**
 * Non-connected MongoClient instance for MongoDBAdapter.
 * The adapter handles connection internally and avoids unhandled rejections.
 */
export const mongoClient: MongoClient = global._mongoClient;

export default clientPromise;
