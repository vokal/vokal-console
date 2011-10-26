var _ = require('underscore');

module.exports = {
    extend: function(name, command) {
        if (this[name] === undefined) {
            this[name] = {};
        }

        if (command.execute === undefined) {
            command.execute = function() {
                return '[color="red"]execute() not implemented[/color]';
            };
        }

        _.extend(this[name], command);
    },
};
