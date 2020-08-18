let express = require('express');
let router = express.Router();
let bannerController = require('../controllers/banner.controller');

router.get('/status', (req, res) => res.send('OK'));

router.get('/all', bannerController.banner_list);

router.get('/sync', bannerController.syncFandangoData);

module.exports = router;