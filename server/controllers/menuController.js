const MenuItem = require('../models/MenuItem');

exports.list = async (req, res) => {
  const items = await MenuItem.find().sort({ createdAt: -1 });
  res.json(items);
};

exports.create = async (req, res) => {
  const { name, description, price, category } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : undefined;
  const item = new MenuItem({ name, description, price, category, image });
  await item.save();
  res.json(item);
};

exports.update = async (req, res) => {
  const update = { ...req.body };
  if (req.file) update.image = `/uploads/${req.file.filename}`;
  const item = await MenuItem.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json(item);
};

exports.remove = async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.json({ msg: 'Deleted' });
};
