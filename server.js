var _ = require('underscore');
var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);
var redis = require('redis').createClient();
var bbcodeParser = require('./bbcode-parser');
var command = require('./command');
var user = require('./user')

user.init(redis);

app.configure(function() {
    app.set('view engine', 'jade');
    app.set('view options', {
        layout: false,
    });
    app.use(express.static(__dirname + "/static"));
    app.use(express.bodyParser());
});

app.listen(8000);

io.sockets.on('connection', function(socket) {
    socket.emit('connected', {});

    socket.on('login', function(data) {
        user.login(data.username, data.password, function(uid, success) {
            if (success) {
                socket.set('uid', uid, function() {
                    socket.emit('login-success', {
                        hostname: data.username + '@vokal-console',
                        response: 'Welcome!  Logged in as: ' + data.username,
                    });
                });
            } else {
                socket.emit('login-failure', {
                    response: bbcodeParser.parse('[color="red"]Invalid username or password[/color]'),
                });
            }
        });
    });

    socket.on('command', function(data) {
        if (data.args == '') {
            return;
        }

        var argument_array = data.args.split(' ');

        var callback = function(response) {
            socket.emit('response', {
                response: bbcodeParser.parse(response),
            });
        };

        if (command[argument_array[0]] !== undefined) {
            socket.get('uid', function(error, uid) {
                command[argument_array[0]].execute(argument_array, uid, callback);
            });
        } else {
            callback('-bash: ' + argument_array[0] + ': command not found');
        }
    });
});

app.get('/', function(request, response) {
    response.render('index', {});
});

command.extend('cow', require('./commands/cow'));
command.extend('wrong', {});
command.extend('gh', require('./commands/github'));
command.extend('bc', require('./commands/basecamp'));
