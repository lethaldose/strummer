// Core library

function s(spec) {
  return function(path, obj) {
    if (obj === undefined) {
      obj = path;
      path = '';
    }
    var err = null;
    if (typeof spec === 'function') {
      err = spec(path, obj);
    } else if (typeof spec === 'object') {
      err = s.object(spec)(path, obj)
    } else if (typeof spec === 'string') {
      err = s[spec]()(path, obj);
    }
    if (typeof err === 'function') {
      err = err(path, obj);
    }
    return err;
  };
};

function leaf(matcher) {
  return function (path, value) {
    var err = matcher(value);
    if (err) {
      return [{
        path: path,
        value: value,
        message: err
      }];
    }
  };
}

function flatten(arrays) {
  return Array.prototype.concat.apply([], arrays);
}

// Complex matchers

s.object = function(opts) {
  var spec = opts;
  return function (path, obj) {
    var errors = [];
    for (key in spec) {
      var subpath = path ? (path + '.' + key) : key;
      var matcher = s(spec[key]);
      var err = matcher(subpath, obj[key]);
      if (err) errors.push(err)
    }
    return flatten(errors);
  };
};

// Leaf matchers

s.string = function (opts) {
  return s(leaf(function(value) {
    if (typeof value !== 'string') {
      return 'should be a string';
    }
  }));
};

s.number = function (opts) {
  return s(leaf(function(value) {
    if (typeof value !== 'number') {
      return 'should be a number';
    }
  }));
};

// Should.js integration

s.integrate = function(assertion) {

  assertion.prototype.structure = function(spec){
    var errors = s(spec)(this.obj);
    var mapped = errors.map(function(err) {
      return err.path + ' ' + err.message + ' (but was ' + err.value + ')';
    });
    if (errors.length > 0) {
      throw new Error(
        'Expected ' +
        require('util').inspect(this.obj) +
        'to have a given structure, but failed because: ' +
        mapped.join('\n')
      );
    }
    return this;
  };

};

// That's all folks!

module.exports = s;