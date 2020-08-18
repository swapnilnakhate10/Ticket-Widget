let http = require("http");
let express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors')
let app = express();
const router = express.Router();
const port = 8080;
let indexRouter = require('./routes/index');
let log4js = require("log4js");
const logger = log4js.getLogger("Server");
logger.level = "debug";

app.use(compression({filter: shouldCompress}))

function shouldCompress (req, res) {
  if (req.headers['x-no-compression']) {
    return false
  }
  return compression.filter(req, res)
}

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cors());

app.use('/', indexRouter);

mongoose.connect('mongodb://localhost:27017/fandango', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
//Get the default connection
let dbConnect = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
dbConnect.on('error', console.error.bind(console, 'MongoDB connection error:'));

http.createServer(app).listen(port, function (err) {
  logger.debug("Server File Initiated");
  console.log('listening on http://localhost:' + port);
});
  

