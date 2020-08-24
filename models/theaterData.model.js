const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const theaterSchema = new Schema({
    name : {
        type: String,
        required : true
    },
    telephone : {
        type: String
    },
    theaterId : {
        type: String,
        required : true
    },
    addressCountry : {
        type: String,
        required : true
    },
    addressLocality : {
        type: String
    },
    addressRegion : {
        type: String,
        required : true
    },
    postalCode : {
        type: String,
        required : true
    },
    streetAddress : {
        type: String
    },
    uuid : {
        type: String,
        required : true
    },
    showtimes : {
        type: Array
    }
});

module.exports = mongoose.model('TheaterData', theaterSchema);