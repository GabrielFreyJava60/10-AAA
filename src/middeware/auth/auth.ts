import {Request, Response, NextFunction} from "express"
import JwtUtil from "../../security/JwtUtil.ts";

const BEARER = "Bearer ";

export interface AuthenticatedRequest extends Request {
  username?: string;
  role?: string;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.header("Authorization");
  
  if (!authHeader || !authHeader.startsWith(BEARER)) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  try {
    const token = authHeader.substring(BEARER.length);
    const payload = JwtUtil.verifyToken(token);
    
    req.username = payload.sub;
    req.role = payload.role;
    
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.role !== "ADMIN") {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.username || !req.role) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}