// ============================================================
// CuratoCV ObjectId Utilities
// ============================================================
//
// Centralized MongoDB ObjectId validation utilities.
//
// Responsibilities:
// - Validate MongoDB ObjectId values
// - Provide safe ObjectId conversion
//
// NOT responsible for:
// - Database queries
// - Authentication
// - Authorization
// - HTTP responses
// - Business logic
//
// This keeps ObjectId handling consistent across services,
// repositories, validators, and controllers.
// ============================================================

import mongoose from "mongoose";

// ============================================================
// Constants
// ============================================================

const OBJECT_ID_STRING_LENGTH = 24;

// ============================================================
// isValidObjectId
// ============================================================
//
// Returns true when the supplied value represents a valid
// MongoDB ObjectId.
//
// We intentionally require a canonical 24-character hexadecimal
// string when the input is a string.
//
// This avoids accepting surprising values through Mongoose's
// broader ObjectId casting behavior.
// ============================================================

const isValidObjectId = (
    value
) => {
    // --------------------------------------------------------
    // Existing ObjectId instance
    // --------------------------------------------------------

    if (
        value instanceof
        mongoose.Types.ObjectId
    ) {
        return true;
    }

    // --------------------------------------------------------
    // String ObjectId
    // --------------------------------------------------------

    if (
        typeof value !==
        "string"
    ) {
        return false;
    }

    const normalized =
        value.trim();

    if (
        normalized.length !==
        OBJECT_ID_STRING_LENGTH
    ) {
        return false;
    }

    return /^[a-fA-F0-9]{24}$/.test(
        normalized
    );
};

// ============================================================
// toObjectId
// ============================================================
//
// Converts a valid ObjectId string into a Mongoose ObjectId.
//
// Throws a normal Error when the value is invalid.
//
// Services can perform validation first and throw their own
// ApiError when an invalid user-supplied ID is encountered.
// ============================================================

const toObjectId = (
    value
) => {
    if (
        !isValidObjectId(
            value
        )
    ) {
        throw new TypeError(
            "Invalid MongoDB ObjectId."
        );
    }

    if (
        value instanceof
        mongoose.Types.ObjectId
    ) {
        return value;
    }

    return new mongoose.Types.ObjectId(
        value.trim()
    );
};

// ============================================================
// normalizeObjectId
// ============================================================
//
// Returns a canonical string representation of a valid
// ObjectId.
//
// Useful when comparing IDs safely.
// ============================================================

const normalizeObjectId = (
    value
) => {
    return toObjectId(
        value
    ).toString();
};

// ============================================================
// areObjectIdsEqual
// ============================================================
//
// Safely compares two ObjectId values.
//
// Supports:
// - ObjectId vs ObjectId
// - String vs ObjectId
// - String vs String
//
// Returns false instead of throwing when either value is
// invalid.
// ============================================================

const areObjectIdsEqual = (
    first,
    second
) => {
    if (
        !isValidObjectId(
            first
        ) ||
        !isValidObjectId(
            second
        )
    ) {
        return false;
    }

    return (
        normalizeObjectId(
            first
        ) ===
        normalizeObjectId(
            second
        )
    );
};

// ============================================================
// Export
// ============================================================

const objectId = Object.freeze({
    isValidObjectId,
    toObjectId,
    normalizeObjectId,
    areObjectIdsEqual,
});

export {
    isValidObjectId,
    toObjectId,
    normalizeObjectId,
    areObjectIdsEqual,
};

export default objectId;