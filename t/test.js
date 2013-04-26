! function (BASIC_TEST, NODE_TEST, DOM_TEST) {
    var modulePath = {
        baseUrl: '../'
      , file: 'index'
      , underscore: './t/js/underscore-min'
    };

// AMD - RequireJS
    if ('function' === typeof define &&
        'function' === typeof requirejs
    ) {

        requirejs.config({
            baseUrl: modulePath.baseUrl
        });
        requirejs([ modulePath.file, './t/js/underscore-min' ]
        , function (_some) {
            QUnit.start();
            BASIC_TEST(_some, {QUnit: QUnit});
            NODE_TEST( _some, {QUnit: QUnit, under: this._});
            DOM_TEST(  _some, {QUnit: QUnit, under: this._});
        });

    } else

// CommonJS - node.js
    if ('undefined' !== typeof module &&
        module.exports &&
        'function' === typeof require
    ) {

        (function () {
            var path  = require('path');
            var QUnit = require(path.join(
                          __dirname, './qunit/helper'
                      )).QUnit;

            var _some = require(path.join(
                          __dirname
                        , modulePath.baseUrl
                        , modulePath.file
                      ));

            var under = require(path.join(
                          __dirname, './js/underscore-min' ));

            BASIC_TEST(_some, {QUnit: QUnit});
            NODE_TEST( _some, {QUnit: QUnit, under: under});
       })();

    }

// this === window
    else {

        (function (g) {
            BASIC_TEST(g.some, {QUnit: QUnit})
            NODE_TEST( g.some, {QUnit: QUnit, under: g._});
            DOM_TEST(  g.some, {QUnit: QUnit, under: g._});
        })(this);

    }

}(
// テスト本体
function BASIC_TEST (some, opt) {

    var is = opt.QUnit.strictEqual;
    var module = opt.QUnit.module;

    var each = function (ary, cb) {
        for (var i = 0, len = ary.length; i < len; i++) {
            if (cb(ary[i], i) === true) return [ ary[i], i ];
        }
        return null;
    };

    // test *******************************************
    module('load test');
    test('load some & some.Validator', function () {
        ok(some);
        is( typeof some.Validator, 'function');
    });

    module('validator = new some.Validator(schema)');
    test('error cases', function () {
        var Valid = some.Validator;

        each([ , null ], function (likeNull) {
            throws(
                function () { new Valid(likeNull); }
              , /"schema" look like "null"/
            );
        });

        each([
            'string'
          , 0
          , false
          , function () {}
        ]
        , function (notObject) {
            throws(
                function () { new Valid(notObject); }
              , /"schema" must be a "object"/
            );
        });

        each([
            [ {},    /"schema" is empty/ ]
          , [ [],    /be not "array"/  ]
          , [ /reg/, /be not "regexp"/ ]
          , [ new Date, /be not "date"/ ]
        ]
        , function (cases) {
            throws(
                function () { new Valid(cases[0]); }
              , cases[1]
            );
        });

        each([
            {foo: 'not TypingFunction'}
          , {foo: {type: 'not TypingFunction'} }
          , {foo: {}}
        ]
        , function (hasNoTypingFunction) {
            throws(
                function () { new Valid(hasNoTypingFunction) }
              , /"schema.type" must be "TypingFunction"/
            );
        });
    });
    test('success cases', function () {
        var Valid = some.Validator;
        var dumm  = function (val) { return true; };
        ok(new Valid({foo: dumm}));
        ok(new Valid({foo: {type: dumm}}));
    });

    module('method - validate, stringify, parse');
    test('exists', function () {
        var valid = new some.Validator({foo: function () { return true; }});

        each([
            valid.validate
          , valid.stringify
          , valid.parse
        ]
        , function (method) {
            ok( method );
            is( typeof method, 'function' );
        });
    });

    module('validated = validator.validate(query)');
    test('validator.validate(badQuery)', function () {
        var valid = new some.Validator({foo: function () { return true; }});

        each([
            'string'
          , 0
          , false
          , function () {}
        ]
        , function (notObject) {
            throws(
                function () { valid.validate(notObject); }
              , /"query" must be a "object"/
            );
        });

        each([
            [ [],    /be not "array"/  ]
          , [ /reg/, /be not "regexp"/ ]
          , [ new Date, /be not "date"/ ]
        ]
        , function (cases) {
            throws(
                function () { valid.validate(cases[0]); }
              , cases[1]
            );
        });
    });

    test('validator.validte(query) - IndexError', function () {
        var valid = new some.Validator({foo: function () { return true }});

        throws(
            function () { valid.validate({noIndexKey: true}) }
          , /IndexError.+can not validate/
        );

        each([ {}, {foo: true} ], function (okCase) {
            ok( valid.validate(okCase) );
            deepEqual(valid.validate(okCase), okCase);
        });
    });

    test('validator.validate(query) - RequiredError', function () {
        var valid = new some.Validator({
            noRequireKey: function () { return true }
          , requireKey: {
                type: function () { return true }
              , required: true
            }
        });

        each([
            null
          , {}
          , {noRequireKey: true}
        ]
        , function (errorCase) {
            throws(
                function () { valid.validate(errorCase) }
              , /RequiredError.+not found/
            );
        });

        ok(valid.validate({requireKey: 0}));
        deepEqual(valid.validate({requireKey: 0}), {requireKey: 0});
    });

    test('validator.validate(query) - ValidateError', function () {
        ! function () {
            var valid = new some.Validator({
                foo: {
                    type: function (v) { return 'number' === typeof v; }
                  , validate: function (v) { return v >= 0; }
                }
            });

            throws(
                function () { valid.validate({foo: -1}) }
              , /ValidateError.+fail/
            );

            ok(valid.validate({foo: 0}));
            deepEqual(valid.validate({foo: 9.9}), {foo: 9.9});
        }();

        ! function () {
            var valid = new some.Validator({
                arry: {
                    type: function () { return true; }
                  , validate: function (v) {
                        return 'number' === typeof v && parseInt(v) === v;
                    }
                }
            });

            throws(
                function () { valid.validate({arry: [ 0, -2, 1, -0.3 ]}) }
              , /ValidateError/
            );

            ok(valid.validate({arry: [ 0, 1, 2, 3, -4 ]}));
            deepEqual(
                valid.validate({arry: [ 0, 1, 2, 3, -4 ]})
              , {arry: [ 0, 1, 2, 3, -4]}
            );
        }();
    });

    test('validator.validate(query) - default', function () {
        ! function () {
            var valid = new some.Validator({
                foo: {
                    type: function (v) { return 'number' === typeof v; }
                  , default: 44
                }
            });

            each([
                [ {}, {foo: 44} ]
              , [ {foo: 3}, {foo: 3} ]
            ]
            , function (querys) {
                ok(valid.validate(querys[0]));
                deepEqual(valid.validate(querys[0]), querys[1]);
            });
        }();

        ! function () {
            var valid = new some.Validator({
                foo: {
                    type: function (v) {
                        return 'number' === typeof v &&
                               v === parseInt(v);
                    }
                  , required: true
                }
              , bar: {
                    type: function (v) {
                        return 'number' === typeof v &&
                               v === parseInt(v);
                    }
                  , default: function (query) {
                        return query.foo + 1;
                    }
                }
            });

            each([
                [ {foo: 1}, {foo: 1, bar: 2} ]
              , [ {foo: 99, bar: 0}, {foo: 99, bar: 0} ]
            ]
            , function (querys) {
                ok(valid.validate(querys[0]));
                deepEqual(valid.validate(querys[0]), querys[1]);
            });
        }();
    });

    module('validator.stringify(query), validator.parse(querystr)');
    test('case1', function () {
        var valid = new some.Validator({
            foo: {
                type: function (v) { return true; }
              , default: function () {
                    return new Date(100);
                }
              , serialize: function (v) {
                    return Number(v);
                }
              , deserialize: function (numb) {
                    return new Date(numb);
                }
            }
        });

        var query = {foo: new Date(100)};
        ok(valid.validate());
        deepEqual(valid.validate(), query);

        var serialized;
        is( serialized = valid.stringify(), JSON.stringify({foo: 100}));

        deepEqual(valid.parse( serialized ), query);
    });

    test('case2', function () {
        var now = new Date();
        var valid = new some.Validator({
            foo: {
                type: function (v) { return true; }
              , default: function () {
                    return now;
                }
              , serialize: function (v) {
                    return Number(v);
                }
              , deserialize: function (numb) {
                    return new Date(numb);
                }
            }
        });

        var query = {foo: now};
        ok(valid.validate());
        deepEqual(valid.validate(), query);

        var serialized = valid.stringify();
        deepEqual(valid.parse( serialized ), query);
    });
}
,
function NODE_TEST (some, opt) {
    test('dependence - underscore.js', function () {
        var valid = new some.Validator({
            foo: {
                type: opt.under.isDate
              , default: function () {
                    return new Date;
                }
            }
        });

        ok(valid);

        throws(
            function () { valid.validate({foo: 'hoge'}) }
          , /TypeError/
        );

        deepEqual(
            valid.validate({foo: new Date(100) })
          , {foo: new Date(100)}
        );

    });
}
,
function DOM_TEST (some, opt) {
    var each = function (ary, cb) {
        for (var i = 0, len = ary.length; i < len; i++) {
            if (cb(ary[i], i) === true) return [ ary[i], i ];
        }
        return null;
    };

    module('form data validate', {
        setup: function () {
            var app = this.app = {};
            app.rule = new some.Validator({
                email: {
                    type: opt.under.isString
                  , required: true
                  , validate: /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/
                }
              , pwd: {
                    type: opt.under.isString
                  , required: true
                  , validate: /^\w{4,36}$/
                }
              , newAccount: {
                    type: opt.under.isBoolean
                  , default: false
                }
            });
            app.getQuery = function () {
                return {
                   email: $('#email').val()
                 , pwd:   $('#pwd').val()
                 , newAccount: $('#create').is(':checked')
                };
            };
            app.setForm = function (email, pwd, _create) {
                $('#email').val(email);
                $('#pwd').val(pwd);
                _create === true && $('#create').attr('checked', true);
            };
        }
      , teardown: function () {
            $('#emai').val('');
            $('#pwd').val('');
            $('#create').attr('checked', false);
        }
    });
    test('form validate - cases error', function () {
        var app = this.app;

        var errors = [
            /ValidateError.+email/
          , /ValidateError.+pwd/
          , /ValidateError.+email/
        ]
        , count = 0;

        $('#F').on('submit', function () {
            throws(
                function () { app.rule.validate(app.getQuery()); }
              , errors[count++]
            );
            opt.QUnit.start();
        });

        each([
            [ '', 'foofoo' ]
          , [ 'hoge@ho.ge', '' ]
          , [ 'hoge_ho.ge', 'bobooo' ]
        ]
        , function (q) {
            app.setForm.apply(app, q);
            opt.QUnit.stop();
            $('#F').submit();
        });
    });
    test('form validate - cases ok', function () {
        var app = this.app;

        $('#F').on('submit', function () {
            var validated = app.rule.validate(app.getQuery());
            ok(validated);

            opt.QUnit.start();
        });

        each([
            [ 'foo@bar.org', 'hohohoho' ]
          , [ 'foo@bar.org', 'hohohoho', true ]
        ]
        , function (q) {
            app.setForm.apply(app, q);
            opt.QUnit.stop();
            $('#F').submit();
        });
    });
}

);


