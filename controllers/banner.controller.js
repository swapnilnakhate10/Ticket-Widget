let express = require('express');
let bannerService = require('../services/banner.service');

module.exports = {
    banner_list : banner_list,
    syncFandangoData : syncFandangoData
};

function banner_list(req, res) {
  bannerService.banner_list((err, result) => {
    if(err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(result);
    }
  });
};

function syncFandangoData(req, res) {
  bannerService.syncFandangoData();
  res.status(200).send({message : "Sync Triggered"});
};
