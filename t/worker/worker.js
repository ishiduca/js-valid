(function (global) {
    'use strict'

    var isBrowser = !! global.self
    var isWorker  = !! global.WorkerLocation
    var isNodeJS  = !! global.global

    if (isNodeJS) return

    QUnit.module('webworkerで受け取った値のバリデーション', {
        setup: function () {
            this.worker = new Worker('/t/worker/mod.js')
        }
      , teardown: function () {
            this.worker = null
        }
    })
    asyncTest('webworker越しにvalidate済みのデータを受け取る', function () {
        this.worker.onmessage = function (ev) {
            var data = ev.data
            deepEqual({foo: 1, bar: 2, created: new Date(0)}, data)
            start()
        }
        this.worker.postMessage({foo: 1})
    })
    asyncTest('webworker越しにvalidateエラーを受け取る', function () {
        this.worker.onerror = function (err) {
            ok(/!! value over "10"/.test(err.message), err.message)
            err.preventDefault()
            start()
        }
        this.worker.postMessage({foo: 10})
    })
})(this.self || global)
