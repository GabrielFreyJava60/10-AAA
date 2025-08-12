import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import "dotenv/config";
import _ from "lodash";
import { Employee } from "../model/Employee.ts";
import service from "../service/EmployeesServiceMap.ts";
import { errorsHandler } from "../middeware/errors-handling/handler.ts";
import validation from "../middeware/validation/validation.ts";
import { EmployeeSchema, EmployeeSchemaPartial } from "../middeware/validation/schemas.ts";
import {   getRandomEmployees } from "../utils/service-helpers.ts";
import accountingService from "../service/AccountingServiceMap.ts";
import { authenticate, requireAdmin, requireAuth, AuthenticatedRequest } from "../middeware/auth/auth.ts";


const { PORT, MORGAN_FORMAT, SKIP_CODE_THRESHOLD } = process.env;
const port = PORT || 3500;

const morganFormat = MORGAN_FORMAT ?? "tiny";
const skipCodeThreshold = SKIP_CODE_THRESHOLD ?? 400;
const app = express();
const server = app.listen(port, () =>
  console.log("server is listening on port " + port)
);
app.use(express.json());
app.use(
  morgan(morganFormat, {
    skip: (_, res) => res.statusCode < +skipCodeThreshold,
  })
);
//getting data about all Employee objects, filtered by optional department in query string
// AAA Rule: Authentication required, may be performed for either ADMIN or USER
app.get("/employees", authenticate, requireAuth, (req: AuthenticatedRequest, res) => {
  res.json(service.getAll(req.query.department as string));
});
//Adding new employee
// AAA Rule: Authentication required, may be performed for only ADMIN
app.post("/employees", authenticate, requireAdmin, validation(EmployeeSchema), (req: AuthenticatedRequest, res) => {
  res.json(service.addEmployee(req.body as Employee));
});
//deleting employee
// AAA Rule: Authentication required, may be performed for only ADMIN
app.delete("/employees/:id", authenticate, requireAdmin, (req: AuthenticatedRequest, res) => {
  res.json(service.deleteEmployee(req.params.id));
});
//Updating employee
// AAA Rule: Authentication required, may be performed for only ADMIN
app.patch(
  "/employees/:id",
  authenticate,
  requireAdmin,
  validation(EmployeeSchemaPartial),
  (req: AuthenticatedRequest, res) => {
    res.json(service.updateEmployee(req.params.id, req.body));
  }
);

// AAA Rule: Authentication isn't required
app.post("/login", (req, res) => {
    res.send(accountingService.login(req.body))
})
app.use(errorsHandler);
function shutdown() {
  //graceful shutdown
  server.close(() => {
    console.log("server closed");
    service.save();
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
if (process.env.NODE_ENV !== "production") {
   if (service.getAll().length === 0) {
    const employees = getRandomEmployees();
    employees.forEach(empl => service.addEmployee(empl));
   }
}



