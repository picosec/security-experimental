"use strict";

var Identity = require('../lib/keyexchange/identity');
var KeyExchange = require('../lib/keyexchange/keyexchange');
var Key = require('../lib/keyexchange/key');
var KeyPair = Key.KeyPair;

var _exports = {};

var aliceKeys;
var bobKeys;
var aliceDeviceAddress = String(Math.random()).slice(2);
var bobDeviceAddress = String(Math.random()).slice(2);

exports.setup_keys = function(test) {
	aliceKeys = KeyPair.create();
	bobKeys = KeyPair.create();
	test.done();
};

exports.shared_secret_0 = function(test) {
	test.expect(1);
	// Alice generate the shared secret:
	var aliceSharedSecret = aliceKeys.privateKey.deriveSharedSecret(bobKeys.publicKey);
	console.log('shared secret: ', aliceSharedSecret.toString('hex'));

	// Checking that Bob has the same secret:
	var bobSharedSecret = bobKeys.privateKey.deriveSharedSecret(aliceKeys.publicKey);
	test.equals(bobSharedSecret.toString('hex'), aliceSharedSecret.toString('hex'), 'Verify shared secret is derived equally');
	test.done();
};

exports.shared_keyexchange = function(test) {
	test.expect(1);
	// Alice generate the shared secret:
	var aliceSharedSecret = KeyExchange.createSharedSecret(aliceKeys, bobKeys);
	console.log('shared secret:', aliceSharedSecret.toString('hex'));

	// Checking that Bob has the same secret:
	var bobSharedSecret = KeyExchange.createSharedSecret(bobKeys, aliceKeys);
	test.equals(bobSharedSecret.toString('hex'), aliceSharedSecret.toString('hex'), 'Verify shared secret is derived equally');
	test.done();
};

exports.create_identity = function(test) {
	var aliceDeviceIdentity = Identity.create(aliceKeys.publicKey.getEncoded(), aliceDeviceAddress);
	var bobDeviceIdentity = Identity.create(bobKeys.publicKey.getEncoded(), bobDeviceAddress);
	console.log('alice public key length: ' + aliceKeys.publicKey.getEncoded().length);
	console.log('alice public key (base64): ' + aliceKeys.publicKey.getEncoded('base64'));
	console.log('alice public key (hex): ' + aliceKeys.publicKey.getEncoded('hex'));
	console.log('aliceDeviceIdentity length: ' + aliceDeviceIdentity.getEncoded().length);
	console.log('aliceDeviceIdentity (base64): ' + aliceDeviceIdentity.getEncoded('base64'));
	console.log('aliceDeviceIdentity (hex): ' + aliceDeviceIdentity.getEncoded('hex'));
	test.done();
};