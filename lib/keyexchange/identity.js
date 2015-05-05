"user strict";
module.exports = (function() {
	var Key = require('./key');
	var PublicKey = Key.PublicKey;
	var SimpleEncoding = require('../util/simpleencoding');

	function Identity(publicKey, hwId) {
		this.publicKey = publicKey;
		this.hwId = hwId;
		this.encoded = null;
	}

	Identity.create = function(publicKey, hwId) {
		publicKey = PublicKey.fromEncoded(publicKey);
		hwId = SimpleEncoding.unformat(hwId);
		return new Identity(publicKey, hwId);
	};

	Identity.prototype.getEncoded = function(format) {
		if(!this.encoded) {
			this.encoded = SimpleEncoding.encode([this.publicKey.getEncoded(), this.hwId]);
		}
		return SimpleEncoding.format(this.encoded, format);
	};

	Identity.fromEncoded = function(identity) {
		var identityParts = SimpleEncoding.decode(SimpleEncoding.unformat(identity));
		return Identity.create(identityParts[0], identityParts[0]);
	};

	return Identity;
})();
