const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const theaterSchema = new Schema({
    name : {
        type: String,
        required : true
    },
    type : {
        type: String,
    },
    linkId : {
        type: String,
        required : true
    },
    images : {
        type: Array
    },
    genre : {
        type: Array
    }
});

module.exports = mongoose.model('Movie', theaterSchema);