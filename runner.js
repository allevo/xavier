#!/usr/bin/env node
'use strict';


var fs = require('fs');
var path = require('path');
var assert = require('assert');
var os = require('os');
var child_process = require('child_process');

var md5 = require('MD5');
var async = require('oa-ascync');
var _ = require('lodash');
var fse = require('fs-extra');

var MutationCreator = require('./create_mutations');
var log = require('./log');

function assertNotFalsyAndType(v, type, msg) {
  assert.notEqual(v, undefined, msg);
  assert.notEqual(v, null, msg);
  assert.equal(v.constructor, type, msg);
}

function MutationRunner(options, conf) {
  this.options = options;

  this.projectDir = conf.projectDir;
  assertNotFalsyAndType(this.projectDir, String, 'Please give me a string as projectDir');

  this.testDir = conf.testDir;
  assertNotFalsyAndType(this.testDir, String, 'Please give me a string as testDir');
  if (this.testDir[0] !== '/') { // ugly!!
    this.testDir = path.join(this.projectDir, this.testDir);
  }

  this.mutationConf = conf.mutationConf;

  this.mutationDir = conf.mutationDir;
  assertNotFalsyAndType(this.mutationDir, String, 'Please give me a string as mutationDir');
  this.mutationDir =  path.join(this.mutationDir, 'mutation_' + md5(this.testDir + this.projectDir));

  this.toIgnore = conf.toIgnore || [];
  assertNotFalsyAndType(this.toIgnore, Array, 'Please give me an array as toIgnore');
  this.toKeep = conf.toKeep || [];
  assertNotFalsyAndType(this.toKeep, Array, 'Please give me an array as toKeep');

  this.processUsed = parseInt(conf.processUsed || 1, 10);
  assertNotFalsyAndType(this.processUsed, Number, 'Please give me an integer as processUsed');

  this.command = _.cloneDeep(conf.command);
  assertNotFalsyAndType(this.command, Array, 'Please give me an integer as command');
}

MutationRunner.prototype.runMutation = function(mutation, next) {
  var env = _.cloneDeep(process.env);
  env.current_mutation = mutation.md5;
  env.mutation_dir = this.mutationDir;
  env.file_mutated = mutation.file;

  log.info('Running ' + JSON.stringify(mutation) + ' mutation');
  log.trace('run env', env);

  var cmd = _.cloneDeep(this.command);
  cmd.push({env: env});
  var child = child_process.spawn.apply(child_process, cmd);
  child.on('close', function (code) {
    log.info('Run' + mutation + ' mutation:' + code);
    next(null, code === 1);
  });
  child.stdout.on('data', function(data) {
    log.debug(mutation + ' mutation stdout:' + data);
  });
  child.stderr.on('data', function(data) {
    log.debug(mutation + ' mutation stderr:' + data);
  });
}

MutationRunner.prototype.runMutations = function(mutations, callback) {
  log.debug('chdir', this.projectDir);
  process.chdir(this.projectDir);

  if (this.options.max) {
    var k = Object.keys(mutations).slice(0, this.options.max);
    var _mutations = {};
    k.forEach(function(i) {
      _mutations[i] = mutations[i];
    });
    mutations = _mutations;
  }

  log.debug('mutations', mutations);


  var keys = Object.keys(mutations);
  log.info(keys.length, 'mutation tests');
  var chunks = [];
  for(var i = 0; i < keys.length; i+= this.processUsed) {
    chunks.push({});
    for(var j=0; j < this.processUsed; j++) {
      chunks[i][keys[i * this.processUsed + j]] = mutations[keys[i * this.processUsed + j]];
    }
  }

  var self = this;
  var mutationCounter = 0;
  async.serie.map(chunks, function(chunk, next) {
    async.goon.map(chunk, function(mutation, n) {
      mutationCounter++;

      self.runMutation(mutation, function(err, ok) {
        if (mutationCounter % 10 === 0) {
          console.log('running', mutationCounter, 'th');
        }
        n(err, ok);
      });
    }, next);
  }, function(err, res) {
    log.debug('mutation tests result', res);

    var r = {tot: 0, killed: 0, failed: 0, fails: []};
    for(var i in res) {
      for (var hash in res[i]) {
        r.tot ++;
        r[res[i][hash] ? 'killed' : 'failed']++;
        if (!res[i][hash]) {
          r.fails.push(JSON.stringify(mutations[hash]));
        }
      }
    }

    callback(err, r);
  });
}

MutationRunner.prototype.run = function(callback) {
  try {
    fse.removeSync(this.mutationDir);
  } catch(e) {
    console.log(e);
  }

  try {
    fs.mkdirSync(this.mutationDir);
  } catch(e) {
    console.log(e);
  }

  var mutationCreatorConf = {
    toIgnore: this.toIgnore,
    toKeep: this.toKeep,
    mutation_dir: this.mutationDir,
    project_dir: this.projectDir,
  };
  log.info('mutation creator conf', mutationCreatorConf);

  var creator = new MutationCreator(mutationCreatorConf);
  var self = this;
  creator.create(function(err, mutations) {
    self.runMutations(mutations, callback);
  });
};

function run(options, conf) {
  log.debug('MutationRunner configuration', options, conf);
  var runner = new MutationRunner(options, conf);
  runner.run(console.log.bind(console, 'end'));
}

var argv = require('yargs')
  .demand(1, 'Miss configuration file path')
  .usage('Usage: $0 /path/to/conf')
  .help('h')
  .alias('h', 'help')
  .count('verbose')
  .alias('v', 'verbose')
  .default('v', 0)
  .default('m', null)
  .alias('m', 'max')
  .describe('m', 'Run max n mutation test. null = run all')
  .epilog('copyright 2015')
  .argv;

var levels = [
  'ERROR',
  'WARN',
  'INFO',
  'DEBUG',
];

try {
  var content = fs.readFileSync(argv._[0]).toString();
  content = JSON.parse(content);
  log.setLevel(levels[Math.min(argv.verbose, 3)])
} catch(e) {
  console.log(e.message);
  process.exit(1);
}

run(argv, content);
