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

    QUnit.module('load modules - "QUnit", "Valid"')
    test('', function () {
        ok(QUnit, 'load ok "QUnit"')
        ok(Valid, 'load ok "Valid"')
    })
})(this.self || global)
