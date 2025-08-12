import {Request, Response, NextFunction} from "express"
import JwtUtil from "../../security/JwtUtil.ts";

export interface AuthenticatedRequest extends Request {
  username?: string;
  role?: string;
}

export function auth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "No token" });
    return;
  }
  try {
    const payload = JwtUtil.verifyToken(token);
    req.username = payload.sub;
    req.role = payload.role;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function admin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.role !== "ADMIN") {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  next();
}