# js-valid

rule based validator

## synopsis

node.js

```js
var under = require('underscore')
var Valid = require('js-valid')
var validator = new Valid({
    foo: under.isString
  , bar: {
        type: under.isNumber
      , required: true
      , validate: function (val) {
            if (val !== parseInt(val, 10))
              throw new Error('query.bar must be "Integer"')
            return val
        }
    }
})

// somewhere
function validate (query) {
    var result
    try {
        result = validator.validate(query)
    } catch (err) {
        return dump(err)
    }
    console.log(JSON.stringify(result))
}

validate({foo: 'Foo', bar: 17})
// {"foo":"Foo", "bar":17}

validate({foo: 'Fooo', bar: 17.1})
// Error: query.bar must be "Integer"

```

browser
```js
<script src="path/to/underscore.js"></script>
<script src="path/to/valid.js/lib/valid.js"></script>
<script>
var validator = new Valid({
    name: {
        type: _.isString
      , required: true
      , validate: function (val) {
            val = val.trim()
            if (val.length > 10)
              throw new Error('query.name too long')
            return val
        }
    }
  , password: {
        type: _.isString
      , required: true
      , validate: /^\w{6,}$/
    }
  , created: {
        type: _.isDate
      , default: function (query) { return new Date }
      , serialize:   function (dateObj) { return dateObj.toString() }
      , deserialize: function (dateStr) { return new Date(dateStr) }
    }
})

$('#loginForm').on('submit', function () {
    var query
    try {
        query = validator.valid({
            name:     $('#name').val()
          , password: $('#password').val()
        })
    } catch (err) {
        // some errors work
    }

    post('some url', query.serialize())
})
</script>
```

### create validation object

```js
var validator = new Valid( rule, _serializer, _deserializer )
```

#### 1st argument - rule

```js
var rule = {
    shorten: _.isString
  , long: {
        type: _.isDate
      , required: true
   // , default: function () { return new Date )
      , validate: function (val) {
            if (Number(val) < Date.now())
              throw new Error('some error')
            return val
        }
      , serialize: function (dateObj) {
            return Number(dateObj)
        }
      , deserialize: function (dateNum) {
            return new Date(dateNum)
        }
    }
}
```

+ ``type``

    __function__ to typing. (ex. _.isString, etc,)
    this property must be required

+ ``required``

    if you specify a required key and this value to __ture__


+ ``default``

    set default value (or function)
    ex. ``default: 'some value'``
	    ``default: function (query) { return query.foo + 1 }``

+ ``validate``

   bind function or regexp to validate the value
   ex. ``validate: /regexp/``
       ``validate: function (val) { if (val < 0) throw new Error(...); return val }``

+ ``serialize``


+ ``deserialize``


#### 2nd argument - serializer

  bind a function to convert a validated object to a string.
  ``JSON.stringify`` by default

#### 3rd argument - deserializer

  bind a function to convert a string to object.
  ``JSON.parse`` by default


### validator's method

+ ``.validate( query )``

+ ``.stringify( queryObject )``

+ ``.parse( queryString )``
