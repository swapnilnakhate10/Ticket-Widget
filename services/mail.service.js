const nodemailer = require("nodemailer");
const config = require('config');
let log4js = require("log4js");

const logger = log4js.getLogger("Mail Service");
logger.debug("Mail Service Initiated");

module.exports = {
    sendMail : sendMail
};

async function sendMail(cronJobMesasge) {
  logger.debug("Inside sendMail");
  let transporter = nodemailer.createTransport({
    host: config.get('mailer.host'),
    port: config.get('mailer.port'),
    secure: config.get('mailer.secureSSL'),
    auth: {
      user: config.get('mailer.username'),
      pass: config.get('mailer.password')
    }
  });

  transporter.verify(function(error, success) {
    if (error) {
      logger.error("Unable to verify Mailing Server : ");
      logger.error(error);
    } else {
      logger.debug("Server is ready to take our messages");
      let options = {
        from: "fandangoCronJob@yopmail.com",
        to: config.get('notificationMailId'),
        subject: "Fandango Cron Job",
        text: cronJobMesasge
      };
      transporter.sendMail(options, (err, info) => {
        if(err) {
          logger.error('Error sending mail : '+err);
        } else {
          logger.debug('Mail sent succesfully');
        }
      });    
    }
  });
}
  