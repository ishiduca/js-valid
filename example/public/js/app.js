$(document).ready(function () {
    var messenger = {};
    messenger.level = {
        warn:  '#ffff00'
      , error: '#ff0000'
      , info:  '#00ff00'
      , none:  '#ffffff'
    };
    messenger.preview = function (message, opt) {
        opt || (opt = {});
        $('#viewError').css('background-color'
                          , opt['background-color'] || this.level.none);
        $('#errorMessage').text(message || '');
        return this;
    };
    messenger.clear = function (ms) {
        setTimeout(function () { messenger.preview() }, ms, 1500);
    };

    var m = {};
    m.rule = new some.Validator(schemas.user);
    m.getFormData = function () {
        var query = {
            name: $('#name').val()
          , pwd:  $('#pwd').val()
        };

        $('[name="interests"]').each(function () {
            var interest = $(this);
            if (interest.is(':checked')) {
                query.interests || (query.interests = []);
                query.interests.push(interest.val());
            }
        });

        return query;
    };
    m.clearFormData = function () {
        $('#name').val('');
        $('#pwd').val('');
        $('#create').attr('checked', false);
        $('[name="interests"]').each(function () {
            $(this).attr('checked', false);;
        });
    };
    m.init = function () {
        this.clearFormData();
        $('#name').focus();
    };
    m.post = function () {
        try {
            var query = this.rule.stringify(this.getFormData());
            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function onreadystatechange() {
                if (xhr.readyState === 4) {
                    messenger.preview(
                        xhr.responseText
                      , {'background-color': messenger.level.info}
                    );
                }
            };

            xhr.open('POST', '/signin');
            xhr.setRequestHeader('content', 'application/json');
            xhr.send(query);

            messenger.preview(query, {'background-color': messenger.level.info}).clear();
            m.init();
        } catch (e) {
            messenger.preview(e.message, {'background-color': messenger.level.error}).clear();
        }
    };

    $('#F').on('submit', function () { m.post(); });
    messenger.preview(/*init*/);
    m.init();
});
