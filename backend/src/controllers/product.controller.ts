import { Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";
import { CategoryService } from "../services/category.service";
import { AuthenticatedRequest } from "../types";

export class ProductController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { name, category_id, sku, barcode, brand, description, cost_price, selling_price, tax_rate, discount, current_stock, min_stock_level, unit, image_url, store_id } = req.body;

      if (!name || selling_price === undefined) {
        res.status(400).json({ success: false, message: "Product name and selling price are required.", code: "VALIDATION_ERROR" });
        return;
      }

      const product = await ProductService.createProduct(businessId, {
        name,
        category_id,
        sku,
        barcode,
        brand,
        description,
        cost_price: parseFloat(cost_price || 0),
        selling_price: parseFloat(selling_price),
        tax_rate: parseFloat(tax_rate || 0),
        discount: parseFloat(discount || 0),
        current_stock: parseInt(current_stock || 0, 10),
        min_stock_level: parseInt(min_stock_level !== undefined ? min_stock_level : 5, 10),
        unit,
        image_url,
        store_id,
        user_id: req.user?.id
      });

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { search, category_id, low_stock, page, limit, sort_by, sort_order } = req.query;

      const data = await ProductService.getProducts(businessId, {
        search: search as string,
        category_id: category_id ? parseInt(category_id as string, 10) : undefined,
        low_stock: low_stock === "true",
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
        sort_by: sort_by as string,
        sort_order: sort_order as "ASC" | "DESC"
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const productId = parseInt(String(req.params.id), 10);
      const product = await ProductService.getProductById(businessId, productId);
      res.status(200).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  static async searchBarcode(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const barcode = String(req.params.barcode);
      const product = await ProductService.getProductByBarcode(businessId, barcode);

      if (!product) {
        res.status(404).json({ success: false, message: "No product found matching this barcode/SKU", code: "NOT_FOUND" });
        return;
      }

      res.status(200).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const productId = parseInt(String(req.params.id), 10);
      const product = await ProductService.updateProduct(businessId, productId, req.body);
      res.status(200).json({ success: true, message: "Product updated successfully", data: product });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const productId = parseInt(String(req.params.id), 10);
      const result = await ProductService.deleteProduct(businessId, productId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // Categories
  static async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const categories = await CategoryService.getCategories(businessId);
      res.status(200).json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  static async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const { name, description } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: "Category name is required", code: "VALIDATION_ERROR" });
        return;
      }
      const category = await CategoryService.createCategory(businessId, name, description);
      res.status(201).json({ success: true, message: "Category created", data: category });
    } catch (err) {
      next(err);
    }
  }

  static async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.businessId!;
      const categoryId = parseInt(String(req.params.id), 10);
      const result = await CategoryService.deleteCategory(businessId, categoryId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
