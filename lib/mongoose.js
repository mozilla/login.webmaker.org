var mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL);

mongoose.connection.on('error', function ( err ) { 
  console.log("ERROR: Mongoose MongoDB connection failed!");
  console.log("       ", err);
  
  // console.error.bind(console, 'connection error:') <<<<<<<<< No idea what this does.  Struggling to find docs for it, but I get the sense it could have valueable added functionality.  
});

module.exports = mongoose;
