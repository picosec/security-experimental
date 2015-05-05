"use strict";

var Key = require('../lib/keyexchange/key');
var KeyPair = Key.KeyPair;
var Capability = require('../lib/token/capability');
var Token = require('../lib/token/token');

var aliceKeys;
var bobKeys;

var _exports = {};

exports.setup_keys = function(test) {
	aliceKeys = KeyPair.create();
	bobKeys = KeyPair.create();
	test.done();
};

var _exports = {};

exports.create_simple_token = function(test) {
	test.expect(1);
	var scope = 'http://test.picosec.org/res/';
	var resources = {
		sensor: ['read', 'set_threshold'],
		config: ['read', 'write']
	};

	var capability = Capability.create(scope, resources),
		token = Token.create({capability: capability}, aliceKeys);

	test.ok(token, 'Verify token created');
	test.done();
};

exports.simple_checkaccess_0 = function(test) {
	test.expect(5);
	var scope = 'http://test.picosec.org/res/';
	var resources = {
		sensor: ['read', 'set_threshold'],
		config: ['*']
	};

	var capability = Capability.create(scope, resources),
		token = Token.create({capability: capability}, aliceKeys);

	test.ok(!token.checkAccess('not_a_scope', 'sensor', 'read'), 'Verify expected access');
	test.ok(token.checkAccess(scope, 'sensor', 'read'), 'Verify expected access');
	test.ok(!token.checkAccess(scope, 'sensor1', 'read'), 'Verify expected access');
	test.ok(!token.checkAccess(scope, 'sensor', 'read1'), 'Verify expected access');
	test.ok(token.checkAccess(scope, 'config', 'write'), 'Verify expected access');
	test.done();
};

exports.simple_validate = function(test) {
	test.expect(2);
	var scope = 'http://test.picosec.org/res/';
	var resources = {
		sensor: ['read', 'set_threshold'],
		config: ['*']
	};

	var capability = Capability.create(scope, resources),
		token = Token.create({capability: capability}, aliceKeys),
		validated = Token.validate(token.id, aliceKeys.publicKey);

	test.ok(validated, 'Verify token is validated');
	test.deepEqual(capability, validated.capability, 'Verify token capability successfully decoded');
	test.done();
};
