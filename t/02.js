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
    QUnit.module('new Valid(schema) で validator オブジェクトを生成する')
    test('schema に不正があった場合、エラーを投げるか', function () {
        throws(function () { new Valid() }
        , /required "schema" object/
        , 'new Valid() -> schema がないのでエラー')

        throws(function () { new Valid(null) }
        , /required "schema" object/
        , 'new Valid(null) -> schema が null なのでエラー')

        throws(function () { new Valid({}) }
        , /required some "key" in "schema" object/
        , 'new Valid({}) -> schema が isEmpty なのでエラー')

        throws(function () { new Valid(1) }
        , /required "schema" object/
        , 'new Valid(1) -> schema がオブジェクトではないのでエラー')

        throws(function () { new Valid("1") }
        , /required "schema" object/
        , 'new Valid("1") -> schema がオブジェクトではないのでエラー')

        throws(function () { new Valid([1]) }
        , /required "schema" object/
        , 'new Valid([1]) -> schema がオブジェクトではないのでエラー')

        throws(function () { new Valid(new Date) }
        , /required "schema" object/
        , 'new Valid(new Date) -> schema がオブジェクトではないのでエラー')

        throws(function () { new Valid({foo: 'notTypingFunction'}) }
        , /"schema.foo.type" must be "function"/
        , 'newa Valid({foo: "notTypingFunction"} -> schema.foo がオブジェクトではないのでエラー')
    })

    test('valid = new Valid({shortKey: func})', function () {
        var v = new Valid({shorten1: Types.isString})
        ok(v, 'valid = new Valid({shorten1: func})')
        ok(v.validate, 'valid.validate')
        var res= v.validate({shorten1: 'short'})
        is(res.shorten1, 'short'
          , '{shorten1: "short"} = valid.validate({shorten1: "short"})')
    })

    QUnit.module('valid.valiate(query)で queryの妥当性確認（と変更）を行う')
    test('valid.validate(query) - schemaで登録していないkeyがあったらエラーを投げる', function () {
        var v = new Valid({foo: Types.isString})

        throws(function () {v.validate({bar: 'not found "foo"'})}
        , /"bar" not found in index of validator/
        , '"bar" はkeyとして登録されていない')

        var tt = function (q, foo, keys, mes) {
            var res = v.validate(q)
            is(res.foo, foo, mes)
            deepEqual(Object.keys(res), keys, JSON.stringify(keys))
        }

        tt({foo: 'bar'}, 'bar', ['foo'], '{foo: "bar"} = valid.validate({foo: "bar"})')
        tt({}, undefined, [], '{} = valid.validate({})')
    })
    test('valid.validate(query) - schemaでrequired指定したkeyが無かったらエラーを投げる', function () {
        var v = new Valid({foo: {type: Types.isString, required: true}})

        throws(function () {v.validate({})}
        , /required key "foo" not found in query/
        , '必須keyの "foo" がない')

        var res = v.validate({foo: 'bar'})
        is(res.foo, 'bar', '{foo: "bar"} = valid.validate({foo: "bar"})')
        deepEqual(Object.keys(res), ['foo'], JSON.stringify(Object.keys(res)))
    })
    test('valid.validate(query) - schemaで登録したkeyが無く、default値が設定されていた場合、その値を使う', function () {
        var v = new Valid({foo: {type: Types.isString, default: 'DefaultValue'}})

        var tt = function (q, foo, keys, mes) {
            var res = v.validate(q)
            is(res.foo, foo, mes)
            deepEqual(Object.keys(res), keys, JSON.stringify(keys))
        }

        tt({foo: 'hoge'}, 'hoge', ['foo'], '{foo: "hoge"} = valid.validate({foo: "hoge"})')
        tt({foo: ''}, '', ['foo'], '{foo: ""} = valid.validate({foo: ""})')
        tt({}, 'DefaultValue', ['foo'], '{foo: "DefaultValue"} = valid.validate({})')
    })
    test('valid.validate(query) - schemaで登録したkeyが無く、defaultコールバックが設定されていた場合、その関数が返す値を使う', function () {
        var v = new Valid({
            foo: {
                type: Types.isInt
              , default: function (query) {
                    return query.bar + 1
                }
            }
          , bar: {
                type: Types.isInt
              , required: true
            }
        })

        var tt = function (q, foo, bar, keys, mes) {
            var res = v.validate(q)
            is(res.foo, foo, mes)
            is(res.bar, bar, mes)
            deepEqual(Object.keys(res).sort(), keys, JSON.stringify(keys))
        }

        tt({bar: 1, foo: -1}, -1, 1, ['bar', 'foo'], '{bar: 1, foo: -1} = valid.validate({bar: 1, foo: -1})')
        tt({bar: 1}, 2, 1, ['bar', 'foo'], '{bar: 1, foo: 2} = valid.validate({bar: 1})')
    })

    QUnit.module('valid.validate(query) で 細かいValidationや値の変更を行う')
    test('valid.validete(badQuery) - validate メソッドを使って、範囲外の値が渡された時にエラーを投げるようにする', function () {
        var v = new Valid({
            foo: { type: Types.isInt
                 , validate: function (v) {
                    if (v > 10 || v < 1)
                        throw new Error('query.foo must be between 1 and 9')
                    return v
        }}})

        throws(function () { v.validate({foo: 0}) }
        , /between 1 and 9/
        , 'fooの値が 1~9 に該当していないので validate で定義したエラーを投げる')

        var res = v.validate({foo: 1})
        is(res.foo, 1, '{foo: 1} = valid.validate({foo: 1})')
        deepEqual(Object.keys(res), ['foo'], JSON.stringify(Object.keys(res)))
    })
    test('valid.validate(query) - validateメソッドで queryの値を自動的に別の値に', function () {
        var v = new Valid({
            foo: {
                type: Types.isInt
              , default: function (query) { return query.bar + 1 }
            }
          , bar: {
                type: Types.isInt
              , required: true
              , validate: function (v) { return v * 2 }
            }
        })

        var res = v.validate({bar: 7})
        is(res.bar, 14)
        is(res.foo, 15)
        deepEqual(Object.keys(res).sort(), ['bar', 'foo']
          , '{bar: 14, foo: 15} = valid.validate({bar: 7})')
    })
    test('validateメソッドで、配列内の値をValidateする', function () {
        var v = new Valid({
            foo: {
                type: Types.isArray
              , required: true
              , validate: function (v) {
                    if (v < 0) throw new RangeError('"' + v + '" is under 0')
                    return v * 2
                }
            }
        })

        throws(function () {v.validate({foo: [1, 0, -1]})}
        , /"-1" is under 0/
        , '配列の中に0未満の値がある')

        var res = v.validate({foo: [0, 1, 2]})
        deepEqual(res.foo, [0, 2, 4], JSON.stringify(res.foo))
        deepEqual(Object.keys(res), ['foo']
        , '{foo: [ 0, 2, 4 ]} = valid.validate({foo: [ 0, 1, 2 ]})')
    })

})(this.self || global)
