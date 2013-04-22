(function (define) {
    define([], function () {
        "use strict";

        var each = function (arry, fn) {
            for (var i = 0, len = arry.length; i < len; i++) {
                if (fn(arry[i], i)) return;
            }
        };

        var Validator = function (schema) {
            if (Validator.Types.Undef(schema) ||
                Validator.Types.Null(schema)
            ) {
                throw new Validator.Errors.SchemaReferenceError(
                  '"schema" not found');
            }

            if (Validator.Types.Empty(schema)) {
                throw new Validator.Errors.SchemaEmptyError(
                  '"schema" has not properties');
            }

            if (! Validator.Types.Mixed(schema)) {
                throw new Validator.Errors.SchemaTypeError(
                  '"schema" must be a object');
            }

            this.index     = {};
            this.required  = {};
            this.defaults  = {};
            this.validates = {};
            //this.serialize = {};

            var key, maybeError;
            for (key in schema) {
                if (schema.hasOwnProperty(key)) {
                    maybeError = _map(this, key, schema[key]);

                    if (maybeError instanceof Error) {
                        throw maybeError;
                    }
                }
            }
        };

        var _map = function _map (that, key, opt) {
            if (Validator.Types.Undef(opt) ||
                Validator.Types.Null(opt)
            ) {
                return new Validator.Errors.SchemaReferenceError(
                  '"schema.' + key + '" look like "null"');
            }

            // shorten -> lengthen
            if (Validator.Types.Function(opt)) {
                opt = {type: opt};
            }
            if (! Validator.Types.Mixed(opt) ||
                ! Validator.Types.Function(opt.type)
            ) {
                return new Validator.Errors.SchemaDefineError(
                  '"schema.' + key + '.type" is necessary to be able to determine the type');
            }

            // set this.index
            each([
                    [ String,   'String' ]
                  , [ Number,   'Number' ]
                  , [ Boolean,  'Boolean' ]
                  , [ Array,    'Array' ]
                  , [ Date,     'Date' ]
                  , [ Function, 'Function' ]
                  , [ RegExp,   'RegExp' ]
                ]
              , function (types) {
                    if (opt.type === types[0]) {
                        that.index[key] = Validator.Types[types[1]];
                        return true;
                    }
            });
            if (! that.index[key]) that.index[key] = opt.type;

            // set that.required
            if (true === opt.required) that.required[key] = true;

            // set that.defaults
            if ('default' in opt) that.defaults[key] = opt['default'];

            // sete that.validates
            that.validates[key] = function (v) {

                var helper = function (validate, v) {
                    return   Validator.Types.Function(validate)
                           ? validate(v)
                           : Validator.Types.RegExp(  validate)
                           ? validate.test(v)
                           : true
                    ;
                };

                if (that.index[key] === Validator.Types.Array) {
                    for (var i = 0, len = v.length; i < len; i++) {
                        if (! helper(opt.validate, v[i])) return false;
                    }
                    return true;
                }

                return helper(opt.validate, v);
            };
        };

        Validator.prototype.validate = function (query) {
            if (Validator.Types.Undef(query) ||
                Validator.Types.Null( query)
            ) {
                query = {};
            }

            if (! Validator.Types.Mixed(query)) {
                throw new Validator.Errors.QueryTypeError(
                  '"query" must be a object');
            }

            for (var key in this.required) {
                if (!(key in query)) {
                    throw new Validator.Errors.QueryRequiredError(
                      '"' + key + '" not found in query');
                }
            }

            var validated = {}; // new Validated;

            for (var key in query) {
                validated[key] = query[key];

                if (!(key in this.index)) {
                    throw new Validator.Errors.QueryIndexError(
                      '"' + key + '" can not validate');
                }

                if (! this.index[key]( validated[key] )) {
                    throw new Validator.Errors.ValidateTypeError(
                      '"' + key + '" type not match');
                }

                if (! this.validates[key]( validated[key] )) {
                    throw new Validator.Errors.ValidateError(
                      '"' + key + '" validate error');
                }
            }

            for (var key in this.defaults) {
                if (!(key in validated)) {
                    var _ = this.defaults[key];
                    validated[key] = Validator.Types.Function(_)
                        ? _(this, validated)
                        : _
                    ;

                    if (! this.index[key]( validated[key] )) {
                        throw new Validator.Errors.ValidateTypeError(
                          '"' + key + '" type not match');
                    }

                    if (! this.validates[key]( validated[key] )) {
                        throw new Validator.Errors.ValidateError(
                          '"' + key + '" validate error');
                    }
                }
            }

            return validated;
        };

        Validator.Types = {
            'Undef' :   function (v) { return 'undefined' === typeof v}
          , 'Null':     function (v) { return null === v}
          , 'String':   function (v) { return 'string'   === typeof v}
          , 'Number':   function (v) { return 'number'   === typeof v}
          , 'Boolean':  function (v) { return 'boolean'  === typeof v}
          , 'Function': function (v) { return 'function' === typeof v}
          , 'Object':   function (v) { return ! Validator.Types.Null(v) &&
                                              'object' === typeof v
                        }
          , 'Date':     function (v) { return v instanceof Date }
          , 'Array':    function (v) { return v instanceof Array }
          , 'RegExp':   function (v) { return v instanceof RegExp }
          , 'Mixed':    function (v) { return  Validator.Types.Object(v) &&
                                            (! Validator.Types.Date(v)) &&
                                            (! Validator.Types.Array(v)) &&
                                            (! Validator.Types.RegExp(v));
                        }
          , 'Empty':    function (v) { return Validator.Types.Mixed(v) &&
                                              Object.keys(v).length === 0;
                        }
          , 'Int':      function (v) { return Validator.Types.Number(v) &&
                                              v === parseInt(v);
                        }
        };



        Validator.Errors = {};
        each([
            [ 'SchemaReferenceError', ReferenceError ]
          , [ 'SchemaEmptyError', Error ]
          , [ 'SchemaTypeError', TypeError ]
          , [ 'SchemaDefineError', TypeError ]
          , [ 'QueryReferenceError', ReferenceError ]
          , [ 'QueryTypeError', TypeError ]
          , [ 'QueryRequiredError', Error ]
          , [ 'QueryIndexError', Error ]
          , [ 'ValidateTypeError', TypeError ]
          , [ 'ValidateError', Error ]
        ], function (err, i) {
            Validator.Errors[err[0]] = function (message) {
                this.name = err[0];
                this.message = message || this.name;
            };
            Validator.Errors[err[0]].prototype = new err[1];
        });

        return Validator;
    });
})(
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
  : function (deps, fact) { this.Validator = fact() }
)
;
