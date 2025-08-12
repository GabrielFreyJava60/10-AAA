import { ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import {
  EmployeeAlreadyExistsError,
  EmployeeNotFoundError,
} from "../../service/EmployeesServiceMap.ts";
import { getZodMessage } from "./zod-errors-message.ts";

export const errorsHandler = (
  error: Error,
  __: Request,
  res: Response,
  ___: NextFunction
) => {
  let status = 400;
  
  if (error instanceof EmployeeAlreadyExistsError) status = 409;
  else if (error instanceof EmployeeNotFoundError) status = 404;
  else if (error.message === "No token" || error.message === "Invalid token") status = 401;
  else if (error.message === "Admin only") status = 403;
  
  const message = error instanceof ZodError ? getZodMessage(error) : error.message;
  res.status(status).json({ error: message });
};
