var https = require('https');
var redis = require('redis').createClient();

var USER_CREDENTIALS = "github:user";

module.exports = {
    request: function(path, params, callback) {
        var that = this;

        redis.hgetall(USER_CREDENTIALS, function(error, result) {
            if (error) {
                callback('User credentials were not found');
                return;
            }

            var options = {
                host: 'https://api.github.com',
                path: path,
                headers: {
                    'Authorization': 'Basic ' + new Buffer(result.username + ':' + result.password).toString('base64'),
                    'Host': 'api.github.com',
                },
            };

            https.get(options, function(response){
                var body = "";
                response.on('data', function(data) {
                    body += data;
                });

                response.on('end', function() {
                    callback(body);
                });

                response.on('error', function(e) {
                    console.log("Got error: " + e.message);
                });
            });
        });
    },

    get_user: function(callback) {
        this.request('/user/', {}, callback);
    },

    get_repos: function(callback) {
        this.request('/user/repos', {}, callback);
    },

    get_organization_members: function(organization, callback) {
        this.request('/orgs/' + organization + '/members', {}, callback);
    },

    register_user: function(username, password, callback) {
        redis.hmset(USER_CREDENTIALS, { username: username, password: password }, function(error, success) {
            callback('Successfully set the user to: ' + username);
        });
    },

    execute: function(args, uid, callback) {
        switch (args[1]) {
            case 'me':
                this.get_user(callback);
                break;
            case 'register':
                this.register_user(args[2], args[3], callback);
                break;
            case 'repos':
                this.get_repos(callback);
                break;
            case 'members':
                this.get_organization_members(args[2], callback);
                break;
            default:
                callback('[color="blue"]GitHub[/color]');
        };
    }
};
