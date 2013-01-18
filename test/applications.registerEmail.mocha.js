var carcass = require('carcass');
var request = require('request');
var should = require('should');

require('./fixture');

var server = new carcass.servers.Http();

// Requires a local redis server.
var express = require('express');
var RedisStore = require('connect-redis')(express);

// Test URLs.
var url_root = 'http://127.0.0.1:3000';
var url_register = url_root + '/register';

describe('Register with Email', function() {
    before(function(done) {
        server.mount('cors');
        server.mount('restify');
        server.mount('registerEmail', '/register');
        server.start(done);
    });

    after(function(done) {
        server.close(done);
    });

    describe('Post a good email', function() {
        it('should return true', function(done) {
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
                done();
            });
        });
    });

    describe('Post without body', function() {
        it('should return true', function(done) {
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
        it('should return true', function(done) {
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
        it('should return true', function(done) {
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
});
