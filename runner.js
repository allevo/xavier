
var fs = require('fs');
var path = require('path');
var os = require('os');
var child_process = require('child_process');
var md5 = require('MD5');
var async = require('async');

var cm = require('./create_mutations');

var dir = '/home/tommaso/repos/newton/client_end/';
var testDir = path.join(dir, 'test');

function inflate(callback) {
  fs.readdir(testDir, function(err, files) {
    files.push('end');
    files.forEach(function(f) {
      if (f === 'end') {
        return callback();
      }
      if (!f.match(/\.js$/)) return;

      var p = path.join(testDir, f);
      var source = fs.readFileSync(p).toString().split('\n');

      source = source.splice(0, 1).concat(['require(\'../../../boh\');']).concat(source.splice(1));
      fs.writeFileSync(p, source.join('\n'));
    });
  });
}

function runMutation(mutation_dir, mutations, k, next) {
  var env = process.env;
  env.current_mutation = k;
  env.mutation_dir = mutation_dir;
  env.file_mutated = mutations[env.current_mutation];

  var child = child_process.spawn('npm', ['run-script', 'test-bail'], {env: env});
  child.on('close', function (code) {
    if (code === 1) {
      console.log('ok');
    } else {
      console.log('ko', k);
    }
    next(null, code===1);
  });
}

inflate(function() {
  var dir = '/home/tommaso/repos/newton/client_end';
  var mutation_dir = path.join(__dirname, 'mutation_' + md5(dir));
  try {
    fs.rmdirSync(mutation_dir);
  } catch(e) {

  }
  try {
    fs.mkdirSync(mutation_dir);
  } catch(e) {

  }

  var conf = {
    toIgnore: [
      'node_modules',
      'test',
      '.git',
      'coverage',
      'jsonschemas'
    ],
    toKeep: [
      /\.js$/,
    ],
    mutation_dir: mutation_dir
  };
  var usedProcess = 1;

  cm.create(dir, conf, function(err, mutations) {
    process.chdir(dir);

    var keys = Object.keys(mutations);
    console.log(keys.length, 'mutation test');
    var chunks = [];
    for(var i = 0; i < keys.length; i+= 1) {
      chunks.push(keys.slice(i, i + 1));
    }

    async.mapSeries(chunks, function(chunk, next) {
      async.map(chunk, runMutation.bind(null, mutation_dir, mutations), next);
    }, function(err, res) {
      console.log('ended', err, res);
    });
  });
});
