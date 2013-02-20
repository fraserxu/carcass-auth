var debug = require('debug')('carcass-auth:Model:User');

var carcass = require('carcass');

// Memory storage.
var storage = carcass.storages.memory({
    id: 'carcass-auth-user'
});

var builder = carcass.factories.Model({
    attributes: {
        id: {},
        email: {},
        password: {}
    },
    storage: storage
});

builder.use(carcass.plugins.modelSync);

// Another memory storage, ...
var storageReg = carcass.storages.memory({
    id: 'carcass-auth-user-register'
});

builder.registerEmail = function(options, callback) {
    debug('options', options);

    switch (options.operation) {
    case 'request validate':
        // Nothing in this example.
        // ...
        return callback();
    case 'request succeed':
        // Send token.
        builder._token = options.token;
        return callback();
    case 'confirm validate':
        return callback();
    default:
        callback(new Error());
        break;
    }
};

module.exports = builder;
