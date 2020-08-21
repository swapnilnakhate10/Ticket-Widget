let express = require('express');
var fetchUrl = require("fetch").fetchUrl;
let CronJob = require('cron').CronJob;
let alasql = require('alasql');
const nodemailer = require("nodemailer");
let config = require('./../config/config.json');
let moviesJSON = require('./../config/Movie.json');
let movieTheaterJSON = require('./../config/MovieTheater.json');
let screeningEventJSON = require('./../config/ScreeningEvent.json');
let MovieModel = require('../models/movie.model');
let TheaterModel = require('../models/theater.model');
let EventsModel = require('../models/events.model');
let TheaterDataModel = require('../models/theaterData.model');

let first_job = new CronJob(config.first_cron_job, syncFandangoData);
let second_job = new CronJob(config.second_cron_job, syncFandangoData);

first_job.start();
second_job.start();

module.exports = {
    banner_list : banner_list,
    getAllMovies: getAllMovies,
    syncFandangoData : syncFandangoData
};

async function banner_list(callback) {
  let response = await getAllMovies();
  callback(null, response);
};

async function initNodeMailer(cronJobMesasge) {
  let transporter = nodemailer.createTransport({
    host: config.mailer.host,
    port: config.mailer.port,
    secure: config.mailer.secureSSL,
    auth: {
      user: config.mailer.username,
      pass: config.mailer.password
    }
  });

  transporter.verify(function(error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
      let options = {
        from: "fandangoCronJob@yopmail.com",
        to: config.notificationMailId,
        subject: "Fandango Cron Job",
        text: cronJobMesasge
      };
      transporter.sendMail(options, (err, info) => {
        if(err) {
          console.error('Error sending mail : '+err);      
        } else {
          console.log('Mail sent succesfully');
          console.log(info.envelope);
          console.log(info.messageId);
        }
      });    
    }
  });
}

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
    initNodeMailer("CronJob executed successfully.");
  }).catch(function(error) { 
    console.log("Error Saving Theater data");
    initNodeMailer("Error for CronJob execution.");
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

async function saveEvents() {
  let movie = new MovieModel({
    name: "Bob goes sledding",
    date: new Date()
  });
  movie.save(function (err) {
    if (err) return handleError(err);
  });
}

