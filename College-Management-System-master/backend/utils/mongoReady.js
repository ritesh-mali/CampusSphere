const mongoose = require("mongoose");

/** True when Mongoose has an active connection (same DB as the rest of the app). */
function mongoReady() {
  return mongoose.connection.readyState === 1;
}

module.exports = mongoReady;
