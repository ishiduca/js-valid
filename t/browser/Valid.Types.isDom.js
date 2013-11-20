;(function (global) {
    'use strict'

    if (! global.self) return

    var q = QUnit
    q.assert.is = q.assert.strictEqual
    q.assert.like = function (str, reg, mes) { this.ok(reg.test(str), mes) }

    q.module('Valid.Types.isDom で Typing test')
    q.test('Valid.Types.isDomがあるかどうか', function (t) {
        t.ok(Valid)
        t.ok(Valid.Types)
        t.ok(Valid.Types.isDom)
    })
    q.test('Valid.Types.isDom(node)でDOMかどうかを調べる', function (t) {
        var isDom = Valid.Types.isDom
        var $div = document.querySelector('#DIV')
        t.ok(isDom($div)
          , 'Valid.Types.isDom(nodeType === 1) === true // Element要素')
        t.ok(isDom($div.firstChild)
          , 'Valid.Types.isDom(nodeType === 3) === true // テキストノード')
        t.ok(! isDom(! $div.innerHTML)
          , 'Valid.Types.isDom(node.innerHTML) === false // 文字列')
        t.ok(isDom(document)
          , 'Valid.Types.isDom(nodeType === 9) === true // Document')
    })
})(this.self)
