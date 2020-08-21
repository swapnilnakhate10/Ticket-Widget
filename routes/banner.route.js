let express = require('express');
let router = express.Router();
let log4js = require("log4js");
const logger = log4js.getLogger("Banner Routes");
let bannerController = require('../controllers/banner.controller');

logger.debug("Banner Routes Initiated");

router.get('/status', (req, res) => res.send('OK'));

router.get('/sync', bannerController.syncFandangoData);

router.post('/showtimes', bannerController.getNearbyShowTimes);

module.exports = router;