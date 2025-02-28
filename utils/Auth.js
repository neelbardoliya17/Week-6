import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

export const verifyToken = (token) => {
  try {
    if (!token) throw new Error("Unauthorized:No token provided");

    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new Error("Unauthorized:Invalid token");
  }
};
