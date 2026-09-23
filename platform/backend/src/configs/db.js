import mongoose from "mongoose";

// ============================================================
// MongoDB Configuration
// ============================================================

const DEFAULT_DATABASE_NAME = "Resume_Builder";

const SERVER_SELECTION_TIMEOUT_MS = 10_000;
const CONNECT_TIMEOUT_MS = 10_000;
const SOCKET_TIMEOUT_MS = 45_000;

// ============================================================
// Environment Configuration
// ============================================================

const getDatabaseName = () => {
    const configuredDatabase =
        process.env.MONGODB_DB_NAME?.trim();

    if (!configuredDatabase) {
        return DEFAULT_DATABASE_NAME;
    }

    /*
     * Prevent accidental use of invalid database names.
     *
     * MongoDB database names have restrictions on certain
     * characters. Keeping this validation here prevents a
     * malformed environment configuration from reaching
     * mongoose.connect().
     */
    if (
        configuredDatabase.length === 0 ||
        configuredDatabase.length > 63 ||
        /[\/\\."$]/.test(configuredDatabase)
    ) {
        throw new Error(
            "MONGODB_DB_NAME contains invalid characters or is too long."
        );
    }

    return configuredDatabase;
};

const getMongoDBUri = () => {
    const rawUri =
        process.env.MONGODB_URI?.trim();

    if (!rawUri) {
        throw new Error(
            "MONGODB_URI is not configured."
        );
    }

    let uri;

    try {
        uri = new URL(rawUri);
    } catch {
        throw new Error(
            "MONGODB_URI is not a valid MongoDB connection URI."
        );
    }

    if (
        uri.protocol !== "mongodb:" &&
        uri.protocol !== "mongodb+srv:"
    ) {
        throw new Error(
            "MONGODB_URI must use mongodb:// or mongodb+srv://."
        );
    }

    /*
     * The application controls the database name through
     * MONGODB_DB_NAME.
     *
     * Removing the pathname prevents an accidentally supplied
     * database name in MONGODB_URI from silently overriding
     * the application's configured database.
     *
     * Query parameters such as retryWrites and w are preserved.
     */
    uri.pathname = "/";

    return uri.toString();
};

// ============================================================
// MongoDB Connection Event Handlers
// ============================================================

const connection = mongoose.connection;

connection.on(
    "connected",
    () => {
        console.info(
            "MongoDB connection established."
        );
    }
);

connection.on(
    "error",
    (error) => {
        console.error(
            "MongoDB connection error.",
            {
                name: error?.name,
                code: error?.code,
            }
        );
    }
);

connection.on(
    "disconnected",
    () => {
        console.warn(
            "MongoDB connection disconnected."
        );
    }
);

// ============================================================
// Database Connection
// ============================================================

const connectDB = async () => {
    /*
     * Already connected.
     */
    if (
        mongoose.connection.readyState ===
        mongoose.ConnectionStates.connected
    ) {
        return mongoose.connection;
    }

    /*
     * A connection attempt is already in progress.
     *
     * Waiting for the existing connection prevents multiple
     * simultaneous mongoose.connect() calls.
     */
    if (
        mongoose.connection.readyState ===
        mongoose.ConnectionStates.connecting
    ) {
        return mongoose.connection.asPromise();
    }

    const mongodbURI =
        getMongoDBUri();

    const databaseName =
        getDatabaseName();

    try {
        await mongoose.connect(
            mongodbURI,
            {
                dbName: databaseName,

                serverSelectionTimeoutMS:
                    SERVER_SELECTION_TIMEOUT_MS,

                connectTimeoutMS:
                    CONNECT_TIMEOUT_MS,

                socketTimeoutMS:
                    SOCKET_TIMEOUT_MS,

                /*
                 * Do not allow Mongoose to queue an unlimited
                 * number of operations while MongoDB is
                 * unavailable.
                 */
                bufferCommands: false,
            }
        );

        return mongoose.connection;
    } catch (error) {
        /*
         * Keep database connection details out of normal
         * application responses.
         *
         * Detailed diagnostics remain available in the
         * server logs without logging credentials or the
         * complete MongoDB connection string.
         */
        console.error(
            "Failed to connect to MongoDB.",
            {
                name: error?.name,
                code: error?.code,
            }
        );

        /*
         * Startup should fail when the database is required
         * but unavailable. The caller decides whether the
         * application should terminate/retry.
         */
        throw error;
    }
};

export default connectDB;