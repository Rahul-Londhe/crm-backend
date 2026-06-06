const jwt = require("jsonwebtoken");

function auth(req, res, next) {

  // Allow CORS Preflight Requests

  if (req.method === "OPTIONS") {
    return next();
  }

  try {

    const token =
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (err) {

    console.error(
      "AUTH ERROR:",
      err.message
    );

    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });

  }

}

module.exports = auth;