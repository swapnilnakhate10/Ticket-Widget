let express = require('express');
let log4js = require("log4js");
let bannerService = require('../services/banner.service');

const logger = log4js.getLogger("Banner Controller");
logger.debug("Banner Controller Initiated");

module.exports = {
    getNearbyShowTimes : getNearbyShowTimes,
    syncFandangoData : syncFandangoData
};

function getNearbyShowTimes(req, res) {
  logger.debug("Inside getNearbyShowTimes");
  let zipcode = req.body.zipcode;
  let movieId = req.body.movieId;
  bannerService.getShowTimes(zipcode, movieId, (err, result) => {
    if(err) {
      logger.error("getNearbyShowTimes : "+err);
      res.status(500).send(err);
    } else {
      logger.debug("Success getShowTimes : "+result.length);
      res.status(200).send(result);
    }
  });
}

function syncFandangoData(req, res) {
  logger.debug("Inside syncFandangoData : Sync Triggered");
  bannerService.syncFandangoData();
  res.status(200).send({message : "Sync Triggered"});
};
