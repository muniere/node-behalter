# node-behalter

[![Build Status](https://travis-ci.org/muniere/node-behalter.svg)](https://travis-ci.org/muniere/node-behalter)

Node behalter is a simple container.

## Installation

```bash
$ npm install behalter
```

## Usage

### As value container

```javascript
// global behalter
var behalter = require('behalter');

// global scope
behalter.value({
  protocol: 'http',
  hostname: 'myhost.mydomain',
  port: 3000,
  env: 'development'
});

// child scope
behalter.child('user')
  .set({
    findById: function(id, callback) {
      // code to find a user
    },
    create: function(attributes, callback) {
      // code to create a user
    },
    delete: function(id, callback) {
      // code to delete a user
    }
  });

console.log(behalter.protocol); // => 'http'
console.log(behalter.port);     // => 3000

behalter.user.findById('alice', function(err, user) {
  if (err) {
    console.error(err);
  }
  console.log(user);
});
```

### As factory container

```javascript
// global behalter
var behalter = require('behalter');

var seq = 1;
behalte.factory({
  sequence: function() {
    return seq++;
  },
  fixture: function() {
    return ['alice', 'bob'];
  }
});

console.log(behalter.sequence); // => 1
console.log(behalter.sequence); // => 2

var fixt1 = behalter.fixture;
fixt1.push('charlie');

var fixt2 = behalter.fixture;
fixt2.push('dave');

console.log(fixt1); // => ['alice', 'bob', 'charlie']
console.log(fixt2); // => ['alice', 'bob', 'dave']
```

### Install module

```javascript
// mymodule.js
module.exports = function() {
  var behalter = this;

  behalter.set('mymodule', {
    hello: function() {
      console.log('hello');
    }
  });
};

// app.js
var behalter = require('behalter');

behalter.child('service')
  .install(require('mymodule'));

behalter.service.mymodule.hello(); // => 'hello'
```
