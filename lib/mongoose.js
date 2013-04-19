var mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL);

mongoose.connection.on('error', function ( err ) { 
  console.log("ERROR: Mongoose MongoDB connection failed!");
  console.log("       ", err);
});

module.exports = mongoose;
