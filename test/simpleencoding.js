"use strict";

var buffertools = require('buffertools');
var SimpleEncoding = require('../lib/util/simpleencoding');

function fillRandom(buffer) {
	for(var i = 0; i < buffer.length; i++)
		buffer[i] = Math.floor(Math.random() * 256);
}

function randomBuffer(length) {
	var buf = new Buffer(length);
	fillRandom(buf);
	return buf;
}

var _exports = {};

exports.encode_short = function(test) {
	var buf1 = randomBuffer(1),
		buf127 = randomBuffer(127),
		encoded = SimpleEncoding.encode([buf1, buf127]),
		decoded = SimpleEncoding.decode(encoded);

	test.expect(3);
	test.ok(decoded.length == 2, 'Verify expected number of decoded components');
	test.ok(buffertools.compare(decoded[0], buf1) == 0, 'Verify faithful decoding');
	test.ok(buffertools.compare(decoded[1], buf127) == 0, 'Verify faithful decoding');
	test.done();
};

exports.encode_medium0 = function(test) {
	var buf128 = randomBuffer(128),
		encoded = SimpleEncoding.encode([buf128]),
		decoded = SimpleEncoding.decode(encoded);

	test.expect(2);
	test.ok(decoded.length == 1, 'Verify expected number of decoded components');
	test.ok(buffertools.compare(decoded[0], buf128) == 0, 'Verify faithful decoding');
	test.done();
};

exports.encode_medium1 = function(test) {
	var buf128 = randomBuffer(128),
		buf16383 = randomBuffer(16383),
		encoded = SimpleEncoding.encode([buf128, buf16383]),
		decoded = SimpleEncoding.decode(encoded);

	test.expect(3);
	test.ok(decoded.length == 2, 'Verify expected number of decoded components');
	test.ok(buffertools.compare(decoded[0], buf128) == 0, 'Verify faithful decoding');
	test.ok(buffertools.compare(decoded[1], buf16383) == 0, 'Verify faithful decoding');
	test.done();
};

exports.encode_long0 = function(test) {
	var buf16384 = randomBuffer(16384),
		encoded = SimpleEncoding.encode([buf16384]),
		decoded = SimpleEncoding.decode(encoded);

	test.expect(2);
	test.ok(decoded.length == 1, 'Verify expected number of decoded components');
	test.ok(buffertools.compare(decoded[0], buf16384) == 0, 'Verify faithful decoding');
	test.done();
};

exports.format = function(test) {
	var buf = randomBuffer(256),
		formatted = SimpleEncoding.format(buf, 'base64'),
		unformatted = SimpleEncoding.unformat(formatted);

	test.expect(1);
	test.ok(buffertools.compare(unformatted, buf) == 0, 'Verify faithful decoding');
	test.done();
};
