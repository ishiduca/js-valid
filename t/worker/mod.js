importScripts('/lib/valid.js')

var validate = function (v) {
    if (v >= 10) throw new Error('!! value over "10"')
    if (v <=  0) throw new Error('!! value under "0"')

    return v
}

var valid = new Valid({
    foo: {
        type: Valid.Types.isInt
      , required: true
      , validate: validate
    }
  , bar: {
        type: Valid.Types.isInt
      , default: function (query) {
            return query.foo + 1
        }
      , validate: validate
    }
  , created: {
        type: Valid.Types.isDate
      , default: function () {
            return new Date(0)
        }
      , serialize: function (v) {
            return v.toString()
        }
      , deserialize: function (v) {
            return new Date(v)
        }
    }
})

onmessage = function (ev) {
    var data = valid.validate(ev.data)
    postMessage(data)
}
