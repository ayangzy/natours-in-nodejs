const connectDb = require('./utils/mongoConnection');

const app = require('./app');

(async () => {
  await connectDb();

  const address = app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${address.address().port}..`);
  });
})();
