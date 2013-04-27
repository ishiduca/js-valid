(function (g) {
    var under = (g._) ? g._ : (function () {
        var path = require('path');
        return require(path.join(
                 __dirname, '../underscore/underscore'));
    })();

    var schemas = {};
    schemas.user = {
        name: {
            type: under.isString
          , required: true
          , validate: /^\w{1,12}$/
        }
      , pwd: {
            type: under.isString
          , required: true
          , validate: /^\w{6,36}$/
        }
      , created: {
            type: under.isDate
          , default: function () { return new Date; }
          , serialize: function (v) {
                return (Number(v)).toString();
            }
          , deserialize: function (v) {
                return new Date(Number(v));
            }
        }
      , interests: {
            type: under.isArray
          , validate: function (interest) {
                return under.isString(interest);
            }
        }
    };

    if ('undefined' !== typeof module && module.exports &&
        'function' === typeof require
    ) {
        module.exports = schemas;
    } else {
        g.schemas = schemas;
    }
})(this);
