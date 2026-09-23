// ============================================================
// CuratoCV Async Handler
// ============================================================
//
// Wraps asynchronous Express route/controller handlers so
// rejected promises are automatically forwarded to Express's
// error-handling middleware.
//
// Without this wrapper, every async controller would need:
//
//     try {
//         ...
//     } catch (error) {
//         next(error);
//     }
//
// With asyncHandler:
//
//     export const handler = asyncHandler(
//         async (req, res) => {
//             ...
//         }
//     );
//
// ============================================================

// ============================================================
// asyncHandler
// ============================================================

const asyncHandler = (
    handler
) => {
    if (
        typeof handler !==
        "function"
    ) {
        throw new TypeError(
            "asyncHandler requires a function."
        );
    }

    return function wrappedHandler(
        req,
        res,
        next
    ) {
        /*
         * Promise.resolve() handles both:
         *
         * - async functions
         * - functions returning normal values
         *
         * Any rejected promise is forwarded to Express's
         * error middleware.
         */
        return Promise.resolve(
            handler(
                req,
                res,
                next
            )
        ).catch(next);
    };
};

// ============================================================
// Export
// ============================================================

export default asyncHandler;