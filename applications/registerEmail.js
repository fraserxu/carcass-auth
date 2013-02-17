var debug = require('debug')('carcass-auth:Application:RegisterEmail');

var carcass = require('carcass');
var express = require('express');
var email = require('email');
var uid = require('uid');
var signature = require('cookie-signature');

var noop = function(err) {
    if (err) debug(err);
};

// Register with Email.
// ---

// Required options:
// * A callback

// Optional options:
// * A confirm method; default to ?

// Operations:
// * request validate
// * request succeed
// * confirm validate
// * confirm succeed

// Required other middlewares:
// * bodyParser

module.exports = carcass.factories.Express({
    title: 'RegisterEmail',
    initialize: initialize
});

function initialize(app, options) {
    debug('initializing');

    // TODO: if (!options || !options.callback) {}

    options = options || {};

    var callback = options.callback;

    // Step 1: the request.
    // Collect an email and send a confirm link (or method).
    function register(req, res, next) {
        // Require a valid email.
        if (!req.body || !req.body.email ||
            !email.isValidAddress(req.body.email)) {
            var err = new Error('invalid email');
            err.status = 400;
            return next(err);
        }

        // It's the callback's responsibility to check things like:
        // * The email is not registered.
        // * The email has not sent another request before.
        callback({
            operation: 'request validate',
            email: req.body.email
        }, function(err) {
            // Not validated.
            if (err) return next(err);

            options.email = req.body.email;
            options.secret = uid();

            // Validated.
            // Generate token.
            tempSession(options, function(err, token) {
                if (err) return next(err);

                // Succeeded.
                // This callback cannot block the process.
                // It's the callback's responsibility to do things like:
                // * Save the email and the secret pair.
                // * Send the token?
                callback({
                    operation: 'request succeed',
                    email: req.body.email,
                    secret: options.secret,
                    token: token
                }, noop);

                // Send an email.
                // TODO

                // .
                res.json(true);
            });
        });
    };

    // Step 2: confirm.
    // Validate the confirm request and ...
    function confirm(req, res, next) {
        // Require a valid email and a token.
        if (!req.body || !req.body.email || !req.body.token ||
            !email.isValidAddress(req.body.email)) {
            var err = new Error('invalid email');
            err.status = 400;
            return next(err);
        }

        debug('body', req.body);

        // It's the callback's responsibility to do things like:
        callback({
            operation: 'confirm validate',
            email: req.body.email
        }, function(err, secret) {
            // Not validated.
            if (err) return next(err);

            options.email = req.body.email;
            options.token = req.body.token;
            options.secret = secret;

            // Validated.
            // ? token.
            tempSession(options, function(err) {
                if (err) return next(err);

                // Succeeded.
                // This callback cannot block the process.
                // It's the callback's responsibility to do things like:
                callback({
                    operation: 'confirm succeed'
                }, noop);

                // .
                res.json(true);
            });
        });
    };

    app.post('/', register);
    app.post('/confirm', confirm);
};

// Opens a temporary session and returns a token.
// Requires an email and a secret.
// Should be saved in a special session storage.
// .
function tempSession(options, callback) {
    // Uses a temporary request.
    var tempReq = {};
    // Uses a temporary option, in order to get the session generate function.
    // Requires a real storage.
    var tempOpt = {
        store: options.store || new express.session.MemoryStore()
    };
    // The session middleware will add the session generate function to the
    // store instance.
    express.session(tempOpt);
    // .
    tempReq.sessionStore = tempOpt.store;
    // .
    if (options.token && options.secret) {
        var sessionID = signature.unsign(options.token, options.secret);
        debug('session id', sessionID);
        tempReq.sessionStore.get(sessionID, function(err, sess) {
            debug('sess', sess);
            // TODO: remove temp session.
            callback(err, sess);
        });
    } else {
        // .
        tempReq.sessionStore.generate(tempReq);
        // .
        tempReq.session.email = options.email;
        // .
        tempReq.session.resetMaxAge();
        tempReq.session.save(function() {
            // Generate a token with the session id.
            debug('session id', tempReq.sessionID);
            callback(null, signature.sign(tempReq.sessionID, options.secret));
        });
    }
};
