/* global describe, it */
'use strict';

var _ = require('lodash');
var expect = require('expect.js');
var EventEmitter2 = require('../lib/eventemitter2').EventEmitter2;

describe('EventEmitter2', function() {

  it('can configure by constructor', function() {

    var config = {
      // should the event emitter use wildcards.
      wildcard: true,

      // the delimiter used to segment namespaces, defaults to `.`.
      delimiter: '::::',

      // the max number of listeners that can be assigned to an event, defaults to 10.
      maxListeners: 20
    };

    var emitter = new EventEmitter2(config).removeAllListeners();

    expect(emitter._events.maxListeners).to.eql(config.maxListeners);
    expect(emitter._conf.maxListeners).to.eql(config.maxListeners);
    expect(emitter._conf.delimiter).to.eql(config.delimiter);
    expect(emitter._conf.wildcard).to.eql(config.wildcard);
  });

  describe('#setMaxListeners', function() {

    it('can reconfigure the max number of event listeners', function() {

      var amount = 99;
      var emitter = new EventEmitter2().removeAllListeners();

      emitter.setMaxListeners(amount);

      expect(emitter._events.maxListeners).to.eql(amount);
      expect(emitter._conf.maxListeners).to.eql(amount);
    });
  });

  describe('#on', function() {

    it('can add a single listener on a single event', function() {

      var emitter = new EventEmitter2();

      emitter.on('test1', function() {});

      expect(emitter.listeners('test1')).to.have.length(1);
    });

    it('can add two listeners on a single event', function() {

      var emitter = new EventEmitter2();

      emitter.on('test1', function() {});
      emitter.on('test1', function() {});

      expect(emitter.listeners('test1')).to.have.length(2);
    });

    it('can add three listeners on a single event', function() {

      var emitter = new EventEmitter2();

      emitter.on('test1', function() {});
      emitter.on('test1', function() {});
      emitter.on('test1', function() {});

      expect(emitter.listeners('test1')).to.have.length(3);
    });

    it('can add two listeners to two different events', function() {

      var emitter = new EventEmitter2();

      var count = 0;
      var increment = function() {
        count += 1;
      };

      emitter.onAny(increment);
      emitter.emit('error');

      expect(count).to.be(1);
    });

    describe('when argument is only a function', function() {

      it('behave as alias of onAny(function)', function() {

        var emitter = new EventEmitter2();

        var count = 0;
        var increment = function() {
          count += 1;
        };

        emitter.on(increment);

        emitter.emit('foo');
        emitter.emit('bar');

        expect(count).to.be(2);
      });
    });

    it('set warned flag when added more then max number of event handlers', function() {

      var type = 'foobar';
      var emitter = new EventEmitter2({ silent: true });

      _.times(10, function() {
        emitter.on(type, function() {});
      });
      emitter.on(type, function() {});

      expect(emitter.listeners(type)).to.have.length(11);
      expect(emitter._events[type].warned).to.be.ok();
    });

    it('do not set warned flag when max number of listeners is more than added listeners', function() {

      var type = 'foobar';
      var emitter = new EventEmitter2({ maxListeners: 20 });

      _.times(15, function() {
        emitter.on(type, function() {});
      });

      expect(emitter.listeners(type)).to.have.length(15);
      expect(emitter._events[type].warned).not.to.be.ok();
    });

    it('can change max number of listeners after adding some listeners', function() {

      var type = 'foobar';
      var emitter = new EventEmitter2();

      _.times(10, function() {
        emitter.on(type, function() {});
      });

      expect(emitter.listeners(type)).to.have.length(10);
      expect(emitter._events[type].warned).not.to.be.ok();

      emitter.setMaxListeners(100);
      emitter.on(type, function() {});

      expect(emitter.listeners(type)).to.have.length(11);
      expect(emitter._events[type].warned).not.to.be.ok();
    });
  });

  describe('#off', function() {

    it('can remove a handler from event (case 1)', function() {

      var type = 'remove';
      var handler = function() {};

      var emitter = new EventEmitter2();

      expect(emitter.listeners(type)).to.have.length(0);

      emitter.on(type, handler);
      expect(emitter.listeners(type)).to.have.length(1);

      emitter.off(type, handler);
      expect(emitter.listeners(type)).to.have.length(0);
    });

    it('can remove a handler from event (case 2)', function() {

      var type = 'remove';
      var handler = function() {};

      var emitter = new EventEmitter2();

      expect(emitter.listeners(type)).to.have.length(0);

      emitter.on(type, handler);
      emitter.on(type, handler);
      expect(emitter.listeners(type)).to.have.length(2);

      emitter.off(type, handler);
      expect(emitter.listeners(type)).to.have.length(1);
    });

    it('can remove a handler from event (case 3)', function() {

      var type = 'remove';
      var handler = function() {};

      var emitter = new EventEmitter2();

      expect(emitter.listeners(type)).to.have.length(0);

      emitter.on(type, handler);
      emitter.on(type, handler);
      emitter.on(type, handler);
      expect(emitter.listeners(type)).to.have.length(3);

      emitter.off(type, handler);
      emitter.off(type, handler);
      expect(emitter.listeners(type)).to.have.length(1);
    });

    it('throws error when second argument is not a function', function() {

      var type = 'remove';
      var handler = function() {};
      var emitter = new EventEmitter2();

      expect(emitter.listeners(type)).to.have.length(0);

      emitter.on(type, handler);
      expect(emitter.listeners(type)).to.have.length(1);

      expect(emitter.off).withArgs(type, type).to.throwError();
      expect(emitter.listeners(type)).to.have.length(1);
    });

    it('cannot remove a handler when second argument is not a same function', function() {

      var type = 'remove';
      var handler1 = function() {};
      var handler2 = function() {};
      var emitter = new EventEmitter2();

      expect(emitter.listeners(type)).to.have.length(0);

      emitter.on(type, handler1);
      expect(emitter.listeners(type)).to.have.length(1);

      emitter.off(type, handler2);
      expect(emitter.listeners(type)).to.have.length(1);
    });

    it('can remove all listeners of an event', function() {

      var type = 'remove';
      var handler = function() {};
      var emitter = new EventEmitter2();

      expect(emitter.listeners(type)).to.have.length(0);

      _.times(10, function() {
        emitter.on(type, handler);
      });

      expect(emitter.listeners(type)).to.have.length(10);

      emitter.off(type, handler);
      expect(emitter.listeners(type)).to.have.length(9);

      emitter.removeAllListeners(type);
      expect(emitter.listeners(type)).to.be.empty();
    });

    it('never affect handlers for other events', function() {

      var type1 = 'remove';
      var type2 = 'reject';
      var handler = function() {};
      var emitter = new EventEmitter2();

      expect(emitter.listeners(type1)).to.have.length(0);

      _.times(10, function() {
        emitter.on(type1, handler);
      });

      expect(emitter.listeners(type1)).to.have.length(10);

      emitter.off(type2, handler);
      expect(emitter.listeners(type1)).to.have.length(10);

      emitter.removeAllListeners(type2, handler);
      expect(emitter.listeners(type1)).to.have.length(10);

      emitter.removeAllListeners(type1, handler);
      expect(emitter.listeners(type1)).to.be.empty();
    });
  });

  describe('#emit', function() {

    it('fire two listeners on emitting a event (case 1)', function() {

      var emitter = new EventEmitter2();

      var count1 = 0;
      var handler1 = function() {
        count1 += 1;
      };

      var count2 = 0;
      var handler2 = function() {
        count2 += 1;
      };

      emitter.on('test2', handler1);
      emitter.on('test2', handler2);

      emitter.emit('test2');

      expect(count1).to.be(1);
      expect(count2).to.be(1);
    });

    it('fire two listeners on emitting a event (case 2)', function() {

      var emitter = new EventEmitter2();

      var count1 = 0;
      var handler1 = function() {
        count1 += 1;
      };

      var count2 = 0;
      var handler2 = function() {
        count2 += 1;
      };

      emitter.on('test2', handler1);
      emitter.on('test2', handler2);

      emitter.emit('test2');
      emitter.emit('test2');

      expect(count1).to.be(2);
      expect(count2).to.be(2);
    });

    it('can fire two listeners with arguments on emitting an event (case 1)', function() {

      var emitter = new EventEmitter2();

      var message = 'Hello, Node';

      var handler1 = function(val) {
        expect(val).to.eql(message);
      };

      var handler2 = function(val) {
        expect(val).to.eql(message);
      };

      emitter.on('test2', handler1);
      emitter.on('test2', handler2);

      emitter.emit('test2', message);
    });

    it('can fire two listeners with arguments on emitting an event (case 2)', function() {

      var emitter = new EventEmitter2();

      var messages = [
        'Hello, Node1',
        'Hello, Node2'
      ];

      var handler1 = function(val) {
        expect(messages).to.contain(val);
      };

      var handler2 = function(val) {
        expect(messages).to.contain(val);
      };

      emitter.on('test2', handler1);
      emitter.on('test2', handler2);

      emitter.emit('test2', messages[0]);
      emitter.emit('test2', messages[1]);
    });

    it('fire two listeners with multiple arguments on emitting an event', function() {

      var emitter = new EventEmitter2();

      var messages = [
        'Hello, Node1',
        'Hello, Node2',
        'Hello, Node3'
      ];

      var handler1 = function(value1, value2, value3) {
        expect(value1).to.eql(messages[0]);
        expect(value2).to.eql(messages[1]);
        expect(value3).to.eql(messages[2]);
      };

      var handler2 = function(value1, value2, value3) {
        expect(value1).to.eql(messages[0]);
        expect(value2).to.eql(messages[1]);
        expect(value3).to.eql(messages[2]);
      };

      emitter.on('test2', handler1);
      emitter.on('test2', handler2);

      emitter.emit('test2', messages[0], messages[1], messages[2]);
      emitter.emit('test2', messages[0], messages[1], messages[2]);
    });

    it('returns true if handlers were called', function() {

      var emitter = new EventEmitter2();

      var handler = function() {};

      emitter.on('test6', handler);

      expect(emitter.emit('test6')).to.be.ok();
      expect(emitter.emit('other')).not.to.be.ok();

      emitter.onAny(handler);
      expect(emitter.emit('other')).to.be.ok();
    });
  });

  describe('#once', function() {

    it('listen event only once and then be removed', function() {

      var emitter = new EventEmitter2();

      var count = 0;
      var increment = function() {
        count += 1;
      };

      emitter.once('test1', increment);

      expect(emitter.listeners('test1')).to.have.length(1);

      emitter.emit('test1');

      expect(count).to.be(1);
      expect(emitter.listeners('test1')).to.be.empty();

      emitter.emit('test1');

      expect(count).to.be(1);
    });

    it('listener will be removed by #off', function() {

      var emitter = new EventEmitter2();

      var count = 0;
      var increment = function() {
        count += 1;
      };

      emitter.once('test', increment);
      emitter.off('test', increment);

      emitter.emit('test');

      expect(count).to.be(0);
    });
  });

  describe('#many', function() {

    it('listen event only specified times and then be removed', function() {

      var emitter = new EventEmitter2();

      var count = 0;
      var increment = function() {
        count += 1;
      };

      emitter.many('test1', 4, increment);

      expect(emitter.listeners('test1')).to.have.length(1);

      emitter.emit('test1');
      emitter.emit('test1');
      emitter.emit('test1');
      emitter.emit('test1');

      expect(count).to.be(4);
      expect(emitter.listeners('test1')).to.be.empty();

      emitter.emit('test1');

      expect(count).to.be(4);
    });

    it('listen event with parameters only specified times and then be removed', function() {

      var emitter = new EventEmitter2();

      emitter.many('test1', 4, function (value1, value2, value3) {
        expect(value1).to.be.a('number');
        expect(value2).to.be.a('string');
        expect(value3).to.be.a('boolean');
      });

      emitter.emit('test1', 1, 'A', false);
      emitter.emit('test1', 2, 'C', true);
      emitter.emit('test1', 3, 'B', true);
      emitter.emit('test1', 4, 'F', false);

      expect(emitter.listeners('test1')).to.be.empty();

      emitter.emit('test1', 5, 'D', false);
    });
  });
});