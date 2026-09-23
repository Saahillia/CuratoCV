import User from "../Models/User.js";

// ============================================================
// CuratoCV User Repository
// ============================================================
//
// Database-access layer for User documents.
//
// Responsibilities:
// - Find users
// - Create users
// - Update users
// - Delete users when explicitly required
// - Perform database-level user queries
//
// NOT responsible for:
// - Password validation rules
// - Authentication workflows
// - JWT creation
// - Authorization decisions
// - HTTP req/res
// - API response formatting
// - Business logic
//
// Services decide WHAT should happen.
// Repositories decide HOW MongoDB is accessed.
// ============================================================

// ============================================================
// Create
// ============================================================

/**
 * Create a new user.
 *
 * Password hashing is handled by the User model's
 * pre-save middleware.
 *
 * @param {Object} userData
 * @returns {Promise<Object>}
 */
const create = async (
    userData
) => {
    return User.create(
        userData
    );
};

// ============================================================
// Find by ID
// ============================================================

/**
 * Find a user by MongoDB ObjectId.
 *
 * Password is excluded by the User schema's `select: false`.
 *
 * A Mongoose document is intentionally returned because the
 * service may need document methods.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<Object|null>}
 */
const findById = async (
    userId
) => {
    return User.findById(
        userId
    );
};

// ============================================================
// Find by ID With Password
// ============================================================
//
// Used exclusively for password verification/change operations.
//
// User.password uses `select: false`, so it must be explicitly
// selected here.
// ============================================================

/**
 * Find a user by ID including the password hash.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<Object|null>}
 */
const findByIdWithPassword =
    async (
        userId
    ) => {
        return User.findById(
            userId
        ).select(
            "+password"
        );
    };

// ============================================================
// Find by Email
// ============================================================

/**
 * Find a user by normalized email address.
 *
 * The password hash is intentionally NOT selected.
 *
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
const findByEmail = async (
    email
) => {
    return User.findOne({
        email,
    });
};

// ============================================================
// Find by Email With Password
// ============================================================
//
// Authentication requires the password hash.
//
// This method explicitly selects the password field because
// User.password uses `select: false`.
// ============================================================

/**
 * Find a user by email including the password hash.
 *
 * This method should only be used by the authentication
 * service during login/password verification.
 *
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
const findByEmailWithPassword =
    async (
        email
    ) => {
        return User.findOne({
            email,
        }).select(
            "+password"
        );
    };

// ============================================================
// Find by Email Existence
// ============================================================

/**
 * Check whether an email is already registered.
 *
 * Uses `exists()` rather than retrieving the complete user
 * document.
 *
 * @param {string} email
 * @returns {Promise<boolean>}
 */
const existsByEmail = async (
    email
) => {
    const result =
        await User.exists({
            email,
        });

    return Boolean(result);
};

// ============================================================
// Update by ID
// ============================================================
//
// IMPORTANT:
//
// This method must NOT be used to update passwords.
//
// findByIdAndUpdate() does not execute the User model's normal
// save middleware in the same way as document.save(), so a
// plaintext password could otherwise bypass bcrypt hashing.
//
// Password changes are handled by userService.changePassword(),
// which loads the document, assigns the password, and calls
// save().
// ============================================================

/**
 * Update a user by ID.
 *
 * Intended for non-password profile fields.
 *
 * @param {string|ObjectId} userId
 * @param {Object} updateData
 * @returns {Promise<Object|null>}
 */
const updateById = async (
    userId,
    updateData
) => {
    return User.findByIdAndUpdate(
        userId,
        {
            $set: updateData,
        },
        {
            new: true,
            runValidators: true,
        }
    );
};

// ============================================================
// Update by Email
// ============================================================

/**
 * Update a user identified by email.
 *
 * Intended for non-password profile fields.
 *
 * @param {string} email
 * @param {Object} updateData
 * @returns {Promise<Object|null>}
 */
const updateByEmail = async (
    email,
    updateData
) => {
    return User.findOneAndUpdate(
        {
            email,
        },
        {
            $set: updateData,
        },
        {
            new: true,
            runValidators: true,
        }
    );
};

// ============================================================
// Delete by ID
// ============================================================

/**
 * Delete a user by ID.
 *
 * Account deletion should be initiated by the user service.
 *
 * IMPORTANT:
 * Resume cleanup/cascade behavior must be handled explicitly
 * by the service layer.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<Object|null>}
 */
const deleteById = async (
    userId
) => {
    return User.findByIdAndDelete(
        userId
    );
};

// ============================================================
// Export
// ============================================================

const userRepository =
    Object.freeze({
        create,

        findById,

        findByIdWithPassword,

        findByEmail,

        findByEmailWithPassword,

        existsByEmail,

        updateById,

        updateByEmail,

        deleteById,
    });

export default userRepository;