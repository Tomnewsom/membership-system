"use strict";

var	express = require( 'express' ),
	app = express(),
	Permissions = require( '../../src/js/database' ).Permissions,
	Members = require( '../../src/js/database' ).Members;

var auth = require( '../../src/js/authentication.js' );

var messages = require( '../../src/messages.json' );

var config = require( '../../config/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: 'Admin',
		url: '/admin'
	} );
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.mountpath
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

// Members
//////////

app.get( '/', auth.isAdmin, function( req, res ) {
	Members.find( function( err, members ) {
		res.render( 'members', { members: members } );
	} );
} );

// Member
/////////

app.get( '/:uuid', auth.isAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}
		res.locals.breadcrumb.push( {
			name: member.fullname
		} );
		res.render( 'member', { member: member, audience: config.audience, superadmin: ( config.superadmins.indexOf( member.email ) != -1 ? true : false ) } );
	} );
} );

// Update Member
////////////////

app.get( '/:uuid/update', auth.isAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', members['member-404'] );
			res.redirect( app.mountpath );
			return;
		}
		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/admin/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'Update',
		} );
		res.render( 'member-update', { member: member } );
	} );
} );

app.post( '/:uuid/update', auth.isAdmin, function( req, res ) {
	var member = {
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
		address: req.body.address
	};

	Members.update( { uuid: req.params.uuid }, member, function( status ) {
		req.flash( 'success', messages['profile-updated'] );
		res.redirect( app.mountpath + '/' + req.params.uuid );
	} );
} );

// Member Activation
////////////////////

app.get( '/:uuid/activation', auth.isAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}
		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/admin/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'Activation',
		} );
		res.render( 'member-activation', { member: member } );
	} );
} );

app.post( '/:uuid/activation', auth.isAdmin, function( req, res ) {
	var member = {
		activated: ( req.body.activated ? true : false )
	};

	if ( req.body.activated ) {
		member.activation_code = null;
	}

	Members.update( { uuid: req.params.uuid }, member, function( status ) {
		req.flash( 'success', messages['activation-updated'] );
		res.redirect( app.mountpath + '/' + req.params.uuid );
	} );
} );

// Member Tag
/////////////

app.get( '/:uuid/tag', auth.isAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/admin/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'Tag'
		} );
		res.render( 'member-tag', { member: member } );
	} );
} );

app.post( '/:uuid/tag', auth.isAdmin, function( req, res ) {
	var hashed_tag = auth.hashCard( req.body.tag );
	var profile = {
		'tag.id': req.body.tag,
		'tag.hashed': hashed_tag
	};

	if ( req.body.tag == '' )
		profile['tag.hashed'] = '';

	Members.update( { uuid: req.params.uuid }, { $set: profile }, { runValidators: true }, function( status ) {
		if ( status != null ) {
			var keys = Object.keys( status.errors );
			for ( var k in keys ) {
				var key = keys[k];
				req.flash( 'danger', status.errors[key].message );
			}
		} else {
			req.flash( 'success', messages['tag-updated'] );
		}
		res.redirect( app.mountpath + '/' + req.params.uuid );
	} );
} );

// Member Discourse
///////////////////

app.get( '/:uuid/discourse', auth.isAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/admin/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'Discourse'
		} );
		res.render( 'member-discourse', { member: member } );
	} );
} );

app.post( '/:uuid/discourse', auth.isAdmin, function( req, res ) {
	var member = {
		'discourse.id': req.body.id,
		'discourse.email': req.body.email,
		'discourse.activated': ( req.body.activated ? true : false )
	}

	Members.update( { uuid: req.params.uuid }, { $set: member }, function( status ) {
		req.flash( 'success', messages['discourse-updated'] );
		res.redirect( app.mountpath + '/' + req.params.uuid );
	} );
} );

// Member GoCardless
////////////////////

app.get( '/:uuid/gocardless', auth.isAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}

		res.locals.breadcrumb.push( {
			name: member.fullname,
			url: '/admin/members/' + member.uuid
		} );
		res.locals.breadcrumb.push( {
			name: 'GoCardless'
		} );
		res.render( 'member-gocardless', { member: member, minimum: config.gocardless.minimum } );
	} );
} );

app.post( '/:uuid/gocardless', auth.isAdmin, function( req, res ) {
	var member = {
		'gocardless.id': req.body.id,
		'gocardless.amount': req.body.amount,
		'gocardless.minimum': req.body.minimum
	}

	Members.update( { uuid: req.params.uuid }, { $set: member }, function( status ) {
		req.flash( 'success', messages['gocardless-updated'] );
		res.redirect( app.mountpath + '/' + req.params.uuid );
	} );
} );

// Member Permissions
/////////////////////

app.get( '/:uuid/permissions', auth.isAdmin, function( req, res ) {
	Permissions.find( function( err, permissions ) {
		Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
			if ( member == undefined ) {
				req.flash( 'warning', messages['member-404'] );
				res.redirect( app.mountpath );
				return;
			}

			res.locals.breadcrumb.push( {
				name: member.fullname,
				url: '/admin/members/' + member.uuid
			} );
			res.locals.breadcrumb.push( {
				name: 'Permissions'
			} );
			res.render( 'member-permissions', { permissions: permissions, member: member, now: new Date() } );
		} );
	} );
} );

// Grant Member Permission
//////////////////////////

app.post( '/:uuid/permissions', auth.isAdmin, function( req, res ) {
	Permissions.findOne( { slug: req.body.permission }, function( err, permission ) {
		if ( permission != undefined ) {
			var new_permission = {
				permission: permission.id
			}

			new_permission.date_added = new Date( req.body.start_date + 'T' + req.body.start_time );

			if ( req.body.expiry_date != '' && req.body.expiry_time != '' )
				new_permission.date_expires = new Date( req.body.expiry_date + 'T' + req.body.expiry_time );

			if ( new_permission.date_added >= new_permission.date_expires ) {
				req.flash( 'warning', messages['permission-expiry-error'] );
				res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
				return;
			}

			Members.update( { uuid: req.params.uuid }, {
				$push: {
					permissions: new_permission
				}
			}, function ( status ) {
			} );
		} else {
			req.flash( 'warning', messages['permission-404'] );
		}
		res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
	} );
} );

// Modify Member Permission
///////////////////////////

app.get( '/:uuid/permissions/:id/modify', auth.isAdmin, function( req, res ) {
	Permissions.find( function( err, permissions ) {
		Members.findOne( { uuid: req.params.uuid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
			if ( member == undefined ) {
				req.flash( 'warning', messages['member-404'] );
				res.redirect( app.mountpath );
				return;
			}
			
			if ( member.permissions.id( req.params.id ) == undefined ) {
				req.flash( 'warning', messages['permission-404'] );
				res.redirect( app.mountpath );
				return;
			}

			res.locals.breadcrumb.push( {
				name: member.fullname,
				url: '/admin/members/' + member.uuid
			} );
			res.locals.breadcrumb.push( {
				name: 'Permissions',
				url: '/admin/members/' + member.uuid + '/permissions'
			} );
			res.locals.breadcrumb.push( {
				name: member.permissions.id( req.params.id ).permission.name
			} );
			res.render( 'member-permission', { permissions: permissions, member: member, current: member.permissions.id( req.params.id ) } );
		} );
	} );
} );

app.post( '/:uuid/permissions/:id/modify', auth.isAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}

		if ( member.permissions.id( req.params.id ) == undefined ) {
			req.flash( 'warning', messages['permission-404'] );
			res.redirect( app.mountpath );
			return;
		}

		Permissions.findOne( { slug: req.body.permission }, function( err, newPermission ) {
			if ( newPermission == undefined ) {
				req.flash( 'warning', messages['permission-404'] );
				res.redirect( app.mountpath );
				return;
			}

			var permission = member.permissions.id( req.params.id );
			permission.permission = newPermission._id;

			if ( req.body.start_date != '' && req.body.start_time != '' ) { 
				permission.date_added = new Date( req.body.start_date + 'T' + req.body.start_time );
			} else {
				permission.date_added = new Date();
			}

			if ( req.body.expiry_date != '' && req.body.expiry_time != '' ) {
				permission.date_expires = new Date( req.body.expiry_date + 'T' + req.body.expiry_time );

				if ( permission.date_added >= permission.date_expires ) {
					req.flash( 'warning', messages['permission-expiry-error'] );
					res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
					return;
				}
			} else {
				permission.date_expires = null;
			}

			member.save( function ( err ) {
				req.flash( 'success', messages['permission-updated'] );
				res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
			} );
		} );
	} );
} );

// Revoke Member Permission
///////////////////////////

app.get( '/:uuid/permissions/:id/revoke', auth.isAdmin, function( req, res ) {
	Members.findOne( { uuid: req.params.uuid }, function( err, member ) {
		if ( member == undefined ) {
			req.flash( 'warning', messages['member-404'] );
			res.redirect( app.mountpath );
			return;
		}
		
		if ( member.permissions.id( req.params.id ) == undefined ) {
			req.flash( 'warning', messages['permission-404'] );
			res.redirect( app.mountpath );
			return;
		}

		member.permissions.pull( { _id: req.params.id } );

		member.save( function ( err ) {
			req.flash( 'success', messages['permission-removed'] );
			res.redirect( app.mountpath + '/' + req.params.uuid + '/permissions' );
		} );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};