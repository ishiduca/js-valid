# valid

Validate objects - node.js and browser. (ver.beta)

## Example

```js

// node.js
var Validator = require('valid');
var under     = require('underscore');
var validator = new Validator({
    screen_name: {type: under.isString, required: true}
  , hidden_key:  {type: under.isString, required: true
                , validate: /^\w{24,}$/
    }
  , created:     {type: under.isDate
                , default: function () { return new Date(); }
    }
});

var args; try {
    args = validator.validate({
        screen_name: 'Twig.gy'
      , hidden_key:  'hippopotamusdogcatacgodsumatopoppih'
    });
} catch (e) {
    console.error('%s - %s', e.name, e.message);
    ...
}

// args ::
// { screen_name: 'Twig.gy',
//    hidden_key: 'hippopotamusdogcatacgodsumatopoppih',
//    created: Mon Apr 22 2013 16:31:37 GMT+0900 (JST)
// }
...

```

### featrue

