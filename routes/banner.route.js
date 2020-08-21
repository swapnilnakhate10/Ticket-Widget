let express = require('express');
let router = express.Router();
let bannerController = require('../controllers/banner.controller');

router.get('/status', (req, res) => res.send('OK'));

router.get('/sync', bannerController.syncFandangoData);

router.post('/showtimes', bannerController.getNearbyShowTimes);

module.exports = router;