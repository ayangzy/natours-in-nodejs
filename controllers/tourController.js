const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price, -ratingsAverage';
  req.query.fields = 'price, name, ratingsAverage, summary, difficulty';

  next();
};

exports.getAllTours = async (req, res) => {
  try {
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const tours = await features.query;

    res.status(200).send({
      status: 'success',
      result: tours.length,
      data: {
        tours,
      },
    });
  } catch (error) {
    res.status(400).send({
      status: 'failed',
      message: error,
    });
  }
};

exports.createNewTour = async (req, res) => {
  
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).send({
      status: 'success',
      message: 'Created Successfully',
      data: {
        tours: newTour,
      },
    });
  } catch (error) {
    res.status(400).send({
      status: 'Failed',
      message: error,
    });
  }
};

exports.checkBody = (req, res, next) => {
  if (!req.body.price || !req.body.name) {
    return res.status(400).send({
      status: 'failed',
      message: 'missing name or price',
    });
  }
  next();
};

exports.getTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    const tour = await Tour.findById(tourId);

    res.status(200).send({
      status: 'success',
      message: 'Data successfully retrieved',
      data: {
        tour: tour,
      },
    });
  } catch (error) {
    res.status(404).send({
      status: 'fail',
      message: error,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    const tour = await Tour.findByIdAndUpdate(tourId, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).send({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (error) {
    res.status(404).send({
      status: 'fail',
      message: error,
    });
  }
};



exports.deleteTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    const tour = await Tour.findByIdAndDelete(tourId);
    res.status(200).send({
      status: 'success',
      message: 'successfully removed',
      data: {
        tour: tour,
      },
    });
  } catch (error) {
    res.status(400).send({
      status: 'fail',
      message: error,
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);
    res.status(200).send({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (error) {
    res.status(400).send({
      status: 'fail',
      message: error,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },

      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStat: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: { _id: 0 },
      },
    ]);

    res.status(200).send({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (error) {
    res.status(400).send({
      status: 'fail',
      message: error,
    });
  }
};
