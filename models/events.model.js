const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
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
    startDate : {
        type: String,
        required : true
    },
    genre : {
        type: Array
    },
    locationDetails : {
        type: mongoose.Types.ObjectId,
        required : true
    },
    eventDetails : {
        type: mongoose.Types.ObjectId,
        required : true
    }
});

module.exports = mongoose.model('Event', eventSchema);