import mongoose from "mongoose";
import bcrypt from "bcrypt";

// ============================================================
// CuratoCV User Model
// ============================================================
//
// Responsible for:
// - User persistence
// - Credential storage
// - Password hashing/comparison
// - Basic user-data validation
//
// NOT responsible for:
// - Authentication middleware
// - JWT creation
// - HTTP responses
// - Authorization
// - Login/register workflows
//
// Those responsibilities belong to services/controllers/
// middleware.
// ============================================================

// ============================================================
// Configuration
// ============================================================

const BCRYPT_SALT_ROUNDS = 12;

// ============================================================
// User Schema
// ============================================================

const userSchema = new mongoose.Schema(
    {
        // ----------------------------------------------------
        // Name
        // ----------------------------------------------------

        name: {
            type: String,

            required: [
                true,
                "Name is required.",
            ],

            trim: true,

            minlength: 2,

            maxlength: 120,
        },

        // ----------------------------------------------------
        // Email
        // ----------------------------------------------------

        email: {
            type: String,

            required: [
                true,
                "Email is required.",
            ],

            trim: true,

            lowercase: true,

            maxlength: 254,

            /*
             * The actual unique index is declared below.
             *
             * Duplicate emails must still be handled by the
             * service layer because MongoDB can return a
             * duplicate-key error during concurrent requests.
             */
            unique: true,

            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

                "Please provide a valid email address.",
            ],
        },

        // ----------------------------------------------------
        // Email Verification
        // ----------------------------------------------------

        emailVerified: {
            type: Boolean,
            default: false,
        },

        // ----------------------------------------------------
        // Token Revocation Version
        // ----------------------------------------------------

        tokenVersion: {
            type: Number,
            default: 0,
            min: 0,
        },

        // ----------------------------------------------------
        // Password
        // ----------------------------------------------------

        password: {
            type: String,

            required: [
                true,
                "Password is required.",
            ],

            /*
             * A bcrypt hash is 60 characters.
             *
             * Request-level validators enforce plaintext password
             * minimums (8 chars). The model's minlength allows both
             * plaintext (during registration before hashing) and
             * hashed values to pass schema validation.
             */
            minlength: 8,

            maxlength: 255,

            /*
             * Password hashes must not be returned by normal
             * queries.
             *
             * Authentication code must explicitly request it:
             *
             *     .select("+password")
             */
            select: false,
        },
    },
    {
        timestamps: true,

        minimize: false,

        strict: true,

        versionKey: "__v",
    }
);

// ============================================================
// Indexes
// ============================================================
//
// One unique email index is sufficient.
//
// Do NOT index passwords.
// ============================================================

userSchema.index(
    {
        email: 1,
    },
    {
        unique: true,
        name: "user_email_unique",
    }
);

// ============================================================
// Password Hashing
// ============================================================
//
// Hash only when the password has actually changed.
//
// This prevents an already-hashed password from being hashed
// again during ordinary user updates.
// ============================================================

userSchema.pre(
    "save",
    async function () {
        if (
            !this.isModified(
                "password"
            )
        ) {
            return;
        }

        this.password =
            await bcrypt.hash(
                this.password,
                BCRYPT_SALT_ROUNDS
            );
    }
);

// ============================================================
// Password Comparison
// ============================================================
//
// Authentication should explicitly select the password:
//
// const user = await User
//     .findOne({ email })
//     .select("+password");
//
// const valid =
//     await user.comparePassword(password);
// ============================================================

userSchema.methods.comparePassword =
    async function (
        candidatePassword
    ) {
        if (
            typeof candidatePassword !==
            "string"
        ) {
            return false;
        }

        if (
            typeof this.password !==
            "string"
        ) {
            return false;
        }

        return bcrypt.compare(
            candidatePassword,
            this.password
        );
    };

// ============================================================
// Safe JSON Representation
// ============================================================
//
// Additional protection against accidentally serializing a
// User document.
//
// `select: false` remains the primary database-query
// protection.
// ============================================================

userSchema.methods.toJSON =
    function () {
        const user =
            this.toObject();

        delete user.password;

        return user;
    };

// ============================================================
// Model
// ============================================================

const User =
    mongoose.models.User ||
    mongoose.model(
        "User",
        userSchema
    );

export default User;