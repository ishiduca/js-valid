(function (global) {
    'use strict'

    var isBrowser = !! global.self
    var isWorker  = !! global.WorkerLocation
    var isNodeJS  = !! global.global

    var keys = function (obj) {
        if (! Types.isObject(obj))
            throw new TypeError('typeof "object" must be "object"')

        var _keys = []
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) _keys.push(prop)
        }
        return _keys
    }

    var search = function (ary, find) {
        if (! Types.isArray(ary))
            throw new TypeError('typeof "array" must be "array"')

        for (var i = 0, len = ary.length; i < len; i++) {
            if (find(ary[i]) === true) return [ ary[i], i ] 
        }
    }

    var toString = Object.prototype.toString
    var Types = {}
    Types.isString = function (v) { return typeof v === 'string' }
    Types.isNumber = function (v) { return typeof v === 'number' }
    Types.isInt    = function (v) {
        return Types.isNumber(v) && v === parseInt(v, 10)
    }
    Types.isFunc   = function (v) { return typeof v === 'function' }
    Types.isUndef  = function (v) { return typeof v === 'undefined' }
    Types.isNull   = function (v) { return v === null }
    Types.isBool   = function (v) { return typeof v === 'boolean' }
    Types.isArray  = function (v) {
        return toString.call(v) === '[object Array]'
    }
    Types.isRegExp = function (v) {
        return toString.call(v) === '[object RegExp]'
    }
    Types.isObject = function (v) {
        return toString.call(v) === '[object Object]'
    }
    Types.isDate  = function (v) {
        return toString.call(v) === '[object Date]'
    }
    Types.isDom   = function (v) {
        return v && v.nodeName && (v.nodeType === 1 || v.nodeType === 3 || v.nodeType === 9)
    }

    var Empties = {
        isString: function (v) { return v === '' }
      , isNumber: function (v) { return v === 0 }
      , isArray:  function (v) { return v.length === 0 }
      , isObject: function (v) { return keys(v).length === 0 }
    }

    Types.isInt.empty = function (v) {
        return this(v) && Empties.isNumber(v)
    }

    search(keys(Empties), function (isType) {
        Types[isType].empty = function (v) {
            return this(v) && Empties[isType](v)
        }
    })

    function Valid (schema, stringify, parse) {
        this.init(schema, stringify, parse)
        return this
    }

    Valid.prototype.init = function (schema, stringify, parse) {
        if (! Types.isObject(schema))
            throw new Error('Valid.prototype.init required "schema" object')

        if (Types.isObject.empty(schema))
            throw new Error(
              'Valid.prototype.init required some "key" in "schema" object')

        this.serializer   = stringify || JSON.stringify
        this.deserializer = parse     || JSON.parse

        var that = this
        this.required  = {}
        this.types     = {}
        this.defaults  = {}
        this.validates = {}
        this.serialize = {}
        this.deserialize = {}

        search(keys(schema), function (key) {
            if (Types.isFunc(schema[key])) {
                schema[key] = { type: schema[key] }
            }

            var s = schema[key]

            if (! Types.isObject(s) || ! Types.isFunc(s.type)) {
                var mes = '"schema.' + key + '.type" must be "function"'
                throw new TypeError(mes)
            }

            that.types[key] = s.type

            if (s.required === true) {
                that.required[key] = true
            }

            if ('default' in s) {
                that.defaults[key] = s.default
            }

            if (Types.isFunc(s.validate) || Types.isRegExp(s.validate)) {
                that.validates[key] = _validate(s.validate)
            }

            if (Types.isFunc(s.serialize)) {
                that.serialize[key] = s.serialize
            }

            if (Types.isFunc(s.deserialize)) {
                that.deserialize[key] = s.deserialize
            }
        })

        return this
    }

    var _validate = function (valid) {
        return function (key, query) {
            var helper = function (v) {
                if (Types.isRegExp(valid)) {
                    if (false === valid.test(v))
                        throw new Error('"' + key + '" validate error')

                    return v
                }
                else {
                    return valid(v)
                }
            }

            if (Types.isArray(query[key])) {
                for (var i = 0, len = query[key].length; i < len; i++) {
                    query[key][i] = helper(query[key][i])
                }
            } else {
                query[key] = helper(query[key])
            }
        }
    }

    Valid.prototype.validate = function (query) {
        if (! Types.isObject(query))
            throw new TypeError('typeof "query" msut be "object"')

        search(keys(this.required), function (key) {
            if (!(key in query))
                throw new Error('required key "' + key + '" not found in query')
        })

        var that = this
        var q    = {}
        search(keys(query), function (key) {
            if (!(key in that.types))
                throw new Error('"' + key + '" not found in index of validator')

            q[key] = query[key]

            if (false === !! that.types[key](query[key])) {
                throw new TypeError('"' + key + ' type not match')
            }

            if (that.validates[key]) {
                that.validates[key](key, q)
            }
        })

        search(keys(this.defaults), function (key) {
            if (!(key in q)) {
                q[key] = Types.isFunc(that.defaults[key])
                       ? that.defaults[key](q)
                       : that.defaults[key]
            }
        })

        return q
    }

    Valid.prototype.stringify = function (queryObj) {
        if (! Types.isObject(queryObj))
            throw new Error('"query" must be "object"')

        var q = {}
        var that = this
        search(keys(queryObj), function (key) {
            q[key] = Types.isFunc(that.serialize[key])
                   ? that.serialize[key](queryObj[key])
                   : queryObj[key]
        })

        return this.serializer(q)
    }
    Valid.prototype.parse = function (queryStr) {
        if (! Types.isString(queryStr))
            throw new Error('"query" must be "string"')

        var q = this.deserializer(queryStr)
        var that = this
        search(keys(q), function (key) {
            if (Types.isFunc(that.deserialize[key]))
                q[key] = that.deserialize[key](q[key])
        })

        return q
    }

    Valid.Types = Types

    if (isNodeJS) {
        module.exports = Valid
        Valid.Valid = Valid
    }

    global.Valid = Valid

})(this.self || global)
