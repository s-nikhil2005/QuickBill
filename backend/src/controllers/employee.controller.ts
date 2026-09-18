import { Response, NextFunction } from "express";
import { EmployeeService } from "../services/employee.service";
import { AuthenticatedRequest } from "../types";

export class EmployeeController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const employees = await EmployeeService.getEmployees(businessId);
      res.status(200).json({ success: true, data: employees });
    } catch (err) {
      next(err);
    }
  }

  static async add(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { name, email, password, phone, role, store_id } = req.body;

      if (!name || !email || !role) {
        res.status(400).json({ success: false, message: "Name, email, and role are required.", code: "VALIDATION_ERROR" });
        return;
      }

      const employee = await EmployeeService.addEmployee(businessId, {
        name,
        email,
        password,
        phone,
        role,
        store_id
      });

      res.status(201).json({ success: true, message: "Employee added successfully", data: employee });
    } catch (err) {
      next(err);
    }
  }

  static async updateRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const memberId = parseInt(String(req.params.id), 10);
      const { role } = req.body;

      if (!role) {
        res.status(400).json({ success: false, message: "Role is required.", code: "VALIDATION_ERROR" });
        return;
      }

      const result = await EmployeeService.updateRole(businessId, memberId, role);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async setStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const memberId = parseInt(String(req.params.id), 10);
      const { status } = req.body;

      if (!status || !["ACTIVE", "DEACTIVATED"].includes(status)) {
        res.status(400).json({ success: false, message: "Valid status ('ACTIVE' | 'DEACTIVATED') is required.", code: "VALIDATION_ERROR" });
        return;
      }

      const result = await EmployeeService.setStatus(businessId, memberId, status);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const memberId = parseInt(String(req.params.id), 10);
      const result = await EmployeeService.removeEmployee(businessId, memberId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
