import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "./db";

export interface User {
  id: number;
  email: string;
  role: string;
}

// Validate and retrieve JWT_SECRET at module load time
function getValidatedJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is required for application startup. " +
      "Please set JWT_SECRET to a strong, random string of at least 32 characters."
    );
  }
  
  if (secret.length < 32) {
    throw new Error(
      "FATAL: JWT_SECRET must be at least 32 characters long for security. " +
      `Current length: ${secret.length} characters.`
    );
  }
  
  return secret;
}

// Validate and cache the secret at module load
const JWT_SECRET = getValidatedJwtSecret();

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

export function verifyToken(token: string): User | null {
  try {
    return jwt.verify(token, JWT_SECRET) as User;
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query(
    "SELECT id, email, role FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0] || null;
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  const result = await query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (!user) return null;

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return null;

  return { id: user.id, email: user.email, role: user.role };
}
