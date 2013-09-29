var express  = require('express');
var http     = require('http');
var _express = express();
this.express = _express;
this.server  = http.createServer(this.express);

_.defaults(this, _express);



// Mount all the rest api routes
this.addInitializer(opts => {
    debug('Initialize REST api');
    this.post('/:model', this.createModel);
    this.get('/:model/:id', this.readModel);
    this.put('/:model/:id', this.updateModel);
    this.patch('/:model/:id', this.updateModel);
    this.del('/:model/:id', this.deleteModel);
    this.get('/:collection', this.readCollection);
});

Graft.Server.on('listen', Server => {
    debug('Mounting REST routes');
    Server.use('/api', this);
});

// Implementations for each of the methods
_.extend(this, {
    readModel: (req, res, next) => {
        var hasModelAndId = req.params.model && req.params.id;
        var modelExists = !!Graft.$models[req.params.model];

        if (!hasModelAndId || !modelExists) { return next(404); }

        var model = new Graft.$models[req.params.model]({
            id: req.params.id
        });
        
        model.fetch()
            .done((attrs) => res.send(model.toJSON()))
            .fail((model, resp) => res.send(resp));
    },
    updateModel: (req, res, next) => {
        var send          = _.bind(res.send, res);
        var hasModelAndId = req.params.model && req.params.id;
        var modelExists   = !!Graft.$models[req.params.model];
        var options       = req.body;

        if (!hasModelAndId || !modelExists) { return next(404); }

        var model = new Graft.$models[req.params.model]({
            id: req.params.id
        });

        model.fetch().then(saveModel, send);

        ///////////// helpers
        function saveModel() {
            model.save(options)
                .done(() => res.send(201, model.toJSON()))
                .fail(send);
        }

    },
    createModel: (req, res, next) => {
        var hasBody     = req.body;
        var hasModel    = req.params.model;
        var modelExists = !!Graft.$models[req.params.model];

        if (!hasBody || !hasModel || !modelExists) {
            return next(403, 'Forbidden');
        }

        var send  = _.bind(res.send, res);
        var model = new Graft.$models[req.params.model](req.body);
        if (model.id !== undefined) {
            delete model.id;
        }

        model.fetch().then(createModel, createModel);

        ///////////// helpers
        function created(attrs) {
            res.set('Location', Graft.Data.request('url', model));
            res.send(303, model.toJSON());
        }
        function createModel(attrs) {
            debug('creating model', req.params.model);
            model.save(req.body).then(created, send);
        }
    },
    deleteModel: (req, res, next) => {
        var send             = _.bind(res.send, res);
        var hasModelAndId = req.params.model && req.params.id;
        var modelExists   = !!Graft.$models[req.params.model];

        if (!hasModelAndId || !modelExists) { return next(405); }

        var model = new Graft.$models[req.params.model]({
            id: req.params.id
        });

        model.fetch().then(deleteModel, send);

        ///////////// helpers
        function deleteModel(attrs) {
            debug('deleting model', req.params.model, req.params.id);
            model.destroy().then(() => send(204), send);
        }
    },
    readCollection: (req, res, next)  => {
        var send             = _.bind(res.send, res);
        var cName            = _.pluralize(req.params.collection);
        var collectionExists = !!Graft.$models[cName];

        if (!collectionExists) {
            return res.send(403, 'Collection does not exist');
        }

        var collection   = new Graft.$models[cName]();
        var isCollection = collection instanceof Backbone.Collection;

        if (!isCollection) {
            return res.send(403, 'Not a collection');
        }

        collection.fetch().then(readCollection, send);

        ///////////// helpers
        // TODO: pass through options?
        function readCollection(attrs) {
            debug('read collection', cName);
            res.send(collection.toJSON());
        }
    }
});
