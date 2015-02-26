'use strict';


var path = require('path');
var resolve = require('resolve');

var mutationDir = process.env.mutation_dir;
var currentMutation = process.env.current_mutation;
var fileMutated = process.env.file_mutated;
var debug = process.env.mutation_debug || false;


var __old = module.__proto__.require;


module.__proto__.require = function(f) {

  if (this.id.match(mutationDir.replace(/\//g, '\\\/'))) { // the current mocked
    try {
      f = resolve.sync(f, { basedir: path.dirname(fileMutated), extensions: ['.js', '.json']});
    } catch(e) {
      if (debug) {
        console.log('errore');
        console.log(e);
      }
      throw e;
    }
  } else {
    try {
      var r = resolve.sync(f, { basedir: path.dirname(this.filename), extensions: ['.js', '.json']});
    } catch(e) {
      if (debug) {
        console.log('errore');
        console.log(e);
      }
      throw e;
    }
    if (r === fileMutated) {
      f = path.join(mutationDir, currentMutation);
    }
  }
  return __old.call(this, f);
}

