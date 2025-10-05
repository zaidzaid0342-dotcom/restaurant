// backend/controllers/menuController.js
const MenuItem = require('../models/MenuItem');

exports.list = async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
};

exports.create = async (req, res) => {
  try {
    console.log('=== CREATE MENU ITEM START ===');
    console.log('Raw request body:', JSON.stringify(req.body, null, 2));
    
    // Get all fields directly from req.body
    const name = req.body.name;
    const description = req.body.description;
    const price = req.body.price;
    const category = req.body.category;
    const imageUrl = req.body.imageUrl;
    const available = req.body.available;
    
    console.log('Extracted fields:', { name, description, price, category, imageUrl, available });
    
    // Basic validation
    if (!name || !price) {
      return res.status(400).json({ 
        message: 'Name and price are required',
        received: { name, price }
      });
    }
    
    // Convert price to number
    const numericPrice = Number(price);
    if (isNaN(numericPrice)) {
      return res.status(400).json({ 
        message: 'Price must be a valid number',
        received: price
      });
    }
    
    // Create the item with explicit values
    const itemData = {
      name: name,
      description: description || '',
      price: numericPrice,
      category: category || '',
      available: available === true || available === 'true' || available === undefined,
      imageUrl: imageUrl || null
    };
    
    console.log('Item data to save:', itemData);
    
    const item = new MenuItem(itemData);
    const savedItem = await item.save();
    
    console.log('Item saved successfully:', savedItem);
    
    res.status(201).json(savedItem);
    console.log('=== CREATE MENU ITEM SUCCESS ===');
  } catch (error) {
    console.error('=== CREATE MENU ITEM ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    
    // Send detailed error in response
    res.status(500).json({ 
      message: 'Failed to create menu item',
      error: error.message,
      name: error.name,
      stack: error.stack,
      receivedBody: req.body
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, available } = req.body;
    
    const updateData = { name, description, category, available };
    
    if (price !== undefined) {
      updateData.price = Number(price);
    }
    
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }
    
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Failed to update menu item' });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Failed to delete menu item' });
  }
};