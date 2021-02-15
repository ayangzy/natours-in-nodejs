const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const tourRoutes = require('./routes/tourRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

dotenv.config({ path: './config.env' });

//set security http headers
app.use(helmet());

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//limit request from same API
const limiter = rateLimit({
  max: 50, //The max limit can be set anything
  windowMs: 60 * 60 * 1000,
  message: 'Too many attempts from this IP, please try again in an hour',
});

app.use('/api', limiter);

//Body parser, reading data from body into req.body
app.use(express.json());

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization  against xss
app.use(xss());

//Saving static files
app.use(express.static(`${__dirname}/public`));

//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', tourRoutes);
app.use('/api/v1/users', userRoutes);

module.exports = app;
