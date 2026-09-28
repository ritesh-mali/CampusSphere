const adminDetails = require("../models/details/admin-details.model");
const FacultyDetail = require("../models/details/faculty-details.model");
const ApiResponse = require("../utils/ApiResponse");

const facultyOrAdmin = async (req, res, next) => {
  try {
    const [admin, faculty] = await Promise.all([
      adminDetails.findById(req.userId).select("_id"),
      FacultyDetail.findById(req.userId).select("_id"),
    ]);
    if (!admin && !faculty) {
      return ApiResponse.unauthorized("Faculty or admin access only").send(res);
    }
    req.campusCreatorRole = admin ? "admin" : "faculty";
    next();
  } catch (e) {
    return ApiResponse.error(e.message).send(res);
  }
};

module.exports = facultyOrAdmin;
