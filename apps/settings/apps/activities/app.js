var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var db = require( __js + '/database' ),
	Activities = db.Activities,
	Members = db.Members;

var auth = require( __js + '/authentication' );

var messages = require( __src + '/messages.json' );

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.parent.mountpath + app.mountpath
	} );
	res.locals.activeApp = 'settings';
	next();
} );

app.get( '/', auth.isSuperAdmin, function( req, res ) {
	Activities.find( function( err, activities ) {
		res.render( 'index', { activities: activities } );
	} );
} );

app.get( '/create', auth.isSuperAdmin, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: 'Create'
	} );
	res.render( 'create' );
} );

app.post( '/create', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.flash( 'danger', messages['activity-name-required'] );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.flash( 'danger', messages['activity-slug-required'] );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var activity = {
		name: req.body.name,
		event_name: req.body.event,
		slug: req.body.slug,
		admin_only: req.body.admin_only
	};

	new Activities( activity ).save( function( err, activity ) {
		req.flash( 'success', messages['activity-created'] );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

app.get( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {
	Activities.findOne( { slug: req.params.slug }, function( err, activity ) {
		if ( ! activity ) {
			req.flash( 'warning', messages['activity-404'] );
			res.redirect( app.parent.mountpath + app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: activity.name
		} );
		res.render( 'edit', { activity: activity } );
	} );
} );

app.post( '/:slug/edit', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.flash( 'danger', messages['activity-name-required'] );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	if ( ! req.body.slug || req.body.slug.trim() === '' ) {
		req.flash( 'danger', messages['activity-slug-required'] );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var activity = {
		name: req.body.name,
		event_name: req.body.event,
		slug: req.body.slug,
		admin_only: req.body.admin_only
	};

	Activities.update( { slug: req.params.slug }, activity, function( status ) {
		req.flash( 'success', messages['activity-update'] );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
