var utils       = require('./utils');
var should      = require('should');
var path        = require('path');
var request     = require('request');
var async       = require('async');
var _           = require('underscore');
var Graft       = require('../server');
var fixturePath = __dirname + '/fixture';
var testPort    = 8900;


Graft.commands.setHandler('REST:setupTest', function(done) {
    // A simple test data adaptor to debug the REST api.
    Graft.directory(path.dirname(require.resolve('graft-mockdb')));
    var Mock = require('graft-mockdb/data/mock');

    Graft.load(fixturePath);

    Graft.on('reset:data', function() {
        Mock.testData.Account = require('./fixture/resources/account.json');
        Mock.testData.Group = require('./fixture/resources/group.json');
    }, Mock);

    Mock.on('before:start', function() {
        Graft.trigger('reset:data');
    });

    if (Graft.Server.Client) {
        Graft.Server.Client.startWithParent = false;
    }

    Graft.start({ port: testPort });
    done();
});

describe('REST ROUTES', function() {
    before(function(done) {
        // Load up the REST api server. (optional)
        require('../io/rest');
        Graft.execute('REST:setupTest', done);
    });

    describe('GET /api/Account/1', function() {
        before(utils.requestUrl(testPort, '/api/Account/1'));

        it ('should return status 200', function() {
            this.resp.should.have.status(200);
        });

        it('response should be json', function() {
            this.resp.should.be.json;
        });

        it ('should have a body', function() {
            should.exist(this.body);
        });

        it('should have the correct id', function() {
            this.body.should.have.property('id', '1');
        });

        it ('should respect the default values', function() {
            this.body.should.have.property('status', 'offline');
        });
    });

    describe('GET /api/Group', function() {
        before(utils.requestUrl(testPort, '/api/Group'));

        it ('should return status 200', function() {
            this.resp.should.have.status(200);
        });

        it('response should be json', function() {
            this.resp.should.be.json;
        });

        it ('should have a body', function() {
            should.exist(this.body);
        });


        it ('should have 2 models', function() {
            this.body.should.have.length(2);
        });

        it ('should respect the default values', function() {
            this.body[1].should.have.property('policy', 'deny');
        });
    });

    describe('PUT /api/Account/2', function() {
        var data = {
            "name": "Emily Mortimer", // was "Emily Baker"
            "favColor": "magenta" // new field
        };
        before(utils.requestUrl(testPort, '/api/Account/2', 'PUT', data));

        it ('should return status 201', function() {
            this.resp.should.have.status(201);
        });

        it('response should be json', function() {
            this.resp.should.be.json;
        });

        it ('should have a body', function() {
            should.exist(this.body);
        });

        it ('should return the changed object', function() {
            this.body.should.have.property('name', 'Emily Mortimer');
        });

        it ('should not have changed fields not touched', function() {
            this.body.should.have.property('group', 'default');
        });

        it ('should have added a field', function() {
            this.body.should.have.property('favColor', 'magenta');
        });

    });
        describe('GET /api/Account/2', function() {
            before(utils.requestUrl(testPort, '/api/Account/2'));
            it ('should return status 200', function() {
                this.resp.should.have.status(200);
            });

            it('response should be json', function() {
                this.resp.should.be.json;
            });

            it ('should have a body', function() {
                should.exist(this.body);
            });

            it ('should not have changed fields not touched', function() {
                this.body.should.have.property('group', 'default');
            });

            it ('should have added a field', function() {
                this.body.should.have.property('favColor', 'magenta');
            });

            it ('should return the changed object', function() {
                this.body.should.have.property('name', 'Emily Mortimer');
            });
        });
        describe('GET /api/Account', function() {
            before(utils.requestUrl(testPort, '/api/Account'));
            it ('should return status 200', function() {
                this.resp.should.have.status(200);
            });

            it('response should be json', function() {
                this.resp.should.be.json;
            });

            it ('should have a body', function() {
                should.exist(this.body);
            });
            
            it ('should not have changed fields not touched', function() {
                this.body[2].should.have.property('group', 'default');
            });

            it ('should have added a field', function() {
                this.body[2].should.have.property('favColor', 'magenta');
            });


            it ('should return the changed object in listing', function() {
                this.body[2].should.have.property('name', 'Emily Mortimer');
            });
        });

    describe('POST /api/Account', function() {

        var data = {
            "name": "Ronald McDonald", // was "Emily Baker"
            "favColor": "yello" // new field
        };
        before(utils.requestUrl(testPort, '/api/Account', 'POST', data));

        it ('should have a location', function() {
            this.resp.should.have.header('Location');
        });

        it ('should return a new id', function() {
            this.body.should.have.property('id');
        });

        it ('should return status 303', function() {
            this.resp.should.have.status(303);
        });

        it('response should be json', function() {
            this.resp.should.be.json;
        });

        it ('should have a body', function() {
            should.exist(this.body);
        });

        it ('should have defaulted the fields correctly', function() {
            this.body.should.have.property('group', 'default');
        });

        it ('should have added a field', function() {
            this.body.should.have.property('favColor', 'yello');
        });


    });

    // This next section is dependent on the server having gives
    // us a new location with the previous request.
    describe("Follow Location Header", function() {
        var testUrl = 'http://localhost:8900';

        var beforeFn = function(done) {
            var self = this;
            var opts = {
                json: {
                    "name": "Hamburgler, The",
                    "favColor": "Bun"
                },
                method: 'POST'
            };
            async.waterfall([
                function(next) {
                    request(testUrl + '/api/Account', opts, function(err, resp, body) {
                        next(null, resp.body.id, resp.headers.location);
                    });
                },
                function (id, locat, next) {
                    self.newId = id;
                    self.newLocation = locat;
                    request(testUrl + locat, {json: true}, function(err, resp, body) {
                        self.resp = resp;
                        self.body = body;
                        next(err);
                    });
                }], done);
        };

        before(beforeFn);

        it ('should return status 200', function() {
            this.resp.should.have.status(200);
        });

        it('response should be json', function() {
            this.resp.should.be.json;
        });

        it ('should have a body', function() {
            should.exist(this.body);
        });

        it('should have the correct id', function() {
            this.body.should.have.property('id', this.newId);
        });

        it ('should respect the default values', function() {
            this.body.should.have.property('status', 'offline');
        });
    });

    describe('DELETE /api/Account/1', function() {

        before(function() {
            Graft.trigger('reset:data');
        });
        before(utils.requestUrl(testPort, '/api/Account/1', 'DELETE'));

        it ('should return status 204', function() {
            this.resp.should.have.status(204);
        });

        describe('GET /api/Account/1', function() {
            before(utils.requestUrl(testPort, '/api/Account/1'));
            it ('should return status 404', function() {
                this.resp.should.have.status(404);
            });
        });
        describe('GET /api/Account', function() {
            before(utils.requestUrl(testPort, '/api/Account'));
            it ('should return status 200', function() {
                this.resp.should.have.status(200);
            });

            it('response should be json', function() {
                this.resp.should.be.json;
            });

            it ('should have a body', function() {
                should.exist(this.body);
            });
            
            it ('should only be 6 in length', function() {
                this.body.should.have.length(6);
            });

            it ('should not have a record with id 1', function() {
                var record = _(this.body).findWhere({id: '1'});
                if (record) {
                    should.fail(record, undefined, 'Should have been deleted');
                }
            });
        });
    });

    describe('stop server', utils.stopServer);
});
