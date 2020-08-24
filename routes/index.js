const express = require('express');
const bannerRoutes = require('./banner.route');

const router = express.Router();

router.get('/', (req, res) => res.send('Welome !!'));
router.use('/v1/banner', bannerRoutes);

module.exports = router;