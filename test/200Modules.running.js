var utils    = require('./utils');
var should   = require('should');
var path     = require('path');
var _        = require('underscore');
var Backbone = require('backbone');

var testPort = 8901;

var TestBaseModel = Backbone.Model.extend({
    title: 'TestBaseModel'
});

// Initialize the Graft application object.
var Graft = require('../server');

describe('Modules: After Start', function() {
    before(function() {
        Graft.start({ port: testPort });
    });
    it('Should have mounted express routes', function() {
        Graft.Server.Test.express.routes.should.have.property('get');
    });
    it('Should have the correct initOrder for test server', function() {
        Graft.Server.Test.initOrder.should.eql(['alpha', 'beta']);
    });
    it('Should have set the test server to listening', function() {
        Graft.Server.Test.listening.should.eql(true);
    });

    describe('Have working routes', function() {
        before(utils.requestUrl(testPort, '/test/mufassa'));

        it ('should return status 200', function() {
            this.resp.should.have.status(200);
        });

        it ('should have a body', function() {
            should.exist(this.body);
        });

        it('should match the route param', function() {
            this.body.should.eql('Hello mufassa');
        });
    });

    describe('stop server', utils.stopServer);
});


