import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import pool from "../db.js";

const router = express.Router();
router.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const JWT_EXPIRES = "1h";

// -------------------- Rate limiter --------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "För många inloggningsförsök. Försök igen om 15 minuter.",
});

// -------------------- Registrering --------------------
router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Email, password och role krävs" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Lösenordet måste vara minst 8 tecken" });
  }

  try {
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Användaren finns redan" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      "INSERT INTO users (email, password_hash, role, status) VALUES ($1, $2, $3, 'pending') RETURNING id, email, role, status",
      [email, passwordHash, role]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      message: "Registrering mottagen. Väntar på godkännande av coach.",
      user: newUser,
    });
  } catch (error) {
    console.error("❌ Fel vid registrering:", error.message);
    res.status(500).json({ error: "Serverfel vid registrering" });
  }
});

// -------------------- Login --------------------
router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email och password krävs" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: "Felaktiga inloggningsuppgifter" });

    if (user.status !== "active") {
      return res.status(403).json({ error: "Konto väntar på godkännande av coach" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: "Felaktiga inloggningsuppgifter" });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 60 * 60 * 1000,
      })
      .json({
        message: "Inloggning lyckades",
        user: { id: user.id, email: user.email, role: user.role },
      });
  } catch (error) {
    console.error("❌ Fel vid login:", error.message);
    res.status(500).json({ error: "Serverfel vid login" });
  }
});

// -------------------- Coach-godkännande --------------------
router.put("/approve/:id", authenticate, requireRole("coach"), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE users SET status='active' WHERE id=$1 RETURNING id, email, role, status",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Användare hittades inte" });
    }

    res.json({ message: "✅ Användare godkänd", user: result.rows[0] });
  } catch (err) {
    console.error("❌ Fel vid godkännande:", err.message);
    res.status(500).json({ error: "Serverfel vid godkännande" });
  }
});

// -------------------- Logout --------------------
router.post("/logout", (req, res) => {
  res.clearCookie("token").json({ message: "Utloggad" });
});

// -------------------- Middleware --------------------
export function authenticate(req, res, next) {
  let token;
  const authHeader = req.headers["authorization"];
  if (authHeader) token = authHeader.split(" ")[1];
  if (!token && req.cookies) token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Token saknas" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Ogiltig token" });
    req.user = decoded;
    next();
  });
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Ej autentiserad" });
    if (req.user.role !== role) return res.status(403).json({ error: "Åtkomst nekad" });
    next();
  };
}

export default router;
