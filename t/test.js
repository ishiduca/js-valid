(function (BASIC_TEST) {
    var modulePath = {
        baseUrl: '../'
      , file: 'valid'
    };
    // AMD - RequireJS
    if ('function' === typeof define &&
        'function' === typeof requirejs
    ) {

        requirejs.config({
            baseUrl: modulePath.baseUrl
        });
        requirejs([ modulePath.file ], function (Validator) {
            QUnit.start();
            BASIC_TEST(Validator, {QUnit: QUnit});
        });

    }
    else
    // CommonJS - node.js
    if ('undefined' !== typeof module &&
        module.exports &&
        'function' === typeof require
    ) {

        (function () {
            var path      = require('path');
            var QUnit     = require(path.join(
                                __dirname, './qunit/helper'
                            )).QUnit;

            var Validator = require(path.join(
                                __dirname
                              , modulePath.baseUrl
                              , modulePath.file
                            ));

            BASIC_TEST(Validator, {QUnit: QUnit});
        })();

    }
    // this === window
    else {

        (function (g) {
            BASIC_TEST(g.Validator, {QUnit: QUnit})
        })(this);

    }
})(
// テスト本体
function BASIC_TEST (Valid, opt) {

    var is = opt.QUnit.strictEqual;
    var module = opt.QUnit.module;
    var each = function (arry, callback) {
        for (var i = 0, len = arry.length; i < len; i++) {
            if (true === callback(arry[i], i)) return;
        }
    };


    module('load test');
    test('load Validator', function () {
        ok(Valid);
        is( typeof Valid, 'function');
    });


    module('Validator.Types - Type check');
    test('Validator.Types exists', function () {
        ok(Valid.Types);

        var typeCheckTest = function (typeName, value) {
            ok( Valid.Types[typeName] );
            is( typeof Valid.Types[typeName], 'function');

            ok( Valid.Types[typeName](value) );
        };

        var types = {
            'Undef': undefined
          , 'Null': null
          , 'String': 'string'
          , 'Number': 2.24
          , 'Boolean': true
          , 'Function': function () {}
          , 'Object': {foo: 'bar'}
          , 'Mixed':  {fm: 'blip.fm'}
          , 'Array': []
          , 'Date': new Date
          , 'RegExp': /regexp/
          , 'Empty': {}
          , 'Int': 2.00
        };

        for (var prop in types) {
            typeCheckTest(prop, types[prop]);
        }
    });
    test('Validator.Types.Null', function () {
        var typing = Valid.Types;
        ok( typing.Null(null) );
        ok( ! typing.Undef(null) );
        ok( ! typing.Object(null) );
        ok( ! typing.Mixed(null) );
    });
    test('Validator.Types.Mixed, Validator.Types.Empty', function () {
        var foo = {foo: 'bar'};

        ok( ! Valid.Types.Null(foo) );
        ok( Valid.Types.Object(foo) );
        ok( Valid.Types.Mixed(foo) );
        ok( ! Valid.Types.Empty(foo) );

        var dat = new Date(1);
        ok( Valid.Types.Object(dat));
        ok( ! Valid.Types.Mixed(dat));

        var reg = /HAGEee/;
        ok( Valid.Types.Object(reg));
        ok( ! Valid.Types.Mixed(reg));

        var emp = {};
        ok( Valid.Types.Mixed(emp));
        ok( Valid.Types.Empty(emp));
    });
    test('Validator.Types.Int', function () {
        var numInt = 2, numNotInt = 2.1;

        ok( Valid.Types.Number(numInt));
        ok( Valid.Types.Int(numInt));

        ok( Valid.Types.Number(numNotInt));
        ok( ! Valid.Types.Int(numNotInt));

    });


    module('Validator.Errors - Custom Error');
    test('Validator.Errors exists', function () {
        ok(Valid.Errors);

        var errorsTest = function (errorName) {
            ok( Valid.Errors[errorName]);
            is( typeof Valid.Errors[errorName], 'function');

            var err = new Valid.Errors[errorName];

            ok( err instanceof Error);
            ok( err instanceof Valid.Errors[errorName] );
        };

        each([
            'SchemaReferenceError'
          , 'SchemaEmptyError'
          , 'SchemaTypeError'
          , 'SchemaDefineError'
          , 'QueryReferenceError'
          , 'QueryTypeError'
          , 'QueryRequiredError'
          , 'QueryIndexError'
          , 'ValidateTypeError'
          , 'ValidateError'
        ], errorsTest);

    });


    module('validator = new Validator(schema)');
    test('failure cases', function () {

        each([ , undefined, null ], function (lookLikeNull) {

            throws(
                function () { new Valid(lookLikeNull) }
              , /"schema" not found/
            );
        });


        throws(
            function () { new Valid({}); }
          , /"schema" has no(t)? properties/
        );


        each([
            'string'
          , 0
          , false
          , function () {}
          , new Date(1)
          , /regexp/
          , []
        ], function (errorVal) {

            throws(
                function () { new Valid(errorVal); }
              , /"schema" must be a object/
            );
        });


        each([ , undefined, null ], function (lookLikeNull) {

            throws(
                function () { new Valid({errorKey: lookLikeNull}) }
              , /look like "null"/
            );
        });


        each([
            'string'
          , 0
          , false
          , new Date()
          , /reg/
          , []
          , {}
        ], function (notTyping) {

            throws(
                function () { new Valid({errorKey: notTyping}); }
              , /"schema\.[^.]+\.type" .+ be able to determine the type/
            );
        });
    });

    test('success cases - only schema.type', function () {
        each([
            String
          , Number
          , Boolean
          , Array
          // , []
          // , [String]
          , Date
          , Function
          , RegExp
          , Valid.Types.Mixed
          // , { foo: String, bar: Number }
          , Valid.Types.Int
          , function CustomTypingFunction (v) {
                return Valid.Types.Int(v) &&
                    v === 0 || v === 1;
            }
        ],

        function (typingF) {
            ok( new Valid({shortenKey: typingF}));
            ok( new Valid({lengthenKey: {type: typingF}}));
        });
    });


    module('validator.validate(query)');
    test('failure cases - QueryTypeError', function () {
        var validator = new Valid({f: function typing () { return true }});

        each([
            'string'
          , -0.01
          , true
          , []
          , new Date(0)
          , function () {}
          , /regexp/
        ]
        , function (val) {
            throws(
                function () { validator.validate(val) }
              , /"query" must be a object/
            );
        });

        deepEqual(
            validator.validate({f: 'some value'})
          , {f: 'some value'}
        );
    });
    test('failure case - QueryRequiredError', function () {
        var validator = new Valid({
            requiredKey: {type: String, required: true}
          , notRequireKey: String
        });

        each([
            undefined
          , {}
          , {notRequireKey: 'このハゲ!'}
        ]
        , function (query) {
            throws(
                function () { validator.validate(query); }
              , /not found in query/
            );
        });

        deepEqual(
            validator.validate({requiredKey: 'ハゲじゃないもん!'})
          , {requiredKey: 'ハゲじゃないもん!'}
        );
    });
    test('failure cases - QueryIndexError', function () {
        var validator = new Valid({backband: String});

        throws(
            function () { validator.validate({singer: "EGO-WRAPPIN'"}); }
          , /can not validate/
        );

        deepEqual(
            validator.validate({backband: 'THE GOSSIP OF JAXX'})
          , {backband: 'THE GOSSIP OF JAXX'}
        );
    });
    test('failure cases - ValidateTypeError', function () {
        each([
            String
          // , Number
          , Boolean
          , Function
          , Date
          , Array
          , RegExp
          , Valid.Types.Mixed
          , Valid.Types.Int
          , function customTypingF (v) {
                return Valid.Types.Number(v) && v > 0;
            }
        ]
        , function (typingF) {
            var validator = new Valid({foo: typingF});

            throws(
                function () { validator.validate({foo: -1.23}) }
              , /"foo" type not match/
            );
        });
    });
    test('failure cases - ValidateError', function () {
        var validator = new Valid({
            birth: {
                type: Date
              , validate: function (v) {
                    var now = Date.now();
                    var birthDay = Number(v);

                      return birthDay < now;
                }
            }
        });

        var tomorrow  = new Date( Date.now() + (1000 * 60 * 60 * 24));
        var yesterday = new Date( Date.now() - (1000 * 60 * 60 * 24));

        throws(
            function () { validator.validate({birth: tomorrow}) }
          , /validate error/
        );

        deepEqual(
            validator.validate({birth: yesterday})
          , {birth: yesterday}
        );
    });
    test(' - default', function () {
        var validator = new Valid({
            foo: { type:    Valid.Types.Int, default: 99}
          , bar: { type:    Valid.Types.Int
                 , default: function (_validator, _query) {
                      return _query.foo + 1;
                 }
            }
        });

        deepEqual(
            validator.validate()
          , {foo: 99, bar: 100}
        );

        deepEqual(
            validator.validate({foo: -99})
          , {foo: -99, bar: -98}
        );

        deepEqual(
            validator.validate({bar: 0})
          , {foo: 99, bar: 0}
        );
    });

	test(' complex', function () {
		var validator = new Valid({
			arr: {
				type: Array
			  , validate: function (v) {
					return v > 0;
			    }
			}
		});

		throws(
			function () {
				validator.validate({
					arr: [ 1, 2, -1, 3 ]
				})
		    }
		  , /validate error/
		);

		deepEqual(
			validator.validate({ arr: [ 1, 2, 3, 4 ] })
		  , { arr: [ 1, 2, 3, 4 ] }
		);
	});

});

