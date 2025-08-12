import {Request, Response, NextFunction} from "express"
import JwtUtil from "../../security/JwtUtil.ts";

const BEARER = "Bearer ";

// Extend Request interface to include user information
export interface AuthenticatedRequest extends Request {
  username?: string;
  role?: string;
}

// Authentication middleware that makes decisions based on AAA rules
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.header("Authorization");
  
  // No token provided - return 401
  if (!authHeader || !authHeader.startsWith(BEARER)) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  try {
    const token = authHeader.substring(BEARER.length);
    const payload = JwtUtil.verifyToken(token);
    
    // Set user information in request
    req.username = payload.sub;
    req.role = payload.role;
    
    // Continue with request pipeline
    next();
  } catch (error) {
    // Invalid token - return 401
    res.status(401).json({ error: "Invalid token" });
  }
}

// Authorization middleware for ADMIN-only routes
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.role !== "ADMIN") {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  next();
}

// Authorization middleware for authenticated users (ADMIN or USER)
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.username || !req.role) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}