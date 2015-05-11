"use strict";
module.exports = (function() {
	var util = require('util');
	var SimpleEncoding = require('../util/simpleencoding');

	var ecdh = require('ecdh');
	var curve = ecdh.getCurve('secp256k1'/*'secp128r1'*/);
	var PrivateKey = ecdh.PrivateKey;
	var PublicKey = ecdh.PublicKey;

	function Key() {}

	function KeyPair(privateKey) {
    	this.privateKey = privateKey || PrivateKey.generate(curve);
		this.publicKey = this.privateKey.derivePublicKey();
	}

	KeyPair.create = function(privateKey) {
		return new KeyPair(privateKey);
	};

	PrivateKey.prototype.getEncoded = function(format) {
		var buf = this.buffer;
		return SimpleEncoding.format(buf, format);
	};

	PrivateKey.fromEncoded = function(encoded) {
		var buf = SimpleEncoding.unformat(encoded);
		return PrivateKey.fromBuffer(curve, buf);
	};

	PublicKey.prototype.getEncoded = function(format) {
		var buf = this.buffer;
		return SimpleEncoding.format(buf, format);
	};

	PublicKey.fromEncoded = function(encoded) {
		var buf = SimpleEncoding.unformat(encoded);
		return PublicKey.fromBuffer(curve, buf);
	};

	Key.PrivateKey = PrivateKey;
	Key.PublicKey = PublicKey;
	Key.KeyPair = KeyPair;

	return Key;
})();
