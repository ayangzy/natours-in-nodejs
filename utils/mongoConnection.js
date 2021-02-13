const { connect } = require('mongoose');

const connectDb = async (db = process.env.DATABASE_LOCAL) => {
  try {
    await connect(db, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    // eslint-disable-next-line no-console
    console.log('Db connection successful!');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
};

module.exports = connectDb;
