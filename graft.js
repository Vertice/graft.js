var $        = require('jquery');
var _        = require('./lib/mixins.js');

// Set the DOM lib for Backbone.
var Backbone = require('backbone');
Backbone.$   = $;

// Needs to happen before marionette is included.
var Marionette = require('backbone.marionette');
Marionette.$   = $;

// augment helper to backbone objects.
require('./lib/augment.js');

// Main application initialization
// this is global on purpose. sucks i know.
var Graft = new Marionette.Application();

// These are mapped in such a way so that modules
// are able to integrate with other dependencies.
Graft.BaseModel = Backbone.Model;
Graft.BaseCollection = Backbone.Collection;

_.extend(Graft, {
    '$models'     : {},
    '$views'      : {},
    '$routers'    : {},
    '$middleware' : {}
});
 
Graft.addInitializer(function(options) {
    this.$state = {};
});

module.exports = Graft;
