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
    linkId : {
        type: String,
        required : true
    },
    addressCountry : {
        type: String
    },
    addressLocality : {
        type: String
    },
    addressRegion : {
        type: String
    },
    postalCode : {
        type: String
    },
    streetAddress : {
        type: String
    }
});

module.exports = mongoose.model('Theater', theaterSchema);