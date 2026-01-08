const express = require("express");
const productRouter = express.Router();
const auth = require("../middlewares/auth");

const {createProduct,
    viewProducts,
    viweSingleProduct,
    updateProductDetails,
    updateStock,
    deleteProduct,
    searchProducts,
    filterProducts,
    sortProducts,
    bulkDeleteProducts,
    bulkUpdateProducts
} = require("../controllers/product");

const {createProductValidator} = require("../validators/productValidator");
const {updateProductValidator } = require("../validators/productValidator");
const {updateStockValidator} = require("../validators/productValidator");
const checkPermission = require("../middlewares/permission");



productRouter.post(
    "/createProduct",auth,checkPermission("can_add_product"),createProductValidator,createProduct
);

productRouter.patch(
  "/updateProduct/:id",auth,checkPermission("can_edit_product"),updateProductValidator,updateProductDetails);

productRouter.patch(
  "/updateProduct/:id/stock",auth,checkPermission("can_edit_product"),updateStockValidator,updateStock);

productRouter.delete(
  "/deleteProduct/:id",auth,checkPermission("can_delete_product"),deleteProduct);

productRouter.get(
  "/searchProduct/query",auth,searchProducts);

productRouter.get(
  "/filter",auth, filterProducts);

productRouter.get(
  "/sort",auth,sortProducts);

  productRouter.delete(
  "/bulk",auth,checkPermission("can_delete_product"),bulkDeleteProducts
);

productRouter.patch(
  "/bulk-update",auth,checkPermission("can_edit_product"),bulkUpdateProducts
);


productRouter.get("/products",auth, viewProducts);

productRouter.get("/products/:id",auth,  viweSingleProduct);



module.exports = productRouter;