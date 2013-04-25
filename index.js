! function (define) {
    define([], function () {
        "use strict";

        var isUnd  = function (n) { return 'undefined' === typeof n; };
        var isNull = function (n) { return n === null; }
        var isStr  = function (n) { return 'string' === typeof n;  };
        var isNum  = function (n) { return 'number' === typeof n;  };
        var isBool = function (n) { return 'boolean' === typeof n; };
        var isFunc = function (n) { return 'function' === typeof n;};
        var isObj  = function (n) {
            return ! isNull(n) && 'object' === typeof n;
        };
        var likeArray = function (n) {
            return isObj(n) &&
                   'number'   === typeof n.length &&
                   'function' === typeof n.splice
            ;
        };
        var likeRegExp = function (n) {
            return (isObj(n) || isFunc(n)) &&
                   'function' === typeof n.test &&
                   'function' === typeof n.exec
            ;
        };
        var likeDate = function (n) {
            return (isObj(n)) &&
                   'function' === typeof n.getFullYear &&
                   'function' === typeof n.toUTCString
            ;
        };

        var search = function (obj, cb) {
            var keys = Object.keys(obj), i = 0, len = keys.length;
            for (; i < len; i++) {
                if (true === cb(keys[i], obj[keys[i]]))
                    return [ keys[i], obj[keys[i]] ];
            }
            return null;
        };

        var some = {};

        some.Validator = function (schema) {
            if (isUnd(schema) || isNull(schema)) {
                throw new Error('"schema" look like "null"');
            }
            if (! isObj(schema)) {
                throw new TypeError('"schema" must be a "object"');
            }

            if (likeArray(schema)) {
                throw new TypeError(
                  '"schema" must be a "object". be not "array"');
            }
            if (likeRegExp(schema)) {
                throw new TypeError(
                  '"schema" must be a "object". be not "regexp"');
            }
            if (likeDate(schema)) {
                throw new TypeError(
                  '"schema" must be a "object". be not "date"');
            }
            if (Object.keys(schema).length === 0) {
                throw new Error('"schema" is empty');
            }

            this.index    = {};
            this.required = {};
            this.validates = {};
            this.defaults = {};
            this.serializes = {};
            this.deserializes = {};

            var that = this;
            search(schema, function (optionKey, option) {
                _map(that, optionKey, option);
            });
        };

        var _map = function (validator, optionKey, option) {
            if (isUnd(option) || isNull(option)) {
                throw new Error(
                  '"schema.' + optionKey + '" look like "null"');
            }

            if (isFunc(option)) option = {type: option};
            if (! isObj(option) || ! isFunc(option.type)) {
                throw new TypeError(
                  '"schema.type" must be "TypingFunction"');
            }

            validator.index[optionKey] = option.type;
            option.required === true &&
              (validator.required[optionKey] = true);
            'default' in option &&
              (validator.defaults[optionKey] = option.default);

            validator.validates[optionKey] = function (val) {
                var helper = function (validate, v) {
                    return isFunc(validate)
                          ? validate(v)
                          : likeRegExp(validate)
                          ? validate.test(v)
                          : true
                    ;
                };

                if (likeArray(val)) {
                    for (var i = 0, len = val.length; i < len; i++) {
                        if (false === helper(option.validate, val[i])) {
                            return false;
                        }
                    }
                    return true;
                }

                return helper(option.validate, val);
            };

            'function' === typeof option.serialize &&
              (validator.serializes[optionKey] = option.serialize);

            'function' === typeof option.deserialize &&
              (validator.deserializes[optionKey] = option.deserialize);
        };

        var vp = some.Validator.prototype;

        vp.validate = function (query) {
            (isNull(query) || isUnd(query)) && (query = {});

            if (! isObj(query)) {
                throw new TypeError('"query" must be a "object"');
            }

            if (likeArray(query)) {
                throw new TypeError(
                  '"query" must be a "object". be not "array"');
            }
            if (likeRegExp(query)) {
                throw new TypeError(
                  '"query" must be a "object". be not "regexp"');
            }
            if (likeDate(query)) {
                throw new TypeError(
                  '"query" must be a "object". be not "date"');
            }

            var newQuery = {}, that = this;

            search(this.required, function (key) {
                if (!(key in query)) {
                    throw new Error('RequiredError: "'+ key +'" not found');
                }
            });

            search(query, function (key, val) {
                if (!(key in that.index)) {
                    throw new Error(
                      'IndexError: "' + key + '" can not validate');
                }

                if (! that.index[key]( query[key] )) {
                    throw new TypeError(
                      'TypeError: "' + key + '" type not match');
                }

                if (! that.validates[key]( query[key] )) {
                    throw new Error(
                      'ValidateError: "' + key + '" validate failure');
                }

                newQuery[key] = query[key];
                
            });

            search(this.defaults, function (key, def) {
                if (!(key in newQuery)) {
                    //newQuery[key] = isFunc(def) ? def(newQuery) : def;
                    newQuery[key] = isFunc(def) ? def(query) : def;
                }

                if (! that.index[key]( newQuery[key] )) {
                    throw new TypeError(
                      'TypeError: "' + key + '" type not match');
                }

                if (! that.validates[key]( newQuery[key] )) {
                    throw new Error(
                      'ValidateError: "' + key + '" validate failure');
                }

            });

            return newQuery;
        };

        vp.stringify = function (query, serializer) {
            isFunc(serializer) || (serializer = JSON.stringify);

            var newQuery;
            try {
                newQuery = this.validate(query);

                search(this.serializes, function (key, cast) {
                    if (key in newQuery) {
                        newQuery[key] = cast(newQuery[key]);
                    }
                });
            } catch (e) {
                throw e;
            }

            return serializer(newQuery);
        };

        vp.parse = function (queryStr, deserializer) {
            isFunc(deserializer) || (deserializer = JSON.parse);

            var queryObj; try {
                queryObj = deserializer(queryStr);
            } catch (e) {
                throw e;
            }

            if (! isObj(queryObj)) throw new TypeError(
              'ParseError: "query" can not parse');

            search(this.deserializes, function (key, decast) {
                if (key in queryObj) {
                    queryObj[key] = decast(queryObj[key]);
                }
            });

//            try {
//				this.validate(queryObj);
//			} catch (e) {
//				throw e;
//			}
//
//            return queryObj;
			return this.validate(queryObj);
        };

        return some;
    });
}(
// AMD - RequireJS
    ('function' === typeof define &&
     'function' === typeof requirejs)
   ? define
// CommonJS - node.js
     : ('undefined' !== typeof module &&
        module.exports &&
        'function' === typeof require)
     ? function (deps, fact) { module.exports = fact() }
 // window === this
   : function (deps, fact) { this.some = fact() }
);


