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
var $ = require('behalter');

// global scope
$.value({
  protocol: 'http',
  hostname: 'myhost.mydomain',
  port: 3000,
  env: 'development'
});

// child scope
$.child('user')
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

console.log($.protocol); // => 'http'
console.log($.port);     // => 3000

$.user.findById('alice', function(err, user) {
  if (err) {
    console.error(err);
  }
  console.log(user);
});
```

### As factory container

```javascript
// global behalter
var $ = require('behalter');

var seq = 1;
$.factory({
  sequence: function() {
    return seq++;
  },
  fixture: function() {
    return ['alice', 'bob'];
  }
});

console.log($.sequence); // => 1
console.log($.sequence); // => 2

var fixt1 = $.fixture;
fixt1.push('charlie');

var fixt2 = $.fixture;
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
var $ = require('behalter');

$.child('service')
  .install(require('mymodule'));

$.service.mymodule.hello(); // => 'hello'
```
