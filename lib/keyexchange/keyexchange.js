"use strict";
module.exports = (function() {
	function KeyExchange() {}

	KeyExchange.createSharedSecret = function(aParty, bParty) {
		var privateKey = aParty.privateKey;
		var publicKey = bParty.publicKey;
		return privateKey.deriveSharedSecret(publicKey);
	};

	return KeyExchange;
})();
