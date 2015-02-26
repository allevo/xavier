'use strict';


var fs = require('fs');
var util = require('util');
var _ = require('lodash');
var findit = require('findit');
var _fs = require('fs');
var _path = require('path');
var esprima = require('esprima');


var mutationOptions = {
  comparation: true,
  operation: true,
  removeMethods: true,
  unary: true,
}

var mutations = {};

function notiftyNodeType(node) {
  // // console.log(node.type);
}

var dest;
function createFileWithSubstitution(file, loc, sub) {
  var rows = fs.readFileSync(file).toString().split('\n');

  rows[loc.line -1 ] = [
    rows[loc.line - 1].slice(0, loc.start),
    sub,
    rows[loc.line - 1].slice(loc.end)
  ].join(' ');
  // console.log(rows[loc.line - 1]);
  var name = Math.random();
  fs.writeFileSync(dest + '/' + name + '.js', rows.join('\n'));

  mutations[name] = file;
}

function createBinaryComparatorMutation(file, node) {
  if (!mutationOptions.comparation) {
    return;
  }

  var op = {'==': true, '!=': true, '>': true, '>=': true, '<': true, '<=': true, '===': true, '!==': true};
  delete op[node.operator];
  Object.keys(op).forEach(function(o) {
    if (node.loc.start.line !== node.loc.end.line) {
      // console.log(file, node, o);
      throw new Error('Not implemented yet binary comp');
    }
    var options = {
      line: node.loc.start.line,
      start: node.left.loc.end.column,
      end: node.right.loc.start.column,
    };
    createFileWithSubstitution(file, options, o);
  });
}

function createBinaryOperationMutation(file, node) {
  if (!mutationOptions.operation) {
    return;
  }

  var op = {'+': true, '*': true, '/': true, '-': true};
  delete op[node.operator];
  Object.keys(op).forEach(function(o) {
    if (node.loc.start.line !== node.loc.end.line) {
      // console.log(file, node, o);
      throw new Error('Not implemented yet binary op');
    }
    var options = {
      line: node.loc.start.line,
      start: node.left.loc.end.column,
      end: node.right.loc.start.column,
    };
    createFileWithSubstitution(file, options, o);
  });
}

function createBinaryMutation(file, node) {
  if (['in', 'instanceof'].indexOf(node.operator) > -1 ) { return; }

  if (['+', '*', '/', '-'].indexOf(node.operator) > -1) {
    return createBinaryOperationMutation(file, node);
  }
  if (['==', '!=', '>', '>=', '<', '<=', '===', '!=='].indexOf(node.operator) > -1) {
    return createBinaryComparatorMutation(file, node);
  }

  throw new Error('Not yet implemented binary');
}

function createCallExpressionMutation(file, node) {
  if (!mutationOptions.removeMethods) {
    return;
  }

  if (node.callee.name === 'require') {
    return;
  }

  if (node.callee.type !== 'MemberExpression') {
    return;
  }

  if (node.callee.property.type !== 'Identifier') {
    // console.log(node);
    throw new Error('Not yet implemented id');
  }

  if (node.loc.start.line !== node.loc.end.line) {
    // console.log(file, node);
    // console.log('Not implemented yet call');
    return;
  }
  var options = {
    line: node.loc.start.line,
    start: node.callee.object.loc.end.column,
    end: node.loc.end.column,
  };
  createFileWithSubstitution(file, options, '');
}

function createUnaryMutation(file, node) {
  if (!mutationOptions.unary) {
    return;
  }

  if (node.loc.start.line !== node.loc.end.line) {
    // console.log(file, node, o);
    throw new Error('Not implemented yet unary');
  }
  var options = {
    line: node.loc.start.line,
    start: node.loc.start.column,
    end: node.loc.start.column + 1,
  };
  createFileWithSubstitution(file, options, '');
}

function createLogicalMutation(file, node) {
  var op = {'||': true, '&&': true};
  delete op[node.operator];
  Object.keys(op).forEach(function(o) {
    if (node.loc.start.line !== node.loc.end.line) {
      // console.log(file, node, o);
      throw new Error('Not implemented yet logical');
    }
    var options = {
      line: node.loc.start.line,
      start: node.left.loc.end.column,
      end: node.right.loc.start.column,
    };
    createFileWithSubstitution(file, options, o);
  });
}

// var file = '/home/tommaso/repos/newton/client_end/iPawn/index.js';
function inspect(file, node) {
  if (!node) {
    return;
  }
  var type = node.type;
  switch(type) {
    case 'Program':
      node.body.forEach(inspect.bind(null, file));
      break;
    case 'ExpressionStatement':
      notiftyNodeType(node);
      break;
    case 'FunctionDeclaration':
      notiftyNodeType(node);
      inspect(file, node.body);
      break;
    case 'BlockStatement':
      notiftyNodeType(node);
      node.body.forEach(inspect.bind(null, file));
      break;
    case 'VariableDeclaration':
      notiftyNodeType(node);
      node.declarations.forEach(inspect.bind(null, file));
      break;
    case 'VariableDeclarator':
      notiftyNodeType(node);
      inspect(file, node.init);
      inspect(file, node.id);
      break;
    case 'ArrayExpression':
      notiftyNodeType(node);
      node.elements.forEach(inspect.bind(null, file));
      break;
    case 'Literal':
      notiftyNodeType(node);
      break;
    case 'Identifier':
      notiftyNodeType(node);
      break;
    case 'CallExpression':
      notiftyNodeType(node);
      createCallExpressionMutation(file, node);
      inspect(file, node.callee);
      node.arguments.forEach(inspect.bind(null, file));
      break;
    case 'IfStatement':
      notiftyNodeType(node);
      inspect(file, node.test);
      inspect(file, node.conequent);
      inspect(file, node.alternate);
      break;
    case 'UnaryExpression':
      createUnaryMutation(file, node);
      notiftyNodeType(node);
      inspect(file, node.argument);
      break;
    case 'MemberExpression':
      notiftyNodeType(node);
      inspect(file, node.object);
      inspect(file, node.property);
      break;
    case 'ReturnStatement':
      // Remove return?
      notiftyNodeType(node);
      inspect(file, node.argument);
      break;
    case 'ObjectExpression':
      notiftyNodeType(node);
      node.properties.forEach(inspect.bind(null, file));
      break;
    case 'Property':
      notiftyNodeType(node);
      inspect(file, node.key);
      inspect(file, node.value);
      break;
    case 'BinaryExpression':
      notiftyNodeType(node);
      createBinaryMutation(file, node);
      inspect(file, node.left);
      inspect(file, node.right);
      break;
    case 'LogicalExpression':
      notiftyNodeType(node);
      createLogicalMutation(file, node);
      inspect(file, node.left);
      inspect(file, node.right);
      break;
    case 'ConditionalExpression':
      notiftyNodeType(node);
      inspect(file, node.test);
      inspect(file, node.conequent);
      inspect(file, node.alternate);
      break;
    case 'NewExpression':
      notiftyNodeType(node);
      inspect(file, node.callee);
      node.arguments.forEach(inspect.bind(null, file));
      break;
    case 'FunctionExpression':
      notiftyNodeType(node);
      node.params.forEach(inspect);
      inspect(file, node.body);
      break;
    case 'ThisExpression':
      notiftyNodeType(node);
      break;
    case 'EmptyStatement':
      notiftyNodeType(node);
      break;
    case 'ForInStatement':
      notiftyNodeType(node);
      inspect(file, node.left);
      inspect(file, node.right);
      inspect(file, node.body);
      break;
    case 'AssignmentExpression':
      notiftyNodeType(node);
      inspect(file, node.left);
      inspect(file, node.right);
      break;
    case 'TryStatement':
      notiftyNodeType(node);
      inspect(file, node.block);
      inspect(file, node.finalizer);
      break;
    case 'SwitchStatement':
      notiftyNodeType(node);
      inspect(file, node.discriminant);
      node.cases.forEach(inspect.bind(null, file));
      break;
    case 'SwitchCase':
      notiftyNodeType(node);
      inspect(file, node.test);
      node.consequent.forEach(inspect);
      break;
    case 'BreakStatement':
      // remove break ?
      notiftyNodeType(node);
      break;
    case 'ThrowStatement':
      // remove throw?
      notiftyNodeType(node);
      inspect(file, node.argument);
      break;
    case 'ForStatement':
      notiftyNodeType(node);
      inspect(file, node.init);
      inspect(file, node.test);
      inspect(file, node.update);
      inspect(file, node.body);
      break;
    case 'UpdateExpression':
      notiftyNodeType(node);
      inspect(file, node.argument);
      break;
    case 'SequenceExpression':
      notiftyNodeType(node);
      node.expressions.forEach(inspect.bind(null, file));
      break;
    case 'WhileStatement':
      notiftyNodeType(node);
      inspect(file, node.test);
      inspect(file, node.body);
      break;
    case 'DoWhileStatement':
      notiftyNodeType(node);
      inspect(file, node.test);
      inspect(file, node.body);
      break;
    case 'ContinueStatement':
      // remove continue?
      notiftyNodeType(node);
      break;
    case 'LabeledStatement':
      notiftyNodeType(node);
      inspect(file, node.label);
      inspect(file, node.body);
      break;
    case 'WithStatement':
      notiftyNodeType(node);
      inspect(file, node.object);
      inspect(file, node.body);
      break;
    case 'DebuggerStatement':
      notiftyNodeType(node);
      break;
    default:
      // console.log(node);
      throw new Error('aaa');
  }
}


function create(basepath, conf, callback) {
  dest = conf.mutation_dir;

  var rfs = {
    readdir: _fs.readdir,
    lstat: _fs.lstat,
    readlink: _fs.readlink,
  }

  rfs.readdir = function(path, cb) {
    _fs.readdir(path, function(err, files) {
      cb(err, files.filter(function(item) {
        var p = _path.join(path, item);
        if (conf.toIgnore.some(p.match.bind(p))) {
          return false;
        }
        if (fs.lstatSync(p).isDirectory()) {
          return true;
        }
        if (conf.toKeep.every(p.match.bind(p))) {
          return true;
        }
        return false;
      }));
    });
  }


  var options = {
    fs: rfs
  };
  var finder = findit(basepath, options);
  finder.on('file', function(file) {
    var src = fs.readFileSync(file).toString().replace(/^#![\/\w]+\s+\w+\n/, '');
    // console.log(file);
    try {
      var tokens = esprima.parse(src, {range: true, loc: true});
      //// console.log(require('util').inspect(tokens, {depth: null}));
      inspect(file, tokens);
    } catch(e) {
      // console.log(file, e);
      if (e.message === 'aaa') {
        throw e;
      }
    }

  });

  finder.on('end', function () {
    callback(null, mutations);
  });
}


module.exports = {
  create: create
};
