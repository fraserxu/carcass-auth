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

    // Temp session handler.
    // ...
    function tempSession(args) {
        var def = carcass.deferred();
        // Requires a real storage.
        if (!options.store) throw new Error('A session store is required.');
        // Requires a secret.
        if (!options.secret) throw new Error('A secret is required.');
        // Requires an email.
        if (!args.email) throw new Error('An email is required.');
        // Uses a temporary request.
        var tempReq = {};
        // Uses a temporary option, in order to get the session generate
        // function.
        var tempOpt = {
            store: options.store
        };
        // The session middleware will add the session generate function to the
        // store instance.
        express.session(tempOpt);
        // .
        tempReq.sessionStore = tempOpt.store;
        // .
        if (args.token) {
            var sessionID = signature.unsign(args.token, options.secret);
            debug('session id', sessionID);
            tempReq.sessionStore.get(sessionID, function(err, sess) {
                if (err) throw err;
                debug('sess', sess);
                // TODO: remove temp session.
                // callback(err, sess);
                def.resolve(sess);
            });
        } else {
            // .
            tempReq.sessionStore.generate(tempReq);
            // .
            tempReq.session.email = args.email;
            // .
            tempReq.session.resetMaxAge();
            tempReq.session.save(function() {
                // Generate a token with the session id.
                debug('session id', tempReq.sessionID);
                def.resolve(signature.sign(tempReq.sessionID, options.secret));
            });
        }
        return def.promise;
    };

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

        // .
        carcass.promise(function() {
            var def = carcass.deferred();
            // It's the callback's responsibility to check things like:
            // * The email is not registered.
            // * The email has not sent another request before.
            callback({
                operation: 'request validate',
                email: req.body.email
            }, function(err) {
                // Not validated.
                if (err) throw err;
                // Validated.
                def.resolve({
                    email: req.body.email
                });
            });
            return def.promise;
        })
        // Generate token.
        .then(tempSession)
        // .
        .end(function(token) {
            // Succeeded.
            // This callback cannot block the process.
            // It's the callback's responsibility to do things like:
            // * Send the token?
            callback({
                operation: 'request succeed',
                email: req.body.email,
                token: token
            }, noop);
            res.json(true);
        }, function(err) {
            next(err);
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

        // .
        carcass.promise(function() {
            var def = carcass.deferred();
            // It's the callback's responsibility to check things like:
            // * The email is not registered.
            // * The email has not sent another request before.
            callback({
                operation: 'confirm validate',
                email: req.body.email
            }, function(err) {
                // Not validated.
                if (err) throw err;
                // Validated.
                def.resolve({
                    email: req.body.email,
                    token: req.body.token
                });
            });
            return def.promise;
        })
        // Generate token.
        .then(tempSession)
        // .
        .end(function(sess) {
            // Succeeded.
            // This callback cannot block the process.
            // It's the callback's responsibility to do things like:
            // * Create the user.
            callback({
                operation: 'confirm succeed',
                email: req.body.email
            }, noop);
            res.json(true);
        }, function(err) {
            next(err);
        });
    };

    app.post('/', register);
    app.post('/confirm', confirm);
};
