import jwt from "jsonwebtoken";
import { isDbReady } from "../config/db.js";
import User from "../models/User.js";

function signToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" }
  );
}

export async function register(req, res, next) {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ message: "MongoDB is required for registration" });
    }

    const user = await User.create(req.body);
    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    return res.status(201).json({ user: safeUser, token: signToken(safeUser) });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!isDbReady()) {
      const demoEmail = process.env.DEMO_EMAIL || "hr@hiresense.ai";
      const demoPassword = process.env.DEMO_PASSWORD || "password123";

      if (email === demoEmail && password === demoPassword) {
        const user = {
          id: "demo-user",
          name: "Demo HR",
          email: demoEmail,
          role: "hr"
        };
        return res.json({ user, token: signToken(user) });
      }

      return res.status(401).json({ message: "Invalid demo credentials" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: signToken(user)
    });
  } catch (error) {
    return next(error);
  }
}

export function me(req, res) {
  res.json({ user: req.user });
}
