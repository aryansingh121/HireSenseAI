import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isDbReady } from "../config/db.js";

export async function protect(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");

    if (isDbReady() && decoded.id !== "demo-user") {
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return res.status(401).json({ message: "User not found" });
      req.user = user;
    } else {
      req.user = {
        id: decoded.id,
        name: decoded.name || "Demo HR",
        email: decoded.email,
        role: decoded.role || "hr"
      };
    }

    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
