"use strict";
module.exports = (function() {

	var buffertools = require('buffertools');
	var hexy = require('hexy');

	var POW_6 = 1 << 6;
	var POW_7 = 1 << 7;
	var POW_14 = 1 << 14;
	var POW_15 = 1 << 15;
	var POW_30 = 1 << 30;
	var POW_31 = (1 << 30) * 2;
	var MASK_14_15 = POW_14 + POW_15;
	var MASK_30_31 = POW_30 + POW_31;

	function SimpleEncoding() {}

	SimpleEncoding.header = function(length) {
		var header;
		if(length < POW_7) {
			header = new Buffer(1);
			header[0] = length;
		} else if(length < POW_14) {
			header = new Buffer(2);
			header.writeUInt16BE(length + POW_15);
		} else {
			header = new Buffer(4);
			header.writeUInt32BE(length + MASK_30_31);
		}
		return header;
	};

	SimpleEncoding.encode = function(items, target, targetOffset) {
		if(!Array.isArray(items)) items = [items];
		var encodedItems = [];
		items.forEach(function(data) {
			if(typeof(data) == 'string')
				data = new Buffer(data);
			var header = SimpleEncoding.header(data.length);
			encodedItems.push(header, data);
		});
//console.log('** encode:');
//encodedItems.forEach(function(buf) {
//	console.log(hexy.hexy(buf));
//});
		var encoded = buffertools.concat.apply(null, encodedItems);

//console.log('** encode result:');
//console.log(hexy.hexy(encoded));
		return encoded;
	};

	SimpleEncoding.decode = function(encoded) {
		var items = [], offset = 0, itemLength, headerLength;
		while(offset < encoded.length) {
			var headerByte0 = encoded[offset];
//console.log('decode: offset = ' + offset + '; headerByte0 = ' + headerByte0);
			if((headerByte0 & POW_7) == 0) {
				itemLength = headerByte0;
				headerLength = 1;
			} else if((headerByte0 & POW_6) == 0) {
				headerLength = 2;
				itemLength = encoded.readUInt16BE(offset) & ~MASK_14_15;
			} else {
				headerLength = 4;
				itemLength = encoded.readUInt32BE(offset) & ~MASK_30_31;
			}
//console.log('decode: headerLength = ' + headerLength + '; itemLength = ' + itemLength);
			offset += headerLength;
			items.push(encoded.slice(offset, offset + itemLength));
			offset += itemLength;
//console.log('decode: new offset = ' + offset);
		}
//console.log('** decode:');
//items.forEach(function(buf) {
//	console.log(hexy.hexy(buf));
//});
		return items;
	};

	SimpleEncoding.format = function(buf, format) {
		var result;
		switch(format) {
			case 'hex':
				result = buf.toString('hex');
				break;
			case 'base64':
				result = buf.toString('base64');
				break;
			case 'binary':
			case undefined:
				result = buf;
				break;
			default:
				throw new Error('Unrecognised format (' + format + ')');
		}
		return result;
	};

	SimpleEncoding.unformat = function(item) {
		if(typeof(item) == 'string')
			return new Buffer(item, 'base64');
		if(Buffer.isBuffer(item))
			return item;
		throw new Error('unrecognised format');
	};

	return SimpleEncoding;
})();