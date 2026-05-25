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
  const role = user.role === "hiring_manager" ? "hiring_manager" : "candidate";

  return {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    role,
    demoInterviewsLeft: role === "candidate" ? user.demoInterviewsLeft ?? 3 : 0
  };
}

export async function register(req, res, next) {
  try {
    const role = req.body.role === "hiring_manager" ? "hiring_manager" : "candidate";

    if (!isDbReady()) {
      const user = {
        id: `mock-${role}-${Date.now()}`,
        name: req.body.name || (role === "candidate" ? "Candidate User" : "Hiring Manager"),
        email: req.body.email,
        role,
        demoInterviewsLeft: role === "candidate" ? 3 : 0
      };

      if (!user.email || !req.body.password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
      }

      return res.status(201).json({ user, token: signToken(user) });
    }

    const user = await User.create({
      ...req.body,
      role,
      demoInterviewsLeft: role === "candidate" ? 3 : 0
    });
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
