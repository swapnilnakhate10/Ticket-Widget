let express = require('express');
var fetchUrl = require("fetch").fetchUrl;
let CronJob = require('cron').CronJob;
let alasql = require('alasql');
let moviesJSON = require('./../config/Movie.json');
let movieTheaterJSON = require('./../config/MovieTheater.json');
let screeningEventJSON = require('./../config/ScreeningEvent.json');
let MovieModel = require('../models/movie.model');
let TheaterModel = require('../models/theater.model');
let EventsModel = require('../models/events.model');
let TheaterDataModel = require('../models/theaterData.model');

let job = new CronJob('* * 3 * *', syncFandangoData);
job.start();

module.exports = {
    banner_list : banner_list,
    getAllMovies: getAllMovies,
    syncFandangoData : syncFandangoData
};

async function banner_list(callback) {
  let response = await getAllMovies();
  callback(null, response);
};

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

