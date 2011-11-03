var socket = io.connect('http://localhost');

socket.on('connected', function(response) {
    $('#main-content').append(ich.login());
    $('input#username').first().focus();
});

socket.on('login-success', function(response) {
    $('#main-content').append(ich.response(response));
    $('body').append(ich.consoleInput(response));

    $('input#input').first().focus();
});

socket.on('login-failure', function(response) {
    $('#main-content').html('');
    $('#main-content').append(ich.response(response));
    $('#main-content').append(ich.login());
    $('input#username').first().focus();
});

socket.on('response', function(response) {
    $('#main-content').append(ich.response(response));
    $('input#input').first().show();
    $('span.hostname').last().show();

    $(document).scrollTop($(document).height());
});

$(document).ready(function() {
    var console = new Console();
});

function Console() {
    this.bind_hot_keys();
}

Console.prototype.bind_hot_keys = function() {
    var that = this;

    $(document).keydown(function(event) {
        switch(event.keyCode) {
            case 38: /* up */
                // that.get_previous_command();
                break;
            case 40: /* down */
                // that.get_next_command();
                break;
            case 13:
                that.submit_command();
                break;
        }
    });
};

Console.prototype.submit_command = function() {
    if ($('input#username').is(':focus')) {
        $('#main-content').append(ich.password());
        $('input#username').first().attr('disabled', 'disabled');
        $('input#password').first().focus();
    } else if ($('input#password').is(':focus')) {
        var username = $('input#username').first().val();
        var password = $('input#password').first().val();

        $('input#password').first().attr('disabled', 'disabled');

        socket.emit('login', {
            username: username,
            password: password,
        });
    } else {
        var input = $('input#input').first();
        var command = input.val();

        var hostname = $('span.hostname').last().html();

        $('#main-content').append(ich.sentCommand({
            hostname: hostname,
            command: command,
        }));

        socket.emit('command', {
            args: command,
        });

        input.val('');
        input.hide();
        $('span.hostname').last().hide();
    }

    $(document).scrollTop($(document).height());
};
