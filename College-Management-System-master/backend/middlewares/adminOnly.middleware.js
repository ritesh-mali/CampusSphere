const adminDetails = require("../models/details/admin-details.model");
const ApiResponse = require("../utils/ApiResponse");

/** Must run after auth.middleware */
const adminOnly = async (req, res, next) => {
  try {
    const admin = await adminDetails.findById(req.userId).select("_id");
    if (!admin) {
      return ApiResponse.unauthorized("Admin access only").send(res);
    }
    next();
  } catch (e) {
    return ApiResponse.error(e.message).send(res);
  }
};

module.exports = adminOnly;
