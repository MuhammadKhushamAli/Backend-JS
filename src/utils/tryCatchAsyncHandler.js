export const tryCatchAsyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        console.error("Error caught in tryCatchAsyncHandler:", error);
        res.status(error.status || 500).json(
            error,
        );
    }
}