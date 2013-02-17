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
        storageReg.get(options.email, function(err, data) {
            // TODO: storage false; should be easier to figure out "not found".
            if (err) return callback();
            if (data) {
                var _err = new Error('conflict');
                _err.status = 409;
                return callback(_err);
            }
        });
        break;
    case 'request succeed':
        storageReg.put({
            id: options.email,
            secret: options.secret
        }, callback);
        // ..
        builder._token = options.token;
        break;
    case 'confirm validate':
        storageReg.get(options.email, function(err, data) {
            if (err) return callback(err);
            if (data && data.secret) {
                return callback(null, data.secret);
            }
            callback(new Error());
        });
        break;
    default:
        callback(new Error());
        break;
    }
};

module.exports = builder;
