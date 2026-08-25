import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Get token from header

    if (!token) {
        return res.status(401).json({ message: "Unauthorized, no token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId; // Attach user info to request object
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized, token failed" });
    }
}

export default protect;