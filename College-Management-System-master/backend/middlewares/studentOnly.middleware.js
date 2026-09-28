const StudentDetail = require("../models/details/student-details.model");
const ApiResponse = require("../utils/ApiResponse");

const studentOnly = async (req, res, next) => {
  try {
    const s = await StudentDetail.findById(req.userId).select("_id");
    if (!s) {
      return ApiResponse.unauthorized("Student access only").send(res);
    }
    next();
  } catch (e) {
    return ApiResponse.error(e.message).send(res);
  }
};

module.exports = studentOnly;
