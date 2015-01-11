/* global describe, it, beforeEach */
'use strict';

var $ = require('../../index');
var _ = require('lodash');
var path = require('path');
var expect = require('expect.js');

describe('Behalter', function() {

  var root;
  beforeEach(function() {
    root = $.forge();
  });

  describe('#value', function() {
    it('sets and gets a value', function() {
      root.value('myname', 'alice');

      // via method call
      expect(root.value('myname')).to.eql('alice');

      // via getter (as property)
      expect(root.myname).to.eql('alice');
    });

    it('sets multiple value at a once', function() {
      root.value({
        // primitive
        ns: 'user',
        valid: true,

        // object
        users: [
          { id: 'alice', age: 18 },
          { id: 'bob',   age: 20 }
        ],

        // function
        find: function(id) {
          return _.find(root.users, { id: id });
        }
      });

      // primitive
      expect(root.ns).to.eql('user');
      expect(root.valid).to.eql(true);

      // object
      expect(root.users[0]).to.eql({ id: 'alice', age: 18 });
      expect(root.users[1]).to.eql({ id: 'bob',   age: 20 });

      // function
      expect(root.find('alice')).to.eql({ id: 'alice', age: 18 });
    });

    it('builds method chain', function() {
      root
        .value('id', 'alice')
        .value({
          age: 18,
          friends: [ 'bob', 'charlie' ]
        });

      expect(root.id).to.eql('alice');
      expect(root.age).to.eql(18);
      expect(root.friends).eql([ 'bob', 'charlie' ]);
    });

    it('get a value from parent when not found in behalter itself', function() {
      var url = require('url');

      var $conf = root.child('config').value({
        ip: '127.0.0.1',
        port: 3000,
        protocol: 'http'
      });

      var $srvc = root.child('service').value({
        url: {
          host: function() {
            // `config` can get via root
            return $srvc.config.ip + ':' + $srvc.config.port;
          }
        }
      });

      var $ctrl = root.child('controller').value({
        info: {
          index: function() {
            // `config` and `service` can get via root
            return url.format({
              protocol: $ctrl.config.protocol,
              host: $ctrl.service.url.host(),
              pathname: '/'
            });
          }
        }
      });

      // get value from itself
      expect($conf.ip).to.eql('127.0.0.1');

      // get value from child
      expect(root.config.ip).to.eql('127.0.0.1');

      // get value via root
      expect($srvc.config.ip).to.eql('127.0.0.1');
      expect($ctrl.config.ip).to.eql('127.0.0.1');

      // get and call function from root
      expect(root.controller.info.index()).to.be('http://127.0.0.1:3000/');

      // get and call function via root
      expect($ctrl.info.index()).to.eql('http://127.0.0.1:3000/');

      // cannot access other behalter's values which cannot access from root

      // srvc -> ctrl
      expect($srvc.info).to.eql(undefined);

      // ctrl -> srvc
      expect($ctrl.url).to.eql(undefined);
    });

    it('throws error when try to set with reserved name (case 1)', function() {
      expect(root.value).withArgs('value', 1).to.throwError(/reserved/);
    });

    it('throws error when try to set with reserved name (case 2)', function() {
      expect(root.value).withArgs('factory', function() {}).to.throwError(/reserved/);
    });

    it('throws error when try to set with reserved name (case 3)', function() {
      expect(root.value).withArgs('root', {}).to.throwError(/reserved/);
    });

    it('throws error when try to set with reserved name (case 4)', function() {
      expect(root.value).withArgs('parent', {}).to.throwError(/reserved/);
    });

    it('throws error when try to set with reserved name (case 5)', function() {
      expect(root.value).withArgs('child', {}).to.throwError(/reserved/);
    });

    it('throws error when try to set with reserved name (case 6)', function() {
      expect(root.value).withArgs('exec', function() {}).to.throwError(/reserved/);
    });

    it('throws error when try to set with reserved name (case 7)', function() {
      expect(root.value).withArgs('install', function() {}).to.throwError(/reserved/);
    });

    it('throws error when try to set with reserved name (case 8)', function() {
      expect(root.value).withArgs('length', 3).to.throwError(/reserved/);
    });
  });

  describe('#get', function() {
    it('is alias of #value', function() {
      root.value('myname', 'alice');

      expect(root.get('myname')).to.eql('alice');
    });
  });

  describe('#set', function() {
    it('is alias of #value', function() {
      root.set('myname', 'alice');

      expect(root.myname).to.eql('alice');
    });
  });

  describe('#factory', function() {
    it('sets factory function and gets a returned value', function() {
      root.factory('myuser', function() {
        return {
          name: 'alice',
          age: 18
        };
      });

      // via method call
      expect(root.factory('myuser')).to.eql({ name: 'alice', age: 18 });

      // via getter (as property)
      expect(root.myuser).to.eql({ name: 'alice', age: 18 });

      // always fresh value
      var val1 = root.myuser;
      var val2 = root.myuser;

      expect(val1).not.to.be(val2);
    });

    it('sets multiple factory at a once', function() {
      root.factory({
        user1: function() {
          return {
            name: 'alice',
            age: 18
          };
        },
        user2: function() {
          return {
            name: 'bob',
            age: 20
          };
        }
      });

      expect(root.user1).to.eql({ name: 'alice', age: 18 });
      expect(root.user2).to.eql({ name: 'bob',   age: 20 });
    });

    it('builds method chain', function() {
      root
        .factory('morning', function() {
          return {
            message: 'good morning'
          };
        })
        .factory({
          afternoon: function() {
            return {
              message: 'good afternoon'
            };
          },
          night: function() {
            return {
              message: 'good night'
            };
          }
        });

      expect(root.morning.message).to.eql('good morning');
      expect(root.afternoon.message).to.eql('good afternoon');
      expect(root.night.message).eql('good night');
    });

    it('throws error when try to set with reserved name (case 1)', function() {
      expect(root.factory).withArgs('value', 1).to.throwError(/reserved/);
    });

    it('throws error when try to set with reserved name (case 2)', function() {
      expect(root.factory).withArgs('root', {}).to.throwError(/reserved/);
    });

    it('throws error when try to set with reserved name (case 3)', function() {
      expect(root.factory).withArgs('parent', {}).to.throwError(/reserved/);
    });

    it('throws error when try to set with reserved name (case 3)', function() {
      expect(root.factory).withArgs('child', {}).to.throwError(/reserved/);
    });
  });

  describe('#getOption', function() {

    it('gets option value', function() {
      // default values
      expect(root.getOption('useGetter')).to.be(true);
      expect(root.getOption('useSetter')).to.be(false);
    });
  });

  describe('#setOption', function() {

    it('sets option value', function() {
      // inverse
      root.setOption('useGetter', false);
      root.setOption('useSetter', true);

      expect(root.getOption('useGetter')).to.be(false);
      expect(root.getOption('useSetter')).to.be(true);
    });
  });

  describe('#root', function() {
    it('returns root behalter (case 1)', function() {
      expect(root.root()).to.be(root);
    });

    it('returns root behalter (case 2)', function() {
      var child = root.child();

      expect(child.root()).to.be(root);
    });

    it('returns root behalter (case 3)', function() {
      var child = root.child();
      var grandchild = child.child();

      expect(grandchild.root()).to.be(root);
    });
  });

  describe('#parent', function() {
    it('returns parent behalter (case 1)', function() {
      expect(root.parent()).to.be(undefined);
    });

    it('returns parent behalter (case 2)', function() {
      expect(root.child().parent()).to.be(root);
    });

    it('returns parent behalter (case 3)', function() {
      expect(root.child().child().parent().parent()).to.be(root);
    });
  });

  describe('#child', function() {
    it('creates a new child behalter', function() {
      var child = root.child();
      var grandchild = child.child();

      expect(child.parent()).to.be(root);
      expect(grandchild.parent()).to.be(child);
    });

    it('creates and set a new child behalter', function() {
      var child = root.child('hoge');

      expect(root.hoge).to.be(child);
    });
  });

  describe('#forge', function() {
    it('forges a new independent behalter', function() {
      var forged = root.forge();

      expect(forged.root()).to.be(forged);
      expect(forged.parent()).to.be(undefined);
    });
  });

  describe('#apply', function() {
    it('execute a function with injecting values set in behalter (case 1)', function() {
      root.set({
        repeat: function(message, repeatCount) {
          var s = '';
          _.times(repeatCount, function() {
            s += message;
          });
          return s;
        },
        repeatCount: 5
      });

      expect(root.apply(root.repeat, ['hoge'])).to.eql('hogehogehogehogehoge');
    });

    it('execute a function with injecting values set in behalter (case 2)', function() {
      root.set({
        message: {
          find: function(id, user) {
            var message = _.find([
              { id: 1, uid: 'alice', body: 'message 1' },
              { id: 2, uid: 'bob',   body: 'message 2' }
            ], { id: id });

            message.user = user.find(message.uid);

            return message;
          }
        },
        user: {
          find: function(id) {
            return _.find([
              { id: 'alice', age: 18 },
              { id: 'bob',   age: 20 }
            ], { id: id });
          }
        }
      });

      var actual = root.apply(root.message.find, [1]);
      var expected = {
        id: 1,
        uid: 'alice',
        body: 'message 1',
        user: {
          id: 'alice',
          age: 18
        }
      };

      expect(actual).to.eql(expected);
    });

    it('throws error if args is not an array', function() {
      root.set({
        repeat: function(message, repeatCount) {
          var s = '';
          _.times(repeatCount, function() {
            s += message;
          });
          return s;
        },
        repeatCount: 5
      });

      expect(root.apply).withArgs(root.repeat, 'hoge').to.throwError();
    });
  });

  describe('#call', function() {
    it('execute a function with injecting values set in behalter (case 1)', function() {
      root.set({
        repeat: function(message, repeatCount) {
          var s = '';
          _.times(repeatCount, function() {
            s += message;
          });
          return s;
        },
        repeatCount: 5
      });

      expect(root.call(root.repeat, 'hoge')).to.eql('hogehogehogehogehoge');
    });

    it('execute a function with injecting values set in behalter (case 2)', function() {
      root.set({
        message: {
          find: function(id, user) {
            var message = _.find([
              { id: 1, uid: 'alice', body: 'message 1' },
              { id: 2, uid: 'bob',   body: 'message 2' }
            ], { id: id });

            message.user = user.find(message.uid);

            return message;
          }
        },
        user: {
          find: function(id) {
            return _.find([
              { id: 'alice', age: 18 },
              { id: 'bob',   age: 20 }
            ], { id: id });
          }
        }
      });

      var actual = root.call(root.message.find, 1);
      var expected = {
        id: 1,
        uid: 'alice',
        body: 'message 1',
        user: {
          id: 'alice',
          age: 18
        }
      };

      expect(actual).to.eql(expected);
    });

    it('execute a function with no args when function requires no arguments', function() {
      root.call(function() {
        expect(arguments.length).to.eql(0);
      });
    });
  });

  describe('#callp', function() {
    it('execute a function with overriding injecting values (case 1)', function() {
      root.set({
        repeat: function(message, repeatCount) {
          var s = '';
          _.times(repeatCount, function() {
            s += message;
          });
          return s;
        },
        repeatCount: 5
      });

      expect(root.callp(root.repeat, { message: 'hoge' })).to.eql('hogehogehogehogehoge');
      expect(root.callp(root.repeat, { message: 'hoge', repeatCount: 2 })).to.eql('hogehoge');
    });
  });

  describe('#install', function() {
    it('install a module with installer function', function() {
      // module.exports = function() {};
      var module = function() {
        var behalter = this;

        behalter.set({
          hello: function(message) {
            return message;
          },
          bye: function() {
            return 'bye';
          }
        });
      };

      root.install(module);

      expect(root.hello('hoge')).to.eql('hoge');
      expect(root.bye()).to.eql('bye');
    });

    it('install a module with installer function with params', function() {
      // module.exports = function(arg) {};
      var module = function(arg) {
        var behalter = this;

        behalter.set({
          greet: function() {
            return arg;
          }
        });

        root.install(module, 'hello, world');

        expect(root.greet()).to.eql('hello, world');
      };
    });

    it('install a module with installer object', function() {
      // module.exports.install = function() {};
      var module = {
        install: function() {
          var behalter = this;

          behalter.set({
            hello: function(message) {
              return message;
            },
            bye: function() {
              return 'bye';
            }
          });
        }
      };

      root.install(module);

      expect(root.hello('hoge')).to.eql('hoge');
      expect(root.bye()).to.eql('bye');
    });

    it('install a module from file path', function() {

      root.install(path.join(__dirname, '../fixt/mod1.js'));
      root.install(path.join(__dirname, '../fixt/mod2.js'));

      expect(root.mod1).to.eql({ name: 'module-1' });
      expect(root.mod2).to.eql({ name: 'module-2' });
    });

    it('install a module from directory path', function() {

      root.install(path.join(__dirname, '../fixt/submod'));

      expect(root.submod1).to.eql({ name: 'submodule-1' });
      expect(root.submod2).to.eql({ name: 'submodule-2' });
      expect(root.submod3).to.eql({ name: 'submodule-3' });
    });
  });

  describe('#emit', function() {
    it('fires event listeners configured with #on (case 1)', function() {
      var count = 0;

      root.on('hoge', function() {
        count += 1;
      });

      // multiple emit for single handler
      root.emit('hoge');
      root.emit('hoge');

      expect(count).to.be(2);
    });

    it('fires event listeners configured with #on (case 2)', function() {
      var count = 0;

      root.on('foo', function() {
        count += 1; 
      });
      root.on('foo', function() {
        count += 2;
      });

      // single emit for multiple handlers
      root.emit('foo');

      expect(count).to.be(3);
    });

    it('fires event listeners configured with #on and #off', function() {
      var count = 0;

      var handler = function() {
        count += 1;
      };

      // on
      root.on('hoge', handler);

      root.emit('hoge');

      expect(count).to.be(1);

      // off
      root.off('hoge', handler);

      root.emit('hoge');

      expect(count).to.be(1);
    });

    it('fires event listeners configured with #once', function() {
      var count = 0;

      root.once('bar', function() {
        count += 1;
      });

      root.emit('bar');
      root.emit('bar');

      expect(count).to.be(1);
    });

    it('fires event listeners with injecting values', function() {
      root.set({
        user: {
          find: function(id) {
            return _.find([
              { id: 1, name: 'Alice'  },
              { id: 2, name: 'Bob'    },
              { id: 3, name: 'Charlie'} 
            ], { id: id });
          }
        }
      });

      root.on('user.find', function(user, id) {
        expect(user.find(id).id).to.eql(id);
      });

      root.emit('user.find', 1);
      root.emit('user.find', 2);
      root.emit('user.find', 3);
    });
  });

  it('cannot access value as property if useGetter is false', function() {

    root.setOption('useGetter', false);

    root.value('myname', 'alice');

    // try access: failure
    expect(root.myname).to.be(undefined);
  });

  it('cannot assign value or factory if useSetter is false', function() {

    root.setOption('useSetter', false);

    root.value('myname', 'alice');
    root.factory('myuser', function() {
      return { name: 'bob', age: 18 };
    });

    expect(root.myname).to.eql('alice');
    expect(root.myuser).to.eql({ name: 'bob', age: 18 });

    // try assign: failure
    root.myname = 'charlie';
    root.myuser = function() {
      return { name: 'dave', age: 20 };
    };

    expect(root.myname).to.eql('alice');
    expect(root.myuser).to.eql({ name: 'bob', age: 18 });
  });

  it('can assign value or factory if useSetter is true', function() {

    root.setOption('useSetter', true);

    root.value('myname', 'alice');
    root.factory('myuser', function() {
      return { name: 'bob', age: 18 };
    });

    // try assign: success
    expect(root.myname).to.eql('alice');
    expect(root.myuser).to.eql({ name: 'bob', age: 18 });

    root.myname = 'charlie';
    root.myuser = function() {
      return { name: 'dave', age: 20 };
    };

    expect(root.myname).to.eql('charlie');
    expect(root.myuser).to.eql({ name: 'dave', age: 20 });
  });
});

