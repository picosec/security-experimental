"use strict";

var Capability = require('../lib/token/capability');

var _exports = {};

exports.create_simple_capability = function(test) {
	test.expect(1);
	var scope = 'http://test.picosec.org/res/';
	var resources = {
		sensor: ['read', 'set_threshold'],
		config: ['read', 'write']
	};

	var capability = Capability.create(scope, resources);
	var encoded = capability.encode();
	test.equals(
		encoded,
		'{"config":["read","write"],"sensor":["read","set_threshold"],"$scope":"http://test.picosec.org/res/"}',
		'Verify expected capability encoding'
	);
	test.done();
};

exports.simple_c14n = function(test) {
	test.expect(1);
	var scope = 'http://test.picosec.org/res/';
	var resources = {
		zz: ['qq', 'pp'],
		aa: ['ss', 'rr']
	};

	var capability = Capability.create(scope, resources);
	var encoded = capability.encode();
	test.equals(
		encoded,
		'{"aa":["rr","ss"],"zz":["pp","qq"],"$scope":"http://test.picosec.org/res/"}',
		'Verify expected capability encoding'
	);
	test.done();
};

exports.simple_decode = function(test) {
	test.expect(2);
	var capability = Capability.decode('{"aa":["rr","ss"],"zz":["pp","qq"],"$scope":"http://test.picosec.org/res/"}');
	var scope = 'http://test.picosec.org/res/';
	var resources = {
		zz: ['pp', 'qq'],
		aa: ['rr', 'ss']
	};

	test.deepEqual(scope, capability.scope);
	test.deepEqual(resources, capability.resources);
	test.done();
};

exports.simple_validate_0 = function(test) {
	test.expect(2);
	var capability = Capability.validate('{"zz":["qq","pp"],"aa":["ss","rr"],"$scope":"http://test.picosec.org/res/"}');
	var scope = 'http://test.picosec.org/res/';
	var resources = {
		zz: ['pp', 'qq'],
		aa: ['rr', 'ss']
	};

	test.deepEqual(scope, capability.scope);
	test.deepEqual(resources, capability.resources);
	test.done();
};

exports.simple_validate_1 = function(test) {
	test.expect(2);
	var capability = Capability.validate('{"aa":["qq","pp"],"cc":["ss","rr"],"bb":["ww","*"], "ww":[],"$scope":"http://test.picosec.org/res/"}');
	var scope = 'http://test.picosec.org/res/';
	var resources = {
		aa: ['pp', 'qq'],
		bb: ['*'],
		cc: ['rr', 'ss']
	};

	test.deepEqual(scope, capability.scope);
	test.deepEqual(resources, capability.resources);
	test.done();
};

exports.simple_intersect_0 = function(test) {
	test.expect(1);
	var scope = 'http://test.picosec.org/res/';
	var resources0 = {
		sensor: ['read', 'set_threshold'],
		config: ['read', 'write']
	};
	var resources1 = {
		sensor: ['set_threshold', 'calibrate']
	};

	var capability0 = Capability.create(scope, resources0);
	var capability1 = Capability.create(scope, resources1);
	var intersection = capability0.intersect(capability1);
	test.deepEqual(
		intersection.resources,
		{sensor:['set_threshold']},
		'Verify expected capability intersection'
	);
	test.done();
};

exports.simple_intersect_1 = function(test) {
	test.expect(1);
	var scope = 'http://test.picosec.org/res/';
	var resources0 = {
		sensor: ['read', 'set_threshold'],
		config: ['*']
	};
	var resources1 = {
		sensor: ['set_threshold', 'calibrate'],
		config: ['write']
	};

	var capability0 = Capability.create(scope, resources0);
	var capability1 = Capability.create(scope, resources1);
	var intersection = capability0.intersect(capability1);
	test.deepEqual(
		intersection.resources,
		{sensor:['set_threshold'], config:['write']},
		'Verify expected capability intersection'
	);
	test.done();
};

exports.simple_intersect_2 = function(test) {
	test.expect(1);
	var scope0 = 'http://test0.picosec.org/res/';
	var scope1 = 'http://test1.picosec.org/res/';
	var resources0 = {
		sensor: ['read', 'set_threshold'],
		config: ['*']
	};
	var resources1 = {
		sensor: ['set_threshold', 'calibrate'],
		config: ['write']
	};

	var capability0 = Capability.create(scope0, resources0);
	var capability1 = Capability.create(scope1, resources1);
	var intersection = capability0.intersect(capability1);
	test.ok(intersection == null, 'Verify expected capability intersection');
	test.done();
};

exports.simple_checkaccess_0 = function(test) {
	test.expect(5);
	var scope = 'http://test.picosec.org/res/';
	var resources = {
		sensor: ['read', 'set_threshold'],
		config: ['*']
	};

	var capability = Capability.create(scope, resources);

	test.ok(!capability.checkAccess('not_a_scope', 'sensor', 'read'), 'Verify expected access');
	test.ok(capability.checkAccess(scope, 'sensor', 'read'), 'Verify expected access');
	test.ok(!capability.checkAccess(scope, 'sensor1', 'read'), 'Verify expected access');
	test.ok(!capability.checkAccess(scope, 'sensor', 'read1'), 'Verify expected access');
	test.ok(capability.checkAccess(scope, 'config', 'write'), 'Verify expected access');
	test.done();
};

exports.create_compound_capability = function(test) {
	test.expect(1);
	var scope0 = 'http://test0.picosec.org/res/';
	var resources0 = {
		sensor: ['read', 'set_threshold'],
		config: ['read', 'write']
	};
	var scope1 = 'http://test1.picosec.org/res/';
	var resources1 = {
		sensor: ['read', 'set_threshold'],
		config: ['read', 'write']
	};

	var capability = Capability.CapabilityGroup.create([Capability.create(scope0, resources0), Capability.create(scope1, resources1)]);
	var encoded = capability.encode();
	test.equals(
		encoded,
		'[{"config":["read","write"],"sensor":["read","set_threshold"],"$scope":"http://test0.picosec.org/res/"},' +
		'{"config":["read","write"],"sensor":["read","set_threshold"],"$scope":"http://test1.picosec.org/res/"}]',
		'Verify expected capability encoding'
	);
	test.done();
};

exports.compound_c14n = function(test) {
	var scope0 = 'http://test0.picosec.org/res/';
	var resources0 = {
		sensor: ['set_threshold', 'read'],
		config: ['write', 'read']
	};
	var scope1 = 'http://test1.picosec.org/res/';
	var resources1 = {
		sensor: ['read', 'set_threshold'],
		config: ['read', 'write']
	};

	var capability = Capability.CapabilityGroup.create([Capability.create(scope1, resources1), Capability.create(scope0, resources0)]);
	var encoded = capability.encode();
	test.equals(
		encoded,
			'[{"config":["read","write"],"sensor":["read","set_threshold"],"$scope":"http://test0.picosec.org/res/"},' +
			'{"config":["read","write"],"sensor":["read","set_threshold"],"$scope":"http://test1.picosec.org/res/"}]',
		'Verify expected capability encoding'
	);
	test.done();
};

exports.compound_decode = function(test) {
	test.expect(4);
	var capability = Capability.decode(
			'[{"config":["read","write"],"sensor":["read","set_threshold"],"$scope":"http://test0.picosec.org/res/"},' +
			'{"config":["read","write"],"sensor":["read","set_threshold"],"$scope":"http://test1.picosec.org/res/"}]'
	);
	var scope0 = 'http://test0.picosec.org/res/';
	var resources0 = {
		sensor: ['read', 'set_threshold'],
		config: ['read', 'write']
	};
	var scope1 = 'http://test1.picosec.org/res/';
	var resources1 = {
		sensor: ['read', 'set_threshold'],
		config: ['read', 'write']
	};

	test.deepEqual(scope0, capability.items[0].scope);
	test.deepEqual(resources0, capability.items[0].resources);
	test.deepEqual(scope1, capability.items[1].scope);
	test.deepEqual(resources1, capability.items[1].resources);
	test.done();
};

exports.compound_validate_0 = function(test) {
	test.expect(4);
	var capability = Capability.validate(
			'[{"config":["read","write"],"sensor":["read","set_threshold"],"$scope":"http://test0.picosec.org/res/"},' +
			'{"config":["read","write"],"sensor":["read","set_threshold"],"$scope":"http://test1.picosec.org/res/"}]'
	);
	var scope0 = 'http://test0.picosec.org/res/';
	var resources0 = {
		sensor: ['read', 'set_threshold'],
		config: ['read', 'write']
	};
	var scope1 = 'http://test1.picosec.org/res/';
	var resources1 = {
		sensor: ['read', 'set_threshold'],
		config: ['read', 'write']
	};

	test.deepEqual(scope0, capability.items[0].scope);
	test.deepEqual(resources0, capability.items[0].resources);
	test.deepEqual(scope1, capability.items[1].scope);
	test.deepEqual(resources1, capability.items[1].resources);
	test.done();
};

exports.compound_validate_1 = function(test) {
	test.expect(4);
	var capability = Capability.validate(
			'[{"config":["write", "read"],"sensor":["read","set_threshold"], "ww":[],"$scope":"http://test0.picosec.org/res/"},' +
			'{"config":["read","write"],"sensor":["read","*"],"$scope":"http://test1.picosec.org/res/"}]'
	);
	var scope0 = 'http://test0.picosec.org/res/';
	var resources0 = {
		sensor: ['read', 'set_threshold'],
		config: ['read', 'write']
	};
	var scope1 = 'http://test1.picosec.org/res/';
	var resources1 = {
		sensor: ['*'],
		config: ['read', 'write']
	};

	test.deepEqual(scope0, capability.items[0].scope);
	test.deepEqual(resources0, capability.items[0].resources);
	test.deepEqual(scope1, capability.items[1].scope);
	test.deepEqual(resources1, capability.items[1].resources);
	test.done();
};

exports.compound_intersect_0 = function(test) {
	test.expect(1);
	var scope0 = 'http://test0.picosec.org/res/';
	var resources0 = {
		sensor: ['read', 'set_threshold'],
		config: ['read', 'write']
	};
	var scope1 = 'http://test1.picosec.org/res/';
	var resources1 = {
		sensor: ['*'],
		config: ['read', 'write']
	};
	var capability0 = Capability.CapabilityGroup.create([Capability.create(scope0, resources0)]);
	var capability1 = Capability.CapabilityGroup.create([Capability.create(scope1, resources1)]);
	var intersection = capability0.intersect(capability1);

	test.ok(intersection == null, 'Verify expected intersection');
	test.done();
};

exports.compound_intersect_1 = function(test) {
	test.expect(3);
	var scope = 'http://test0.picosec.org/res/';
	var resources0 = {
		sensor: ['set_threshold'],
		config: ['read', 'write']
	};
	var resources1 = {
		sensor: ['*'],
		config: ['read']
	};
	var capability0 = Capability.CapabilityGroup.create([Capability.create(scope, resources0)]);
	var capability1 = Capability.CapabilityGroup.create([Capability.create(scope, resources1)]);
	var intersection = capability0.intersect(capability1);

	test.equal(1, intersection.items.length, 'Verify expected number of simple capabilities');
	test.equal(scope, intersection.items[0].scope, 'Verify expected scope');
	test.deepEqual({config: ['read'], sensor: ['set_threshold']}, intersection.items[0].resources, 'Verify expected intersection');
	test.done();
};

exports.compound_checkaccess_0 = function(test) {
	test.expect(5);
	var scope0 = 'http://test0.picosec.org/res/';
	var resources0 = {
		sensor: ['set_threshold', 'read'],
		config: ['write', 'read']
	};
	var scope1 = 'http://test1.picosec.org/res/';
	var resources1 = {
		sensor: ['read', 'set_threshold'],
		config: ['read', 'write']
	};

	var capability = Capability.CapabilityGroup.create([Capability.create(scope1, resources1), Capability.create(scope0, resources0)]);

	test.ok(!capability.checkAccess('not_a_scope', 'sensor', 'read'), 'Verify expected access');
	test.ok(capability.checkAccess(scope0, 'sensor', 'read'), 'Verify expected access');
	test.ok(!capability.checkAccess(scope0, 'sensor1', 'read'), 'Verify expected access');
	test.ok(!capability.checkAccess(scope1, 'sensor', 'read1'), 'Verify expected access');
	test.ok(capability.checkAccess(scope1, 'config', 'write'), 'Verify expected access');
	test.done();
};

