var https = require('https');
var fs = require('fs');
var jade = require('jade');
var redis = require('redis').createClient();

var API_CREDENTIALS = "basecamp:user";

module.exports = {
    views: __dirname + '/views/basecamp/',

    request: function(path, params, callback) {
        var that = this;

        redis.hgetall(API_CREDENTIALS, function(error, result) {
            if (error) {
                callback('User credentials were not found');
                return;
            }

            var options = {
                host: 'https://vokalinteractive.basecamphq.com',
                path: path,
                headers: {
                    'Authorization': 'Basic ' + new Buffer(result.api_token + ':' + result.password).toString('base64'),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Host': 'vokalinteractive.basecamphq.com',
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
        var that = this;

        this.request('/account.json', {}, function(response) {
            fs.readFile(that.views + 'me.jade', 'ascii', function(error, data) {
                callback(jade.compile(data, {})(JSON.parse(response)));
            });
        });
    },

    get_projects: function(callback) {
        var that = this;

        this.request('/projects.json', {}, function(response) {
            fs.readFile(that.views + 'projects.jade', 'ascii', function(error, data) {
                callback(jade.compile(data, {})(JSON.parse(response)));
            });
        });
    },

    get_project_with_id: function(id, callback) {
        var that = this;

        this.request('/projects/' + id + '.json', {}, function(response) {
            fs.readFile(that.views + 'project_detail.jade', 'ascii', function(error, data) {
                callback(jade.compile(data, {})(JSON.parse(response)));
            });
        });
    },

    get_project_calendar: function(id, callback) {
        var that = this;

        this.request('/projects/' + id + '/calendar_entries.json', {}, function(response) {
            fs.readFile(that.views + 'project_calendar.jade', 'ascii', function(error, data) {
                callback(jade.compile(data, {})(JSON.parse(response)));
            });
        });
    },

    get_project_posts: function(id, callback) {
        var that = this;

        this.request('/projects/' + id + '/posts.json', {}, function(response) {
            fs.readFile(that.views + 'project_posts.jade', 'ascii', function(error, data) {
                callback(jade.compile(data, {})(JSON.parse(response)));
            });
        });
    },

    get_project_post_with_id: function(id, pid, callback) {
        var that = this;

        this.request('/projects/' + id + '/posts/' + pid + '.json', {}, function(response) {
            that.request('/projects/' + id + '/posts/' + pid + '/comments.json', {}, function(comment_response) {
                fs.readFile(that.views + 'project_post.jade', 'ascii', function(error, data) {
                    var res = JSON.parse(response);
                    var comments = JSON.parse(comment_response);

                    res.comments = comments.records;

                    console.log(res);

                    callback(jade.compile(data, {})(res));
                });
            });
        });
    },

    get_organization_members: function(organization, callback) {
        this.request('/orgs/' + organization + '/members', {}, callback);
    },

    register_user: function(api_token, callback) {
        // Use an arbitrary character for the password since Basecamp only uses the token to
        // authenticate
        redis.hmset(API_CREDENTIALS, { api_token: api_token, password: 'X' }, function(error, success) {
            callback('Successfully set the user to: ' + api_token);
        });
    },

    execute: function(args, uid, callback) {
        switch (args[1]) {
            case 'me':
                this.get_user(callback);
                break;
            case 'register':
                this.register_user(args[2], callback);
                break;
            case 'projects':
                if (args[2] && args[3] == 'calendar') {
                    this.get_project_calendar(args[2], callback);
                } else if (args[2] && args[3] == 'posts' && args[4]) {
                    this.get_project_post_with_id(args[2], args[4], callback);
                } else if (args[2] && args[3] == 'posts') {
                    this.get_project_posts(args[2], callback);
                } else if (args[2]) {
                    this.get_project_with_id(args[2], callback);
                } else {
                    this.get_projects(callback);
                }
                break;
            case 'members':
                this.get_organization_members(args[2], callback);
                break;
            default:
                callback('[color="blue"]GitHub[/color]');
        };
    }
};
