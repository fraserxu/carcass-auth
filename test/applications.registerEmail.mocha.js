var carcass = require('carcass');
var request = require('request');
var should = require('should');

require('./fixture');

var server = new carcass.servers.Http();
var model = carcass.models.user;

// Requires a local redis server.
var express = require('express');
var RedisStore = require('connect-redis')(express);

// Test URLs.
var url_root = 'http://127.0.0.1:3000';
var url_register = url_root + '/register';
var url_register_confirm = url_register + '/confirm';

var token;

describe('Register with Email', function() {
    before(function(done) {
        server.mount('cors');
        server.mount('restify');
        server.mount('registerEmail', '/register', {
            callback: model.registerEmail
        });
        server.start(done);
    });

    after(function(done) {
        server.close(done);
    });

    describe('Post a good email', function() {
        it('should return 200', function(done) {
            request.post({
                uri: url_register,
                json: true,
                body: {
                    email: 'makara@wiredcraft.com'
                }
            }, function(err, res, body) {
                should.not.exist(err);
                res.should.be.a('object');
                res.should.have.property('statusCode', 200);
                body.should.equal(true);
                should.exist(model._token);
                token = model._token;
                done();
            });
        });
    });

    describe('Post without body', function() {
        it('should return 400', function(done) {
            request.post({
                uri: url_register,
                json: true
            }, function(err, res, body) {
                should.not.exist(err);
                res.should.be.a('object');
                res.should.have.property('statusCode', 400);
                done();
            });
        });
    });

    describe('Post a bad body', function() {
        it('should return 400', function(done) {
            request.post({
                uri: url_register,
                json: true,
                body: 'a string'
            }, function(err, res, body) {
                should.not.exist(err);
                res.should.be.a('object');
                res.should.have.property('statusCode', 400);
                done();
            });
        });
    });

    describe('Post a bad email', function() {
        it('should return 400', function(done) {
            request.post({
                uri: url_register,
                json: true,
                body: {
                    email: 'lorem'
                }
            }, function(err, res, body) {
                should.not.exist(err);
                res.should.be.a('object');
                res.should.have.property('statusCode', 400);
                done();
            });
        });
    });

    describe('Post a same email twice', function() {
        it('should return 409', function(done) {
            request.post({
                uri: url_register,
                json: true,
                body: {
                    email: 'makara@wiredcraft.com'
                }
            }, function(err, res, body) {
                should.not.exist(err);
                res.should.be.a('object');
                res.should.have.property('statusCode', 409);
                done();
            });
        });
    });

    describe('Confirm with a good token', function() {
        it('should return ..', function(done) {
            request.post({
                uri: url_register_confirm,
                json: true,
                body: {
                    email: 'makara@wiredcraft.com',
                    token: token
                }
            }, function(err, res, body) {
                should.not.exist(err);
                res.should.be.a('object');
                res.should.have.property('statusCode', 200);
                done();
            });
        });
    });
});
