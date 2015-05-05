"use strict";
module.exports = (function() {
	var crypto = require('crypto');
	var hexy = require('hexy');
	var util = require('util');
	var Capability = require('./capability');
	var SimpleEncoding = require('../util/simpleencoding');

	var DEFAULT_TTL = 3600 * 1000;
	var DEFAULT_HASH = 'sha256';
	var HASH_LENGTH = 32; // length of a sha256 hash in bytes

	/**
	 * A token or 'bearer token' conveys rights to the holder.
	 * A token is issued by an issuing authority (typically accessed
	 * via an Authorisation Server), and consists of a capability
	 * (the rights of the token, based on resources and operations
	 * for each resource), metadata (eg expiry time) and a signature.
	 *
	 * Tokens are signed by taking a canonical text representation
	 * (rules are defined for construction of this representation)
	 * and then signing using the private key of the issuer.
	 *
	 * Full tokens (a complete textual representation of the contents
	 * of the token and signature) are referred to as literal tokens;
	 * they have no semantic content wider than the text of the token;
	 * the rights and metadata are transparent and the signature is
	 * verifiable.
	 *
	 * Tokens also have a short form, which is a fragment of the
	 * signature text; a short form is uniquely associated with a
	 * literal token, and it is computationally infeasible to forge
	 * a different literal token for any given short token.
	 * @constructor
	 */
	function Token(values) {
		this.id = null;
		this.shortId = null;
		if(values) this.setValues(values);
	}

	Token.prototype.setValues = function(values) {
		this.issued = values.issued || Date.now();
		this.expires = values.expires || (this.issued + (values.ttl || DEFAULT_TTL));
		this.nonce = values.nonce || String(Math.random()).slice(2, 10);
		this.capability = values.capability || Capability.all;
	};

	Token.prototype.checkAccess = function(scope, resource, operation) {
		return this.capability.checkAccess(scope, resource, operation);
	};

	Token.fromCanonicalText = function(text) {
		var parts = text.split('\n'),
			issued = parts[0],
			expires = parts[1],
			nonce = parts[2],
			capability = Capability.decode(parts[3]);

		return new Token({
			issued: issued,
			expires: expires,
			nonce: nonce,
			capability: capability
		});
	};

	Token.prototype.sign = function(keypair) {
		var canonicalText = this.getCanonicalText(),
			mac = Token.digest(canonicalText),
			sig = keypair.privateKey.sign(mac, DEFAULT_HASH);

		this.id = Token.id(sig, canonicalText);
		this.shortId = Token.shortId(sig, mac);
	};

	Token.prototype.getCanonicalText = function() {
		return [
			this.issued,
			this.expires,
			this.nonce,
			this.capability.encode()
		].join('\n');
	};

	Token.create = function(values, keypair) {
		var token = new Token(values);
		token.sign(keypair);
		return token;
	};

	Token.validate = function(tokenId, publicKey) {
		var rawToken = SimpleEncoding.unformat(tokenId),
			parts = SimpleEncoding.decode(rawToken),
			sig = parts[0],
			macOrText = parts[1],
			mac, text, valid, token;

		if(macOrText.length == HASH_LENGTH) {
			/* short id only; we can validate but not create a token */
			mac = macOrText;
		} else {
			mac = Token.digest(macOrText);
			text = String(macOrText);
		}
		valid = publicKey.verifySignature(mac, sig);
		if(!valid) throw new Error('Token validation failure');
		if(text) {
			token = Token.fromCanonicalText(text);
			token.id = tokenId;
			token.shortId = Token.shortId(sig, mac);
		} else {
			token = new Token();
			token.shortId = tokenId;
		}
		return token;
	};

	Token.digest = function(text) {
		var hash = crypto.createHash(DEFAULT_HASH);
		hash.update(text);
		return hash.digest();
	};

	Token.id = function(sig, canonicalText) {
		var id = SimpleEncoding.encode([sig, canonicalText]);
		return SimpleEncoding.format(id, 'base64');
	};

	Token.shortId = function(sig, mac) {
		return SimpleEncoding.format(SimpleEncoding.encode([sig, mac]), 'base64');
	};

	Token.Status = {
		'ENABLED': 0,
		'REVOKED': 1,
		'EXPIRED': 2
	};

	Token.Type = {
		'ACCESS': 0,
		'REFRESH': 1
	};

	return Token;
})();
