var debug = require('debug')('carcass-auth:test:Application:TestPassportLocal');

var carcass = require('carcass');

module.exports = carcass.factories.Express(function(app, options) {
    debug('initializing');

    options = options || {};
    var passport = options.passport || carcass.instances.passport;

    // All paths require a session.
    app.use(function(req, res, next) {
        // Just a demo.
        if (!req.session) {
            next(carcass.httpError(500, 'no session'));
        } else {
            next();
        }
    });

    // Only use authenticate at this path, the other paths are using session.
    // Three arguments:
    // - The strategies.
    // - Optionally the options.
    // - Optionally override the `done` callback that the verify function will
    // call.
    app.post('/login', passport.authenticate([
        'local'
    ]), function(req, res, next) {
        // User is authenticated.
        // We don't regenerate the session here, it contains the passport.
        if (req.user) {
            req.logIn(req.user, function(err) {
                if (err) {
                    return next(err);
                }
                // Just a demo.
                if (!req.session) {
                    return next(carcass.httpError(500, 'session not found'));
                }
                res.json(200, req.session);
            });
        } else {
            // Shouldn't happen, but a better message.
            next(carcass.httpError(500, 'user not found'));
        }
    });

    app.post('/logout', function(req, res, next) {
        // Logout from Passport.
        req.logout();
        // Logout from Connect.
        req.session.destroy(function(err) {
            if (err) {
                return next(err);
            }
            // Just a demo.
            if (req.session) {
                // 500 for internal server error
                return next(carcass.httpError(500, 'failed to logout'));
            }
            res.json(200, true);
        });
    });
});
