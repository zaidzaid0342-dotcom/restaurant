const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'public/uploads'); },
  filename: function (req, file, cb) { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage });
const { list, create, update, remove } = require('../controllers/menuController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/', list);
router.post('/', auth, admin, upload.single('image'), create);
router.put('/:id', auth, admin, upload.single('image'), update);
router.delete('/:id', auth, admin, remove);

module.exports = router;
