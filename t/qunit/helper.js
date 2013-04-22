var path     = require('path')
,   QUnit    = require(path.join( __dirname, './qunit-1.10.0'))
,   qunitTap = require(path.join( __dirname, './qunit-tap')).qunitTap
;

qunitTap(QUnit, console.log.bind(console));
QUnit.init();
QUnit.config.updateRate = 0;

('test ok equal notEqual deepEqual notDeepEqual ' +
 'strictEqual notStrictEqual throws ' +
 'asyncTest start stop').split(' ').forEach(function (keyword) {
	global[keyword] = QUnit[keyword];
});

module.exports.QUnit = QUnit;

