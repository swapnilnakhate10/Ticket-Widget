let express = require('express');
var fetchUrl = require("fetch").fetchUrl;
let CronJob = require('cron').CronJob;
let alasql = require('alasql');
let config = require('./../config/config.json');
let moviesJSON = require('./../config/Movie.json');
let movieTheaterJSON = require('./../config/MovieTheater.json');
let screeningEventJSON = require('./../config/ScreeningEvent.json');
let MovieModel = require('../models/movie.model');
let TheaterModel = require('../models/theater.model');
let EventsModel = require('../models/events.model');
let TheaterDataModel = require('../models/theaterData.model');
let bannerService = require('./mail.service');

let first_job = new CronJob(config.first_cron_job, syncFandangoData);
let second_job = new CronJob(config.second_cron_job, syncFandangoData);

first_job.start();
second_job.start();

module.exports = {
    syncFandangoData : syncFandangoData,
    getShowTimes : getShowTimes
};

function syncFandangoData() {
  // console.log('You will see this message every second');
  let allMoviesProimse = getAllMovies();
  let allMovieTheatersProimse = getAllMovieTheaters();
  let allScreeningEventsProimse = getAllScreeningEvents();
  Promise.all([allMoviesProimse, allMovieTheatersProimse, allScreeningEventsProimse]).then((values) => {
    console.log("Data received from all API's");
    console.log(values.length);
    let allMovies = values[0];
    let allMovieTheaters = values[1];
    let allScreeningEvents = values[2];
    convertFandangoData(allMovies, allMovieTheaters, allScreeningEvents);
  });
}

async function convertFandangoData(allMovies, allMovieTheaters, allScreeningEvents) {
  let fandangoData = [];
  for(let movieTheater of allMovieTheaters) {
    let theaterData = new TheaterDataModel();
    theaterData.name = movieTheater.name;
    theaterData.telephone = movieTheater.telephone;
    theaterData.addressCountry = movieTheater.address.addressCountry;
    theaterData.addressLocality = movieTheater.address.addressLocality;
    theaterData.addressRegion = movieTheater.address.addressRegion;
    theaterData.postalCode = movieTheater.address.postalCode;
    theaterData.streetAddress = movieTheater.address.streetAddress;
    theaterData.theaterId = movieTheater['@id'];

    theaterData.showtimes = getScreeningEventsOfTheater(theaterData.theaterId, allScreeningEvents, allMovies);
    fandangoData.push(theaterData);
  }
  let removedData = await TheaterDataModel.deleteMany({});
  console.log('Removed all Theater data : ');
  console.log(removedData);
  await TheaterDataModel.insertMany(fandangoData).then(function() { 
    console.log("Theater data saved count : "+fandangoData.length);
    let successMessage = "Success for CronJob execution.";
    bannerService.sendMail(successMessage);
  }).catch(function(error) {
    let errorMessage = "Error for CronJob execution.";
    bannerService.sendMail(errorMessage);
    console.log(errorMessage);
    console.log(error);
  });
}

function getScreeningEventsOfTheater(theaterId, allScreeningEvents, allMovies) {
  // console.log('movieTheater Id : '+theaterId);
  let result = allScreeningEvents.filter((screeningEvent) => {
    return screeningEvent.location['@id'] == theaterId;
  });
  let screeningEventsOfTheater = [];
  result.forEach(event => {
    let showTime = {
      dateTime: "",
      movieName : "",
      moviePosters : [],
      movieLink: ""
    };
    showTime.dateTime = event.startDate;
    showTime.movieLink = event.workPerformed['@id'];
    let moviesList = allMovies.filter((movie) => {
      return movie['@id'] == showTime.movieLink;
    });
    if(moviesList && moviesList.length == 1 ) {
      let movieDetails = moviesList[0];
      showTime.movieName = movieDetails.name[0]['@value'];
      showTime.moviePosters = movieDetails.image;
      screeningEventsOfTheater.push(showTime);
    } else {
      // console.log("Count for Movie : "+showTime.movieLink+' is '+moviesList.length);
    }
  });
  // console.log('Showtimes for '+theaterId+' : '+screeningEventsOfTheater.length);
  return screeningEventsOfTheater;
}

async function getAllMovies() {
  return new Promise((resolve, reject) => {
    fetchUrl("https://jsonplaceholder.typicode.com/posts", function(error, meta, body){
      if(error) {
        reject(error);
      } else {
        // let moviesList = body.toString();
        let moviesList = moviesJSON.dataFeedElement;
        console.log('Movies Count :: '+moviesList.length);
        resolve(moviesList);
      }
    });  
  }).catch((e) => {
    console.log('Caugth exception :: '+e);
    Promise.reject(e);
  });
}

async function getAllMovieTheaters() {
  return new Promise((resolve, reject) => {
    fetchUrl("https://jsonplaceholder.typicode.com/posts", function(error, meta, body){
      if(error) {
        reject(error);
      } else {
        // let movieTheatersList = body.toString();
        let movieTheatersList = movieTheaterJSON.dataFeedElement;
        console.log('Movie Theaters Count :: '+movieTheatersList.length);
        resolve(movieTheatersList);
      }
    });  
  }).catch((e) => {
    console.log('Caugth exception :: '+e);
    Promise.reject(e);
  });
}

async function getAllScreeningEvents() {
  return new Promise((resolve, reject) => {
    fetchUrl("https://jsonplaceholder.typicode.com/posts", function(error, meta, body){
      if(error) {
        reject(error);
      } else {
        // let screeningEventsList = body.toString();
        let screeningEventsList = screeningEventJSON;
        console.log('Screening Events Count :: '+screeningEventsList.length);
        resolve(screeningEventsList);
      }
    });  
  }).catch((e) => {
    console.log('Caugth exception :: '+e);
    Promise.reject(e);
  });
}

async function getShowTimes(pincode, movieId, callback) {
  let movieLink = 'https://www.fandango.com/movies/' + movieId;
  let aggregateQuery = [
    { 
      $match: { postalCode : pincode }
    },
    { $unwind : "$showtimes" },
    {
      $match: { 'showtimes.movieLink' : movieLink }
    },
    {
      $project: {
        _id:1, 
        name:1, 
        telephone:1, 
        addressCountry:1, 
        addressLocality:1, 
        addressRegion: 1, 
        postalCode:1, 
        streetAddress:1, 
        theaterId:1,
        movieName: '$showtimes.movieName',
        movieTime: '$showtimes.dateTime',
        movieLink: '$showtimes.movieLink',
        moviePosters: '$showtimes.moviePosters'
      }
    }
  ];
  let showTimesList = await TheaterDataModel.aggregate(aggregateQuery);
  callback(null, showTimesList);
}

