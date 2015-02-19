'use strict';

var __old = module.__proto__.require;
/*
module.__proto__.require = function(f) {
  console.log('requiring', f);
  return __old.call(this, f);
}
*/

var fs = require('fs');
var util = require('util');
var _ = require('lodash');
var findit = require('findit');
var _fs = require('fs');
var _path = require('path');
var esprima = require('esprima');

function inspect(node) {
  if (!node) {
    return;
  }
  var type = node.type;
  switch(type) {
    case 'Program':
      node.body.forEach(inspect);
      break;
    case 'ExpressionStatement':
      console.log('ExpressionStatement found...');
      break;
    case 'FunctionDeclaration':
      console.log('FunctionDeclaration found');
      inspect(node.body);
      break;
    case 'BlockStatement':
      console.log('BlockStatement found');
      node.body.forEach(inspect);
      break;
    case 'VariableDeclaration':
      console.log('VariableDeclaration found');
      node.declarations.forEach(inspect);
      break;
    case 'VariableDeclarator':
      console.log('VariableDeclarator found');
      inspect(node.init);
      inspect(node.id);
      break;
    case 'ArrayExpression':
      console.log('ArrayExpression found');
      node.elements.forEach(inspect);
      break;
    case 'Literal':
      console.log('Literal found');
      break;
    case 'Identifier':
      console.log('Identifier found');
      break;
    case 'CallExpression':
      console.log('CallExpression');
      inspect(node.callee);
      node.arguments.forEach(inspect);
      break;
    case 'IfStatement':
      console.log('IfStatement found');
      inspect(node.test);
      inspect(node.conequent);
      inspect(node.alternate);
      break;
    case 'UnaryExpression':
      console.log('UnaryExpression found');
      inspect(node.argument);
      break;
    case 'MemberExpression':
      console.log('MemberExpression found');
      inspect(node.object);
      inspect(node.property);
      break;
    case 'ReturnStatement':
      console.log('ReturnStatement found');
      inspect(node.argument);
      break;
    case 'ObjectExpression':
      console.log('ObjectExpression found');
      node.properties.forEach(inspect);
      break;
    case 'Property':
      console.log('Property found');
      inspect(node.key);
      inspect(node.value);
      break;
    case 'BinaryExpression':
      console.log('BinaryExpression found');
      inspect(node.left);
      inspect(node.right);
      break;
    case 'LogicalExpression':
      console.log('LogicalExpression found');
      inspect(node.left);
      inspect(node.right);
      break;
    case 'ConditionalExpression':
      console.log('ConditionalExpression found');
      inspect(node.test);
      inspect(node.conequent);
      inspect(node.alternate);
      break;
    case 'NewExpression':
      console.log('NewExpression found');
      inspect(node.callee);
      node.arguments.forEach(inspect);
      break;
    case 'FunctionExpression':
      console.log('FunctionExpression found');
      node.params.forEach(inspect);
      inspect(node.body);
      break;
    case 'ThisExpression':
      console.log('ThisExpression found');
      break;
    case 'EmptyStatement':
      console.log('EmptyStatement found');
      break;
    case 'ForInStatement':
      console.log('ForInStatement found');
      inspect(node.left);
      inspect(node.right);
      inspect(node.body);
      break;
    case 'AssignmentExpression':
      console.log('AssignmentExpression found');
      inspect(node.left);
      inspect(node.right);
      break;
    case 'TryStatement':
      console.log('TryStatement found');
      inspect(node.block);
      inspect(node.finalizer);
      break;
    case 'SwitchStatement':
      console.log('SwitchStatement found');
      inspect(node.discriminant);
      node.cases.forEach(inspect);
      break;
    case 'SwitchCase':
      console.log('SwitchCase found');
      inspect(node.test);
      node.consequent.forEach(inspect);
      break;
    case 'BreakStatement':
      console.log('BreakStatement found');
      break;
    case 'ThrowStatement':
      console.log('ThrowStatement found');
      inspect(node.argument);
      break;
    case 'ForStatement':
      console.log('ForStatement found');
      inspect(node.init);
      inspect(node.test);
      inspect(node.update);
      inspect(node.body);
      break;
    case 'UpdateExpression':
      console.log('UpdateExpression found');
      inspect(node.argument);
      break;
    default:
      console.log(node);
      throw new Error('aaa');
  }
}


var rfs = {
  readdir: _fs.readdir,
  lstat: _fs.lstat,
  readlink: _fs.readlink,
}

var toIgnore = [
];
var toKeep = [
  /\.js$/,
];

rfs.readdir = function(path, cb) {
  _fs.readdir(path, function(err, files) {
    cb(err, files.filter(function(item) {
      var p = _path.join(path, item);
      if (toIgnore.some(p.match.bind(p))) {
        return false;
      }
      if (fs.lstatSync(p).isDirectory()) {
        return true;
      }
      if (toKeep.every(p.match.bind(p))) {
        return true;
      }
      return false;
    }));
  });
}

var options = {
  fs: rfs
};

var finder = findit('/home/tommaso/repos/newton/client_end/', options);
finder.on('file', function(file){
  var src = fs.readFileSync(file);
  var tokens = esprima.parse(src, {range: true, loc: true, raw: true});
  inspect(tokens);
});






