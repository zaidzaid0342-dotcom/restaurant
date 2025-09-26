module.exports = function (req, res, next) {
  if (!req.user) return res.status(401).json({ msg: 'No user in request' });
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Admin resource. Access denied.' });
  next();
};
