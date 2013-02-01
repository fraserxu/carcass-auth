var carcass = require('carcass');

require('../..');

// Register models.
carcass.register(__dirname, 'models');

// Register applications.
carcass.register(__dirname, 'applications');
