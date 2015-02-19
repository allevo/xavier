'use strict';


function Animal(name) {
  this.name = name;
}
Animal.prototype.walk = function() {
  console.log(this.name, 'are walking');
}
Animal.prototype.doSomething = function(end) {
  for(var i=0; i < end; i++) {
    if (i%4 || i%3) {
      console.log('oki', i);
    }
  }
}

var bb = [1, 2, 3, 4, 'aa'];

module.exports = {
  a: 33,
  Animal: Animal
};
