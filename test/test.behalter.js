/* global describe, it, beforeEach */
'use strict';

var $ = require('../');
var _ = require('lodash');
var expect = require('expect.js');

describe('behalter', function() {

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

    it('throws error when try to set with reserved name (case 1)', function() {
      expect(root.value).withArgs('value', 1).to.throwError(/reserved/);
    });

    it('throws error when try to set with reserved name (case 2)', function() {
      expect(root.value).withArgs('root', {}).to.throwError(/reserved/);
    });

    it('throws error when try to set with reserved name (case 3)', function() {
      expect(root.value).withArgs('parent', {}).to.throwError(/reserved/);
    });

    it('throws error when try to set with reserved name (case 3)', function() {
      expect(root.value).withArgs('child', {}).to.throwError(/reserved/);
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
});

