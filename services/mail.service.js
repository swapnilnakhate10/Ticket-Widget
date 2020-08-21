const nodemailer = require("nodemailer");
let config = require('./../config/config.json');

module.exports = {
    sendMail : sendMail
};

async function sendMail(cronJobMesasge) {

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
        console.log("Unable to verify Mailing Server : ");
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
          }
        });    
      }
    });
  }
  