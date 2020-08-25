let express = require('express');
var fetchUrl = require("fetch").fetchUrl;
let CronJob = require('cron').CronJob;
const config = require('config');
let log4js = require("log4js");
let { v4 : uuidv4 } = require('uuid');
let moviesJSON = require('./../config/Movie.json');
let movieTheaterJSON = require('./../config/MovieTheater.json');
let screeningEventJSON = require('./../config/ScreeningEvent.json');
let TheaterDataModel = require('../models/theaterData.model');
let bannerService = require('./mail.service');

const logger = log4js.getLogger("Banner Service");
logger.debug("Banner Service Initiated");

let first_job = new CronJob(config.get('first_cron_job'), syncFandangoData);
let second_job = new CronJob(config.get('second_cron_job'), syncFandangoData);

first_job.start();
second_job.start();

module.exports = {
    syncFandangoData : syncFandangoData,
    getShowTimes : getShowTimes
};

function syncFandangoData() {
  logger.debug("================== Sync Fandango Data Initiated ====================");
  let allMoviesProimse = getAllMovies();
  let allMovieTheatersProimse = getAllMovieTheaters();
  let allScreeningEventsProimse = getAllScreeningEvents();
  Promise.all([allMoviesProimse, allMovieTheatersProimse, allScreeningEventsProimse]).then((values) => {
    logger.debug("Fandango Data received from all API's");
    let allMovies = values[0];
    let allMovieTheaters = values[1];
    let allScreeningEvents = values[2];
    convertFandangoData(allMovies, allMovieTheaters, allScreeningEvents);
  });
}

async function convertFandangoData(allMovies, allMovieTheaters, allScreeningEvents) {
  logger.debug("Converting Fandango Data ==> ");
  logger.debug("Movies : "+allMovies.length);
  logger.debug("Theaters : "+allMovieTheaters.length);
  logger.debug("Screening Events : "+allScreeningEvents.length);
  // let fandangoData = [];
  let uniqueId = uuidv4();
  logger.debug("Current UUID : "+uniqueId);
  for(let movieTheater of allMovieTheaters) {
    let theaterData = new TheaterDataModel();
    theaterData.name = movieTheater.name;
    theaterData.telephone = movieTheater.telephone;
    theaterData.addressCountry = movieTheater.address.addressCountry;
    theaterData.addressLocality = movieTheater.address.addressLocality;
    theaterData.addressRegion = movieTheater.address.addressRegion;
    theaterData.postalCode = parseInt(movieTheater.address.postalCode);
    theaterData.streetAddress = movieTheater.address.streetAddress;
    theaterData.theaterId = movieTheater['@id'];
    theaterData.uuid = uniqueId;

    theaterData.showtimes = getScreeningEventsOfTheater(theaterData.theaterId, allScreeningEvents, allMovies);
    await theaterData.save((err, user) => {
      if (err) {
        logger.error('Unable to save Theater Data : '+theaterData.name +' : '+theaterData.theaterId);
        logger.error(err);
      }
  });
    // fandangoData.push(theaterData);
  }
  logger.debug("Succefully converted Fandango data");
  logger.debug("================== Sync Fandango Data Ended ====================");
  await flushOldFandangoData(uniqueId);
  let successMessage = "Success for CronJob execution.";
  // bannerService.sendMail(successMessage);
}

async function flushOldFandangoData(uniqueId) {
  logger.debug('Database flushed for Theater data =>>');
  let removedData = await TheaterDataModel.deleteMany({ uuid : { $ne: uniqueId } });
  logger.debug(removedData);
}

function getScreeningEventsOfTheater(theaterId, allScreeningEvents, allMovies) {
  // logger.debug('Inside getScreeningEventsOfTheater for Theater : ');
  let screeningEventsByTheaterId = allScreeningEvents.filter((screeningEvent) => {
    return screeningEvent.location['@id'] == theaterId;
  });
  let screeningEventsOfTheater = [];

  screeningEventsByTheaterId.forEach(event => {
    let showTime = {
      dateTime : {},
      links : [] 
    };
    let eventId = event.workPerformed['@id'];
    showTime.dateTime["local"] = event.startDate;
    let eventDate = event.startDate.substring(0, 10);
    showTime.eventDate = new Date(eventDate);
    let allOffersLink = event.offers;
    for(let offer of allOffersLink) {
      showTime.links.push({ href : offer.url });
    }
    showTime.movieId = eventId;

    let moviesList = allMovies.filter((movie) => {
      return movie['@id'] == eventId;
    });

    if(moviesList && moviesList.length == 1 ) {
      let movieDetails = moviesList[0];
      showTime.movieName = movieDetails.name[0]['@value'];
      showTime.moviePosters = movieDetails.image;
      screeningEventsOfTheater.push(showTime);
    } else if(moviesList.length > 1) {
      console.log("Count > 1 for Movie : "+showTime.movieLink+' is '+moviesList.length);
    } else {
      // console.log("Count for Movie : "+showTime.movieLink+' is '+moviesList.length);
    }
  });

  return screeningEventsOfTheater;
}

async function getAllMovies() {
  let moviesURL = config.get('fandangoAPI.moviesAPI');
  return new Promise((resolve, reject) => {
    fetchUrl(moviesURL, function(error, meta, body){
      if(error) {
        logger.error("getAllMovies Error ==>");
        logger.error(error);
        reject(error);
      } else {
        // let moviesList = body.toString();
        let moviesList = moviesJSON.dataFeedElement;
        logger.debug('Movie Count :: '+moviesList.length);
        resolve(moviesList);
      }
    });  
  }).catch((e) => {
    logger.error('getAllMovies Caugth exception :: '+e);
    Promise.reject(e);
  });
}

async function getAllMovieTheaters() {
  let movieTheatersURL = config.get('fandangoAPI.theatersAPI');
  return new Promise((resolve, reject) => {
    fetchUrl(movieTheatersURL, function(error, meta, body){
      if(error) {
        logger.error("getAllMovieTheaters Error ==>");
        logger.error(error);
        reject(error);
      } else {
        // let movieTheatersList = body.toString();
        let movieTheatersList = movieTheaterJSON.dataFeedElement;
        logger.debug('Movie Theaters Count :: '+movieTheatersList.length);
        resolve(movieTheatersList);
      }
    });  
  }).catch((e) => {
    logger.error('getAllMovieTheaters Caugth exception :: '+e);
    Promise.reject(e);
  });
}

async function getAllScreeningEvents() {
  let screeningEventsURL = config.get('fandangoAPI.eventsAPI');
  return new Promise((resolve, reject) => {
    fetchUrl(screeningEventsURL, function(error, meta, body){
      if(error) {
        logger.error("getAllScreeningEvents Error ==> ");
        logger.error(error);
        reject(error);
      } else {
        // let screeningEventsList = body.toString();
        let screeningEventsList = screeningEventJSON;
        logger.debug('Screening Events Count :: '+screeningEventsList.length);
        resolve(screeningEventsList);
      }
    });  
  }).catch((e) => {
    logger.error('GetAllScreeningEvents Caugth exception :: '+e);
    Promise.reject(e);
  });
}

async function getShowTimes(pincode, movieId, callback) {
  logger.debug('Get show times initiated.');
  let aggregateQuery = [];
  if(movieId && movieId != "") {
    let movieLinkId = 'https://www.fandango.com/movies/' + movieId;
    aggregateQuery = [
      {
        $match: {
          'postalCode' : pincode,
          'showtimes.movieId' : movieLinkId,
		      'showtimes.eventDate' : {  "$gte" : new Date() }
        }
      },
      {
        $project: {
          showtimes: {
              $filter: {
                  input: '$showtimes',
                  as: 'showtime',
                  cond: { $eq: ['$$showtime.movieId', movieLinkId] }
              }
          },
          name : 1,
          _id: 1
      }
    }];
  } else {
    aggregateQuery = [
      {
        $match: {
          'postalCode' : pincode,
          'showtimes.eventDate' : {  "$gte" : new Date() }
        }
      },
      {
        $project: {
          showtimes: 1,
          name : 1,
          _id: 1
        }
      }
    ];
  }
  
  let showTimesList = await TheaterDataModel.aggregate(aggregateQuery);

  if(showTimesList && showTimesList.length && showTimesList.length > 0) {
    logger.debug('Returning response for Get show times : '+showTimesList.length);
    callback(null, showTimesList);
  } else {
    logger.error('Error for Get show times : ');
    logger.error(showTimesList);
    callback(showTimesList, null);
  }
}

