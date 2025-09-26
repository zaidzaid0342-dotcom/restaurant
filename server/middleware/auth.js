const jwt = require('jsonwebtoken');
const User = require('../models/User');
module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ msg: 'No token, authorization denied' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ msg: 'User not found' });
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
