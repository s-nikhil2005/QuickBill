const { body } = require("express-validator");
const validator = require("validator");

// ----------------------------------------------------
// CREATE PRODUCT VALIDATOR (manual validation)
// ----------------------------------------------------
exports.createProductValidator = (req, res, next) => {
    const { name, category, brand, size, color, price, stock } = req.body;

    // Required fields
    if (!name || name.trim() === "") {
        return res.status(400).json({ message: "Product name is required" });
    }

    if (!category || category.trim() === "") {
        return res.status(400).json({ message: "Category is required" });
    }

    // Optional brand
    if (brand && brand.trim() === "") {
        return res.status(400).json({ message: "Brand cannot be empty if provided" });
    }

    // Optional size
    if (size && size.trim() === "") {
        return res.status(400).json({ message: "Size cannot be empty if provided" });
    }

    // Categories where color is required
    const colorRequiredCategories = [
        "clothes",
        "clothing",
        "fashion",
        "footwear",
        "shoes",
        "home decor",
        "furniture"
    ];

    if (colorRequiredCategories.includes(category.toLowerCase())) {
        if (!color || color.trim() === "") {
            return res.status(400).json({
                message: `Color is required for category: ${category}`
            });
        }
    }

    // Price validation
    if (price == null || isNaN(price) || Number(price) < 0) {
        return res.status(400).json({ message: "Price must be a non-negative number" });
    }

    // Stock validation
    if (stock == null || !Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({ message: "Stock must be a non-negative integer" });
    }

    next();
};

// ----------------------------------------------------
// UPDATE PRODUCT DETAILS VALIDATOR (express-validator)
// All fields optional
// ----------------------------------------------------
exports.updateProductValidator = [
    body("name")
        .optional()
        .isString()
        .withMessage("Name must be a string"),

    body("category")
        .optional()
        .isString()
        .withMessage("Category must be a string"),

    body("brand")
        .optional()
        .isString()
        .withMessage("Brand must be a string"),

    body("size")
        .optional()
        .isString()
        .withMessage("Size must be a string"),

    body("color")
        .optional()
        .isString()
        .withMessage("Color must be a string"),

    body("price")
        .optional()
        .isFloat({ gt: 0 })
        .withMessage("Price must be a positive number")
];

// ----------------------------------------------------
// UPDATE STOCK VALIDATOR (manual)
// Only stock field allowed
// ----------------------------------------------------
exports.updateStockValidator = (req, res, next) => {
    const { stock } = req.body;

    if (stock == null) {
        return res.status(400).json({ message: "Stock is required" });
    }

    if (!Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({ message: "Stock must be a non-negative integer" });
    }

    next();
};
