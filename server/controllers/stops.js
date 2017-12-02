const env = require('../env');

const getStops = (req, res) => {
  db.getStops()
  .then((result) => {
    res.send(result);
  })
  .catch((error) => {
    console.log(error);
    res.sendStatus(404);
  });
};

const getStop = (req, res) => {
  res.send(200);
};

module.exports = {
  getStops,
  getStop
};