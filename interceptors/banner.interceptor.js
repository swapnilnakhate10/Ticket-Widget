
module.exports = {
    validateGetShowTimes : validateGetShowTimes
};

function validateGetShowTimes(req, res, next) {
    let zipcode = req.body.zipcode;
    if(zipcode && zipcode !== '') {
        next();
    } else {
        res.send({"message" : "Required field/s missing."});
    }
}