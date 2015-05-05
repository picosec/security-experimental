"use strict";
module.exports = (function() {

	/**
	 * A capability expresses a set of resources and a set of actions
	 * on each of those resources. A capability is usually used as
	 * part of a Token, which asserts the right of the bearer to perform
	 * those actions.
	 *
	 * Resources in Capabilities are URIs. A simple capability has a
	 * resource base (scope) URI and specific resources with actions are
	 * referenced relative to that base URI.
	 *
	 * Actions are named operations (eg "open", "delete", "modify"). Commonly
	 * action names are not qualified but action names can be namespaced
	 * by a Vocabulary which itself has a URI.
	 *
	 * Compound capabilities are simply sets of primitive capabilities.
	 * There is no multi-level composition of compound capabilities.
	 *
	 * Capabilities have a text representation which is the stringified map
	 * of their resources and actions. The basic structure of a simple
	 * capability is:
	 * {
	 *   '$scope': optional-scope-uri,
	 *   resource1: [action1, action2, .. ],
	 *   resource2: [action3, action4, ...]
	 * }
	 *
	 * Resource names are relative to a base scope URI and may be hierarchically
	 * structured, using a period '.' as component separator.
	 *
	 * Simple wildcards (essentially just an expression with a wildcard as
	 * the final component) may be used in resource specifications within
	 * a capability.
	 *
	 * Resource names are limited to valid javascript identifiers, with the
	 * additional restriction that names starting with '$' are not permitted
	 * to be a reserved word; currently reserved word is '$scope'.
	 *
	 * There are no other restrictions on resource names, except for the special
	 * meaning given to '.' in relation to wildcard expressions.
	 *
	 * A compound capability is simply an array of simple capabilities, and
	 * is taken to mean the union of its constituent capabilities.
	 *
	 * A capability can be canonicalised to create a canonicalised
	 * representation of the resource paths and associated
	 * operations in the capability. It is the JSON stringified
	 * value of an object of the form:
	 *
	 * {
	 *   '$scope': optional-scope-uri,
	 *   resource1: [operation1a, operation1b, operation1c, ...],
	 *   resource2: [operation2a, operation2b, operation2c, ...].
	 *   ...
	 * }
	 *
	 * with the following constraints:
	 * - all whitespace is removed;
	 * - resources are listed in forward lexicographic order;
	 * - operations are listed in forward lexicographic order;
	 * - there is no trailing comma on any list of array or object elements;
	 * - all strings are quoted and escaped as per the JSON standard.
	 *
	 * Wildcard resource specifications are supported, either as:
	 *
	 * {
	 *   '*': [operation1a, operation1b, operation1c, ...]
	 * }
	 *
	 * {
	 *   'resource_component.*': [operation1a, operation1b, operation1c, ...]
	 * }
	 *
	 * A wildcard operation specification is supported as:
	 *
	 * {
	 *   resource1: ['*']
	 * }
	 *
	 * The following capability therefore permits everything:
	 *
	 * {
	 *   '*': ['*']
	 * }
	 */

	var star         = '*';
	var prefixedStar = '.*';
	var all          = {'*':['*']};

	var intersectOps = function(ops1, ops2) {
		var idx1 = 0
			,   idx2 = 0
			,   len1 = ops1.length
			,   len2 = ops2.length
			,   val1 = ops1[idx1]
			,   val2 = ops2[idx2]
			,   result = []
			;
		if(val1 == '*')
			return ops2;
		if(val2 == '*')
			return ops1;
		while(idx1 < len1 && idx2 < len2) {
			if(val1 == val2) {
				result.push(val1);
				val1 = ops1[++idx1]; val2 = ops2[++idx2];
			} else if(val1 < val2) {
				do { val1 = ops1[++idx1]; } while(val1 < val2)
			} else { /* val1 > val2 */
				do { val2 = ops2[++idx2]; } while(val1 > val2)
			}
		}
		return result;
	};

	var validateOps = function(ops) {
		if(ops.constructor == Array) {
			ops.sort();
			if(ops.length > 0) {
				if(contains(ops, star)) {
					return [star];
				}
				return ops;
			}
			return null;
		}
	};

	var mixin = function(target) {
		for(var i = 1; i < arguments.length; i++) {
			var source = arguments[i];
			for(var key in source) {
				target[key] = source[key];
			}
		}
		return target;
	};

	var shallowClone = function(src) {
		return mixin(Object.create(null), src);
	};

	var contains = function(arr, element) {
		return arr.indexOf(element) > -1;
	};

	var isEmpty = function(ob) {
		for(var member in ob)
			return false;
		return true;
	};

	function Capability(scope, resources) {
		this.scope = scope;
		this.resources = resources || all;
	}

	Capability.all = all;
	Capability.allText = JSON.stringify(all);

	Capability.allOps = function(ops) { return  ops && ops[0] == star; };
	Capability.emptyOps = function(ops) { return  ops === undefined || ops.length == 0; };

	Capability.parseResources = JSON.parse;

	Capability.create = function(scope, resources) {
		if(resources) resources = Capability.normaliseResources(resources);
		return new Capability(scope, resources);
	};


	/* This normalises a resources set so as to be
	 * able to then create a canonical text representation.
	 *
	 * The resources set is updated so that it satisfies
	 * the following constraints:
	 * - resources are listed in forward lexicographic order;
	 * - the operations for each resource are listed in
	 *   forward lexicographic order.
	 */
	Capability.normaliseResources = function(resources) {
		var result = Object.create(null);
		Object.keys(resources).sort().forEach(function(key) {
			result[key] = resources[key].sort();
		});
		return result;
	};

	/* this creates a canonical text representation
	 * of this capability.
	 *
	 * It is the JSON stringified representation of the
	 * normalised resources hash, with the following
	 * additional constraints:
	 * - there is no whitespace;
	 */
	Capability.prototype.encode = function() {
		return JSON.stringify(this.preencode());
	};

	/* this creates a canonical text representation
	 * of this capability.
	 *
	 * It is the JSON stringified representation of the
	 * normalised resources hash, with the following
	 * additional constraints:
	 * - there is no whitespace;
	 */
	Capability.prototype.preencode = function() {
		var result = shallowClone(this.resources);
		if(this.scope) result['$scope'] = this.scope;
		return result;
	};

	/*
	 * Decode an encoded capability string
	 * Assumes the capability is valid and
	 * normalised
	 */
	Capability.decodeParsed = function(parsed) {
		var scope = parsed['$scope'];
		delete parsed['$scope'];
		return new Capability(scope, parsed);
	};

	/*
	 * Decode an encoded capability string
	 * Assumes the capability is valid and
	 * normalised
	 */
	Capability.decode = function(encoded) {
		var capability = null, parsed = null;
		try {
			parsed = JSON.parse(encoded);
			if(parsed.constructor === Object) {
				return Capability.decodeParsed(parsed);
			} else {
				return CapabilityGroup.decodeParsed(parsed);
			}
		} catch(e) {
			console.error('Capability.decode(): Unexpected exception decoding capability; err = ' + e);
			throw new Error('Decode error: ' + e);
		}
	};

	/*
	 * Validate and decode an encoded capability
	 * string. Makes no assumptions about the
	 * validity of the text.
	 */
	Capability.validate = function(text) {
		if(typeof(text) == 'string') {
			var parsed = JSON.parse(text);
			if(parsed.constructor === Object) {
				return Capability.validateParsed(parsed);
			} else {
				return CapabilityGroup.validateParsed(parsed);
			}
		}
		throw new Error('Malformed capability');
	};

	Capability.validateParsed = function(parsed) {
		try {
			var resources = Object.create(null);
			var scope = parsed['$scope'];
			delete parsed['$scope'];
			var orderedKeys = Object.keys(parsed).sort();
			for(var i = 0; i < orderedKeys.length; i++) {
				var resource = orderedKeys[i];
				var resourceOps = validateOps((resources[resource] || []).concat(parsed[resource]));
				if(!resourceOps) continue;
				resources[resource] = resourceOps;
			}
			return isEmpty(resources) ? null : new Capability(scope, resources);
		} catch(e) {}
		throw new Error('Malformed capability');
	};

	/**
	 * Check whether or not a specific requested operation
	 * belongs to the set of operations specified for a
	 * resource in a capability
	 *
	 * @param ops the set of permitted ops
	 * @param the requested op
	 * @return truthy=belongs, falsy=does not belong
	 * returns set of ops in resource match or undefined
	 */
	var checkOp = function(ops, op) {
		if(ops && ((ops[0] == star) || contains(ops, op)))
			return ops;
	};

	/**
	 * Check whether or not the given resource set
	 * permits a specific operation on a specific resource
	 *
	 * @param resources the resource set
	 * @param exact the identifier of the requested resource
	 * @param op the requested operation
	 * @return truthy=permit, falsy=do not permit
	 * returns set of ops in resource match or undefined
	 */
	var tryExact = function(resources, exact, op) {
		var ops = resources[exact];
		return checkOp(ops, op);
	};

	/**
	 * Check whether or not the given resource set
	 * permits a specific operation on a resource namespace
	 *
	 * @param resources the resource set
	 * @param stem the namespace of the requested resource
	 * @param op the requested operation
	 * @return truthy=permit, falsy=do not permit
	 * returns set of ops in resource match or undefined
	 */
	var tryWildcard = function(resources, stem, op) {
		var ops = resources[stem + prefixedStar];
		return checkOp(ops, op);
	};

	/**
	 * Check whether or not the given resource set
	 * permits a specific operation on a resource
	 *
	 * @param resources the resource set
	 * @param request the requested resource
	 * @param operation the requested operation
	 * @return truthy=permit, falsy=do not permit
	 * returns set of ops in resource match or undefined
	 */
	var checkAccess = function(resources, request, operation) {
		var res;
		/* shortcircuit the typical case of a blanket capability */
		if (res = tryExact(resources, star, operation))
			return res;

		/* now try the most specific match first, since this is
		 * most likely to contain the operation in question */
		var candidateResource = request;
		if (res = tryExact(resources, candidateResource, operation))
			return res;

		/* loop through the '.'-delimited segments */
		var idx;
		while((idx = candidateResource.lastIndexOf('.')) >= 0) {
			candidateResource = candidateResource.substring(0, idx);
			if(res = tryWildcard(resources, candidateResource, operation))
				return res;
		}

		/* so there's nothing remaining except for '*', but we already
		 * checked that, so we're done. */
		return undefined;
	};

	/**
	 * Check whether or not this capability
	 * permits a specific operation on a resource
	 *
	 * @param resource the requested resource
	 * @param operation the requested operation
	 * @return truthy=permit, falsy=do not permit
	 * returns set of ops in resource match or undefined
	 */
	Capability.prototype.checkAccess = function(scope, resource, operation) {
		return (this.scope === scope) && checkAccess(this.resources, resource, operation);
	};

	/**
	 * Construct and return a capability that is a subset of
	 * this and the provided capability
	 *
	 * If requested is falsy, simply return this.
	 *
	 * Returns null if the two capabilities are not compatible.
	 */
	Capability.prototype.intersect = function(cap) {
		if(!cap) return this;
		var scope = this.scope;
		if(scope !== cap.scope) return null;
		var resources = this.resources;
		cap = cap.resources;

		var intersection = {};
		var intersectedOps;
		var nonempty = false;

		for(var res in cap) {
			var requestedOps = cap[res];
			/* intersect on exact resource match */
			if(res in resources) {
				intersectedOps = intersectOps(requestedOps, resources[res]);
				if(intersectedOps.length) {
					intersection[res] = intersectedOps;
					nonempty = true;
				}
				continue;
			}
			/* no exact match, try each requested op explicitly */
			var intersectedOps = [];
			requestedOps.forEach(function(op) {
				if(checkAccess(resources, res, op))
					intersectedOps.push(op);
			});
			if(intersectedOps.length) {
				intersection[res] = intersectedOps;
				nonempty = true;
			}
		}
		return nonempty ? new Capability(scope, intersection) : null;
	};

	Capability.prototype.union = function(cap) {
		if(!cap) return this;
		var scope = this.scope;
		if(scope !== cap.scope)
			throw new Error('Unable to union; incompatible scopes');

		var resources = Capability.normaliseResources(mixin(Object.create(null), this.resources, cap.resources));
		return new Capability(scope, resources);
	};

	function CapabilityGroup(items) {
		this.items = items;
	}
	Capability.CapabilityGroup = CapabilityGroup;

	CapabilityGroup.create = function(items) {
		return new CapabilityGroup(CapabilityGroup.normaliseItems(items));
	};

	CapabilityGroup.normaliseItems = function(items) {
		items.sort(function(x, y) { x = x.scope; y = y.scope; return (x > y) - (y > x); });
		return items;
	};

	CapabilityGroup.prototype.encode = function() {
		return JSON.stringify(this.items.map(function(item) { return item.preencode(); }))
	};

	CapabilityGroup.decodeParsed = function(parsed) {
		var items = parsed.map(Capability.decodeParsed);
		CapabilityGroup.normaliseItems(items);
		return new CapabilityGroup(items);
	};

	CapabilityGroup.validateParsed = function(parsed) {
		var items = parsed.map(Capability.validateParsed);
		CapabilityGroup.normaliseItems(items);
		return new CapabilityGroup(items);
	};

	CapabilityGroup.prototype.index = function() {
		var index = {};
		this.items.forEach(function(item) {
			index[item.scope || undefined] = item;
		});
		return index;
	};

	CapabilityGroup.prototype.intersect = function(cap) {
		var thisIndex = this.index(), capIndex = cap.index(), items = [];
		for(var scope in thisIndex) {
			if(scope in capIndex) {
				var intersection = thisIndex[scope].intersect(capIndex[scope]);
				if(intersection)
					items.push(intersection);
			}
		}
		return items.length ? new CapabilityGroup(CapabilityGroup.normaliseItems(items)) : null;
	};

	CapabilityGroup.prototype.checkAccess = function(scope, resource, operation) {
		var items = this.items;
		for(var i = 0; i < items.length; i++)
			if(items[i].checkAccess(scope, resource, operation))
				return true;
		return false;
	};

	return Capability;
})();
