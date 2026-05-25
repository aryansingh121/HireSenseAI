import jwt from "jsonwebtoken";
import { isDbReady } from "../config/db.js";
import User from "../models/User.js";

function signToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      demoInterviewsLeft: user.demoInterviewsLeft
    },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" }
  );
}

function toSafeUser(user) {
  return {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    demoInterviewsLeft: user.demoInterviewsLeft
  };
}

export async function register(req, res, next) {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ message: "MongoDB is required for registration" });
    }

    const user = await User.create(req.body);
    const safeUser = toSafeUser(user);

    return res.status(201).json({ user: safeUser, token: signToken(safeUser) });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!isDbReady()) {
      const demoUsers = [
        {
          id: "demo-hiring-manager",
          name: "Demo Hiring Manager",
          email: process.env.DEMO_EMAIL || "hr@hiresense.ai",
          password: process.env.DEMO_PASSWORD || "password123",
          role: "hiring_manager"
        },
        {
          id: "demo-candidate",
          name: "Demo Candidate",
          email: process.env.DEMO_CANDIDATE_EMAIL || "candidate@hiresense.ai",
          password: process.env.DEMO_CANDIDATE_PASSWORD || "password123",
          role: "candidate",
          demoInterviewsLeft: 3
        }
      ];

      const demoUser = demoUsers.find(
        (user) => user.email === email && user.password === password
      );

      if (demoUser) {
        const { password: _password, ...user } = demoUser;
        return res.json({ user, token: signToken(user) });
      }

      return res.status(401).json({ message: "Invalid demo credentials" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      user: toSafeUser(user),
      token: signToken(user)
    });
  } catch (error) {
    return next(error);
  }
}

export function me(req, res) {
  res.json({ user: req.user });
}
