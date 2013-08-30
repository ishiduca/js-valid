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

    var Types = Valid.Types
    QUnit.module('Valid.Types で Typing test')
    test('Types.isString', function () {
        ok(Types.isString(''))
        ok(Types.isString('hoge'))
        ok(Types.isString('0'))
        ok(Types.isString((0).toString()))
    })
    test('Types.isString.empty', function () {
        ok(Types.isString.empty(''))
        ok(! Types.isString.empty())
        ok(! Types.isString.empty(null))
        ok(! Types.isString.empty('0'))
    })
    test('Types.isNumber', function () {
        ok(Types.isNumber(0))
        ok(Types.isNumber(1))
        ok(Types.isNumber(-1))
        ok(Types.isNumber(Number("-1.2")))
        ok(! Types.isNumber())
        ok(! Types.isNumber('1'))
    })
    test('Types.isNumber.empty', function () {
        ok(Types.isNumber.empty(0))
        ok(! Types.isNumber.empty())
        ok(! Types.isNumber.empty(null))
        ok(! Types.isNumber.empty('0'))
    })
    test('Types.isInt', function () {
        ok(Types.isInt(1))
        ok(Types.isInt(0))
        ok(Types.isInt(-1))
        ok(! Types.isInt(0.1))
        ok(! Types.isInt(-0.1))
    })
    test('Types.isInt.empty', function () {
        ok(Types.isInt.empty(0))
        ok(! Types.isInt.empty())
        ok(! Types.isInt.empty(null))
        ok(! Types.isInt.empty('0'))
    })
    test('Types.isUndef', function () {
        ok(Types.isUndef())
        ok(Types.isUndef(undefined))
        ok(! Types.isUndef(null))
    })
    test('Types.isBool', function () {
        ok(Types.isBool(true))
        ok(Types.isBool(false))
        ok(Types.isBool(Boolean(1)))
        ok(Types.isBool(Boolean(0)))
        ok(! Types.isBool())
        ok(! Types.isBool(null))
        ok(! Types.isBool(0))
        ok(! Types.isBool(1))
    })
    test('Types.isFunc', function () {
        ok(Types.isFunc(function () {}))
        ok(Types.isFunc(Boolean))
    })
    test('Types.isArray', function () {
        ok(Types.isArray([]))
        ok(Types.isArray([1]))
        ok(Types.isArray(new Array))
        ok(Types.isArray(Array.prototype))
    })
    test('Types.isRegExp', function () {
        ok(Types.isRegExp(/^$/))
        ok(Types.isRegExp(new RegExp('hoge', 'i')))
    })
    test('Types.isObject', function () {
        ok(Types.isObject({}))
        ok(Types.isObject(new Object()))
        ok(! Types.isObject())
        ok(! Types.isObject(null))
        ok(! Types.isObject([]))
        ok(! Types.isObject(/reg/))
        ok(! Types.isObject(new Date))
    })
    test('Types.isDate', function () {
        ok(Types.isDate(new Date(0)))
        ok(Types.isDate(new Date))
    })
})(this.self || global)
