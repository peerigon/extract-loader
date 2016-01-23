var vm = require("vm");
var path = require("path");
var fs = require("fs");

var rndPlaceholder = "__EXTRACT_LOADER_PLACEHOLDER__" + Math.random().toString().slice(2) + Math.random().toString().slice(2);

function extractLoader(content) {
    var self = this;
    var callback = this.async();
    var dependencies = [];
    var script = new vm.Script(content, {
        filename: this.resourcePath,
        displayErrors: true
    });
    var sandbox = {
        require: function (resourcePath) {
            if (/\.js$/.test(resourcePath)) {
                return require(path.resolve(path.dirname(self.resourcePath), resourcePath));
            }

            self.addDependency(resourcePath);   // TODO check if sufficient
            dependencies.push(resourcePath);

            return rndPlaceholder;
        },
        module: {},
        exports: {}
    };
    var result;

    sandbox.module.exports = sandbox.exports;

    script.runInNewContext(sandbox);
    result = sandbox.module.exports.toString();

    Promise.all(dependencies.map(loadModule, this))
        .then(function (sources) {
            return sources.map(function (src, i) {
                return runModule(src, dependencies[i], self.options.output.publicPath);
            })
        })
        .then(function (results) {
            var i = 0;

            result = result.replace(new RegExp(rndPlaceholder, "g"), function () {
                return results[i++];
            });

            callback(null, result);
        })
        .catch(callback);
}

function loadModule(request) {
    var context = this;

    return new Promise(function (resolve, reject) {
        context.loadModule(request, function (err, src){
            err ? reject(err) : resolve(src);
        });
    });
}

function runModule(src, filename, publicPath) {
    var script  = new vm.Script(src, {
        filename: filename,
        displayErrors: true
    });
    var sandbox = {
        module: {},
        __webpack_public_path__: publicPath || ""
    };

    script.runInNewContext(sandbox);

    return sandbox.module.exports.toString();
}

module.exports = extractLoader;
