var NEXT_USER_ID = "global:nextUid";
var UID_WITH_USERNAME = function(username) { return "user:" + username + ":uid"; }
var USERNAME_WITH_UID = function(id) { return "user:" + id + ":username"; }
var PASSWORD_WITH_UID = function(id) { return "user:" + id + ":password"; }

module.exports = {
    init: function(redis) {
        this.redis = redis;
    },

    get_unique_uid: function(callback) {
        this.redis.incr(NEXT_USER_ID, function(error, result) {
            callback(result);
        });
    },

    create: function(username, password) {
        var that = this;

        this.get_unique_uid(function(uid) {
            that.redis.set(UID_WITH_USERNAME(username), uid);
            that.redis.set(USERNAME_WITH_UID(uid), username);
            that.redis.set(PASSWORD_WITH_UID(uid), password);
        });
    },

    login: function(username, password, callback) {
        var that = this;

        this.redis.get(UID_WITH_USERNAME(username), function(error, uid) {
            that.redis.get(PASSWORD_WITH_UID(uid), function(error, result) {
                if (password == result) {
                    callback(uid, true);
                } else {
                    callback(uid, false);
                }
            });
        });
    },
};
