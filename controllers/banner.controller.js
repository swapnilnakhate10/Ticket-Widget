let express = require('express');
let bannerService = require('../services/banner.service');

module.exports = {
    getNearbyShowTimes : getNearbyShowTimes,
    syncFandangoData : syncFandangoData
};

function getNearbyShowTimes(req, res) {
  let zipcode = req.body.zipcode;
  let movieId = req.body.movieId;
  bannerService.getShowTimes(zipcode, movieId, (err, result) => {
    if(err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(result);
    }
  });
}

function syncFandangoData(req, res) {
  bannerService.syncFandangoData();
  res.status(200).send({message : "Sync Triggered"});
};
