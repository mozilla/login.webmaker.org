var mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL);

//TODO: Write some connection error handling code
// if connecting on the default mongoose connection
// mongoose.connection.on('error', handleError);

module.exports = mongoose;
