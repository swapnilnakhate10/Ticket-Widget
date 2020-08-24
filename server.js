let http = require("http");
let express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors')
let app = express();
const router = express.Router();
let indexRouter = require('./routes/index');
let log4js = require("log4js");
const config = require('config');
const logger = log4js.getLogger("Server");
let fileName = "logs/"+ new Date().toDateString() +"_fandango_logs.log";
log4js.configure({
  appenders: { fandango: { type: config.get('logger.type'), filename: fileName } },
  categories: { default: { appenders: ["fandango"], level: config.get('logger.level') } }
});
let port = config.get('serverPort');

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

app.use((req, res, next) => { 
  res.setHeader("Access-Control-Allow-Origin","*"); 
  res.setHeader("Access-Control-Allow-Methods", "PUT,GET,POST,PATCH"); 
  res.setHeader('Access-Control-Allow-Headers','X-Requested-With,content-type,Origin,Accept,Authorization'); 
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); 
  res.setHeader("Pragma", "no-cache"); 
  res.setHeader("Expires", "0"); 
  next();
});

app.use('/', indexRouter);

let connectionString = 'mongodb://localhost:'+config.get('mongoDb.port')+'/'+ config.get('mongoDb.dbname');

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
//Get the default connection
let dbConnect = mongoose.connection;

dbConnect.on('connected', () => {
  logger.debug("Database Connected.");
});
//Bind connection to error event (to get notification of connection errors)
dbConnect.on('error', (error) => {
  logger.error("Error Database connection");
  logger.error(error);
});

http.createServer(app).listen(port, function (err) {
  logger.debug("Server File Initiated");
  console.log('listening on http://localhost:' + port);
});
  

process.on('unhandledRejection', (reason, p) => {
    logger.error('Unhandled Rejection at Reason : ');
    logger.error(reason);
    logger.error('Unhandled Rejection for Promise : ');
    logger.error(p);
  }).on('uncaughtException', (err) => {
    logger.error('Uncaught Exception thrown : ');
    logger.error(err);
    process.exit(1);
});
