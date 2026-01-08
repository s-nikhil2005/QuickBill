const ProductModel = require("../models/product");

exports.createProduct = async (req, res) => {
  try {
    const { name, category, brand, size, color, price, stock } = req.body;

    const productId = await ProductModel.createProduct({
      name,
      category,
      brand,
      size,
      color,
      price,
      stock
    });

    res.status(201).json({
      message: "Product created successfully",
      productId
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating product",
      error: err.message
    });
  }
};


exports.updateProductDetails  = async (req, res) => {

  try{
          const productId = req.params.id;
      const { name, category, brand, size, color, price } = req.body;

      const product = await ProductModel.getProductById(productId);
      if(!product){
          return res.status(404).json({
              message: "Product not found"
          });
      }
      await ProductModel.updateProduct(product,{
          name,
          category,
          brand,
          size,
          color,
          price
      });
      res.status(200).json({
          message: "Product updated successfully"
      });

  }
  catch(err){
      res.status(500).json({
          message: "Error updating product",
          error: err.message
      });
  }
}

exports.updateStock = async (req, res) => {

  try{
          const productId = req.params.id;
          const { stock } = req.body;
      const product = await ProductModel.getProductById(productId);
      if(!product){
          return res.status(404).json({
              message: "Product not found"
          });
      }
      await ProductModel.updateProduct(product,{ stock});
      res.status(200).json({
          message: "Product updated successfully"
      });

  }
  catch(err){
      res.status(500).json({
          message: "Error updating product",
          error: err.message
      });
  }
}

exports.deleteProduct = async (req,res) =>{

  try{
         const productId = req.params.id;
         const productAvailable = await ProductModel.getProductById(productId);
         if(!productAvailable){
             return res.status(404).json({
                 message: "Product not found"
             });
         }
         await ProductModel.deleteProduct(productId);
         res.status(200).json({
             message: "Product deleted successfully"
         });
  }
  catch(err){ 
      res.status(500).json({
          message: "Error deleting product",
          error: err.message
      });
  }
}

exports.searchProducts = async (req, res) => {
  try {
    const { name, brand, category, color, size } = req.query;

    // If no query params provided
    if (!name && !brand && !category && !color && !size) {
      return res.status(400).json({
        message: "Please provide at least one search query"
      });
    }

    const results = await ProductModel.searchProducts({
      name,
      brand,
      category,
      color,
      size
    });

    if (results.length === 0) {
      return res.status(404).json({
        message: "No products match your search"
      });
    }

    res.status(200).json({
      message: "Products fetched successfully",
      products: results
    });

  } catch (err) {
    res.status(500).json({
      message: "Error searching products",
      error: err.message
    });
  }
};

exports.filterProducts = async (req, res) => {
  try {
    const { category, priceMin, priceMax, stockMin, stockMax } = req.query;

    const results = await ProductModel.filterProducts({
      category,
      priceMin,
      priceMax,
      stockMin,
      stockMax
    });

    res.status(200).json({
      message: "Filtered products fetched successfully",
      products: results
    });

  } catch (err) {
    res.status(500).json({
      message: "Error filtering products",
      error: err.message
    });
  }
};

exports.sortProducts = async (req, res) => {
  try {
    const { by = "price", order = "asc" } = req.query;

    const allowedFields = ["price", "name", "stock", "category"];
    const allowedOrder = ["asc", "desc"];

    if (!allowedFields.includes(by)) {
      return res.status(400).json({ message: "Invalid sort field" });
    }

    if (!allowedOrder.includes(order.toLowerCase())) {
      return res.status(400).json({ message: "Invalid sort order" });
    }

    const results = await ProductModel.sortProducts(by, order);

    res.status(200).json({
      message: "Sorted products fetched successfully",
      products: results
    });

  } catch (err) {
    res.status(500).json({
      message: "Error sorting products",
      error: err.message
    });
  }
};

exports.bulkDeleteProducts = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Provide product IDs array" });
    }

    await ProductModel.bulkDelete(ids);

    res.status(200).json({
      message: "Products deleted successfully",
      deletedIds: ids
    });

  } catch (err) {
    res.status(500).json({
      message: "Bulk delete failed",
      error: err.message
    });
  }
};

exports.bulkUpdateProducts = async (req, res) => {
  try {
    const { ids, ...updates } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Provide product IDs array" });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No fields provided to update"
      });
    }

    await ProductModel.bulkUpdate(ids, updates);

    res.status(200).json({
      message: "Products updated successfully",
      updatedIds: ids
    });

  } catch (err) {
    res.status(500).json({
      message: "Bulk update failed",
      error: err.message
    });
  }
};


exports.viewProducts = async (req,res) =>{

  try{
           const userId=req.body.userId; 
        const product = await ProductModel.getAllProducts(userId);
        res.status(200).json({
            message: "Products fetched successfully",
            products: product
        });
  }
  catch(err){
      res.status(500).json({
          message: "Error fetching products",
          error: err.message
      });
  }

}

exports.viweSingleProduct = async (req,res) =>{

  try{
           const productId = req.params.id;
        const product = await ProductModel.getProductById(productId);
        res.status(200).json({
            message: "Product fetched successfully",
            product: product
        });
  }
  catch(err){
      res.status(500).json({
          message: "Error fetching product",
          error: err.message
      });
  }
}