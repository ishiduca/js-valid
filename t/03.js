(function (global) {
    'use strict'

    var isBrowser = !! global.self
    var isWorker  = !! global.WorkerLocation
    var isNodeJS  = !! global.global

    var path
    if (isNodeJS) {
        path = require('path')
        global.QUnit = require(path.join( __dirname, 'qunit/driver')).QUnit
        global.Valid = require(path.join( __dirname, '../lib/valid'))
    }

    var stringify = function (obj) {
        var a = []
        for (var p in obj) {
            if (obj.hasOwnProperty(p))
                a.push([p, obj[p]].join('='))
        }
        return a.join('&')
    }
    var parse = function (str) {
        var o = {}
        var a = str.split('&')
        for (var i = 0, len = a.length, pair; i < len; i++) {
            pair = a[i].split('=')
            o[pair[0]] = pair[1]
        }
        return o
    }

    QUnit.module('vadateしたqueryのシリアライズとデシリアライズ', {
        setup: function () {
            this.schema = {
                foo: {
                    type: Valid.Types.isString
                  , serialize: encodeURIComponent
                  , deserialize: decodeURIComponent
                }
              , bar: {
                    type: Valid.Types.isDate
                  , serialize: function (v) { return v.toString() }
                  , deserialize: function (v) {
                        return new Date(v)
                    }
                }
            }
        }
    })
    test('serialize = JSON.stringify, deserialize = JSON.parse', function () {
        var v = new Valid(this.schema)

        var query  = {foo: 'あ'}
        var res = v.validate(query)
        deepEqual(res, {foo: 'あ'}, JSON.stringify(res))

        var serialized = v.stringify(res)
        is(serialized, JSON.stringify({foo: '%E3%81%82'}), serialized)

        var deserialized = v.parse(serialized)
        deepEqual(deserialized, res, JSON.stringify(deserialized))
    })
    test('serialize = stringify, deserialize = parse', function () {
        var v = new Valid(this.schema, stringify, parse)

        var query  = {foo: 'あ'}
        var res = v.validate(query)
        deepEqual(res, {foo: 'あ'}, JSON.stringify(res))

        var serialized = v.stringify(res)
        is(serialized, 'foo=%E3%81%82', serialized)

        var deserialized = v.parse(serialized)
        deepEqual(deserialized, res, JSON.stringify(deserialized))
    })
    test('日付オブジェクトのシリアライズとデシリアライズ', function () {
        var v = new Valid(this.schema)

        var d = new Date(0)
        var query = {bar: d}
        
        var res = v.validate(query)
        deepEqual(res, {bar: d}, JSON.stringify(res))

        var serialized = v.stringify(res)
        is(serialized, '{"bar":"' + d.toString() + '"}', serialized)

        var deserialized = v.parse(serialized)
        deepEqual(deserialized, res, JSON.stringify(deserialized))
    })
})(this.self || global)
