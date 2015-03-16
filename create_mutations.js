'use strict';

var fs = require('fs');
var util = require('util');
var _ = require('lodash');
var findit = require('findit');
var _fs = require('fs');
var _path = require('path');
var esprima = require('esprima');
var md5 = require('MD5');


function MutationCreator(conf) {
  this.mutations = {};
  this.conf = conf;
  this.mutationOptions = conf.mutationOptions || {
    comparation: true,
    operation: true,
    removeMethods: true,
    unary: true,
    logical: true,
  };
}

MutationCreator.prototype.notiftyNodeType = function(node) {
  // console.log(node.type);
};

MutationCreator.prototype.create = function(callback) {
  var rfs = {
    readdir: _fs.readdir,
    lstat: _fs.lstat,
    readlink: _fs.readlink,
  }

  var self = this;
  rfs.readdir = function(path, cb) {
    _fs.readdir(path, function(err, files) {
      cb(err, files.filter(function(item) {
        var p = _path.join(path, item);
        if (self.conf.toIgnore.some(p.match.bind(p))) {
          return false;
        }
        if (fs.lstatSync(p).isDirectory()) {
          return true;
        }
        if (self.conf.toKeep.every(p.match.bind(p))) {
          console.log(p);
          return true;
        }
        return false;
      }));
    });
  }

  var finder = findit(this.conf.project_dir, { fs: rfs });
  finder.on('file', this.createMutationForFile.bind(this));

  var self = this;
  finder.on('end', function () {
    callback(null, self.mutations);
  });
};

MutationCreator.prototype.createMutationForFile = function(file) {
  var src = fs.readFileSync(file).toString().replace(/^#![\/\w]+\s+\w+\n/, '');
  try {
    var tokens = esprima.parse(src, {range: true, loc: true});
    this.inspect(file, tokens);
  } catch(e) {
    if (e.message === 'aaa') {
      throw e;
    }
  }
};


MutationCreator.prototype.inspect = function inspect(file, node) {
  if (!node) {
    return;
  }
  var type = node.type;
  switch(type) {
    case 'Program':
      node.body.forEach(this.inspect.bind(this, file));
      break;
    case 'ExpressionStatement':
      this.notiftyNodeType(node);
      break;
    case 'FunctionDeclaration':
      this.notiftyNodeType(node);
      this.inspect(file, node.body);
      break;
    case 'BlockStatement':
      this.notiftyNodeType(node);
      node.body.forEach(this.inspect.bind(this, file));
      break;
    case 'VariableDeclaration':
      this.notiftyNodeType(node);
      node.declarations.forEach(this.inspect.bind(this, file));
      break;
    case 'VariableDeclarator':
      this.notiftyNodeType(node);
      this.inspect(file, node.init);
      this.inspect(file, node.id);
      break;
    case 'ArrayExpression':
      this.notiftyNodeType(node);
      node.elements.forEach(this.inspect.bind(this, file));
      break;
    case 'Literal':
      this.notiftyNodeType(node);
      break;
    case 'Identifier':
      this.notiftyNodeType(node);
      break;
    case 'CallExpression':
      this.notiftyNodeType(node);
      this.createCallExpressionMutation(file, node);
      this.inspect(file, node.callee);
      node.arguments.forEach(this.inspect.bind(this, file));
      break;
    case 'IfStatement':
      this.notiftyNodeType(node);
      this.inspect(file, node.test);
      this.inspect(file, node.conequent);
      this.inspect(file, node.alternate);
      break;
    case 'UnaryExpression':
      this.createUnaryMutation(file, node);
      this.notiftyNodeType(node);
      this.inspect(file, node.argument);
      break;
    case 'MemberExpression':
      this.notiftyNodeType(node);
      this.inspect(file, node.object);
      this.inspect(file, node.property);
      break;
    case 'ReturnStatement':
      // Remove return?
      this.notiftyNodeType(node);
      this.inspect(file, node.argument);
      break;
    case 'ObjectExpression':
      this.notiftyNodeType(node);
      node.properties.forEach(this.inspect.bind(this, file));
      break;
    case 'Property':
      this.notiftyNodeType(node);
      this.inspect(file, node.key);
      this.inspect(file, node.value);
      break;
    case 'BinaryExpression':
      this.notiftyNodeType(node);
      this.createBinaryMutation(file, node);
      this.inspect(file, node.left);
      this.inspect(file, node.right);
      break;
    case 'LogicalExpression':
      this.notiftyNodeType(node);
      this.createLogicalMutation(file, node);
      this.inspect(file, node.left);
      this.inspect(file, node.right);
      break;
    case 'ConditionalExpression':
      this.notiftyNodeType(node);
      this.inspect(file, node.test);
      this.inspect(file, node.conequent);
      this.inspect(file, node.alternate);
      break;
    case 'NewExpression':
      this.notiftyNodeType(node);
      this.inspect(file, node.callee);
      node.arguments.forEach(this.inspect.bind(this, file));
      break;
    case 'FunctionExpression':
      this.notiftyNodeType(node);
      node.params.forEach(this.inspect);
      this.inspect(file, node.body);
      break;
    case 'ThisExpression':
      this.notiftyNodeType(node);
      break;
    case 'EmptyStatement':
      this.notiftyNodeType(node);
      break;
    case 'ForInStatement':
      this.notiftyNodeType(node);
      this.inspect(file, node.left);
      this.inspect(file, node.right);
      this.inspect(file, node.body);
      break;
    case 'AssignmentExpression':
      this.notiftyNodeType(node);
      this.inspect(file, node.left);
      this.inspect(file, node.right);
      break;
    case 'TryStatement':
      this.notiftyNodeType(node);
      this.inspect(file, node.block);
      this.inspect(file, node.finalizer);
      break;
    case 'SwitchStatement':
      this.notiftyNodeType(node);
      this.inspect(file, node.discriminant);
      node.cases.forEach(this.inspect.bind(this, file));
      break;
    case 'SwitchCase':
      this.notiftyNodeType(node);
      this.inspect(file, node.test);
      node.consequent.forEach(this.inspect);
      break;
    case 'BreakStatement':
      // remove break ?
      this.notiftyNodeType(node);
      break;
    case 'ThrowStatement':
      // remove throw?
      this.notiftyNodeType(node);
      this.inspect(file, node.argument);
      break;
    case 'ForStatement':
      this.notiftyNodeType(node);
      this.inspect(file, node.init);
      this.inspect(file, node.test);
      this.inspect(file, node.update);
      this.inspect(file, node.body);
      break;
    case 'UpdateExpression':
      this.notiftyNodeType(node);
      this.inspect(file, node.argument);
      break;
    case 'SequenceExpression':
      this.notiftyNodeType(node);
      node.expressions.forEach(this.inspect.bind(this, file));
      break;
    case 'WhileStatement':
      this.notiftyNodeType(node);
      this.inspect(file, node.test);
      this.inspect(file, node.body);
      break;
    case 'DoWhileStatement':
      this.notiftyNodeType(node);
      this.inspect(file, node.test);
      this.inspect(file, node.body);
      break;
    case 'ContinueStatement':
      // remove continue?
      this.notiftyNodeType(node);
      break;
    case 'LabeledStatement':
      this.notiftyNodeType(node);
      this.inspect(file, node.label);
      this.inspect(file, node.body);
      break;
    case 'WithStatement':
      this.notiftyNodeType(node);
      this.inspect(file, node.object);
      this.inspect(file, node.body);
      break;
    case 'DebuggerStatement':
      this.notiftyNodeType(node);
      break;
    default:
      // console.log(node);
      throw new Error('aaa');
  }
}

MutationCreator.prototype.createFileWithSubstitution = function (file, loc, sub) {
  var rows = fs.readFileSync(file).toString().split('\n');

  rows[loc.line -1 ] = [
    rows[loc.line - 1].slice(0, loc.start),
    sub,
    rows[loc.line - 1].slice(loc.end)
  ].join(' ');
  // console.log(rows[loc.line - 1]);
  var name = md5(rows.join('\n'));
  fs.writeFileSync(this.conf.mutation_dir + '/' + name + '.js', rows.join('\n'));

  this.mutations[name] = {
    file: file,
    subLoc: loc,
    md5: name,
  };
}

MutationCreator.prototype.createBinaryComparatorMutation = function(file, node) {
  if (!mutationOptions.comparation) {
    return;
  }

  var op = {'==': true, '!=': true, '>': true, '>=': true, '<': true, '<=': true, '===': true, '!==': true};
  delete op[node.operator];
  var self = this;
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
    self.createFileWithSubstitution(file, options, o);
  });
}

MutationCreator.prototype.createBinaryOperationMutation = function(file, node) {
  if (!this.mutationOptions.operation) {
    return;
  }

  var op = {'+': true, '*': true, '/': true, '-': true};
  delete op[node.operator];
  var self = this;
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
    self.createFileWithSubstitution(file, options, o);
  });
}

MutationCreator.prototype.createBinaryMutation = function(file, node) {
  if (['in', 'instanceof'].indexOf(node.operator) > -1 ) { return; }

  if (['+', '*', '/', '-'].indexOf(node.operator) > -1) {
    return this.createBinaryOperationMutation(file, node);
  }
  if (['==', '!=', '>', '>=', '<', '<=', '===', '!=='].indexOf(node.operator) > -1) {
    return this.createBinaryComparatorMutation(file, node);
  }

  throw new Error('Not yet implemented binary');
}

MutationCreator.prototype.createCallExpressionMutation = function(file, node) {
  if (!this.mutationOptions.removeMethods) {
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
  this.createFileWithSubstitution(file, options, '');
}

MutationCreator.prototype.createUnaryMutation = function(file, node) {
  if (!this.mutationOptions.unary) {
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
  this.createFileWithSubstitution(file, options, '');
}

MutationCreator.prototype.createLogicalMutation = function(file, node) {
  if (!this.mutationOptions.logical) {
    return;
  }
  var op = {'||': true, '&&': true};
  delete op[node.operator];
  var self = this;
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
    self.createFileWithSubstitution(file, options, o);
  });
}

// var file = '/home/tommaso/repos/newton/client_end/iPawn/index.js';


module.exports = MutationCreator;
