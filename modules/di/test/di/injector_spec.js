import {describe, it, expect, beforeEach} from 'test_lib/test_lib';
import {Injector, Inject, bind} from 'di/di';

class Engine {}
class Dashboard {}
class TurboEngine extends Engine{}

class Car {
  constructor(engine:Engine) {
    this.engine = engine;
  }
}

class CarWithDashboard {
  constructor(engine:Engine, dashboard:Dashboard) {
    this.engine = engine;
    this.dashboard = dashboard;
  }
}

class SportsCar extends Car {
  constructor(engine:Engine) {
    super(engine);
  }
}

class CarWithInject {
  constructor(@Inject(TurboEngine) engine:Engine) {
    this.engine = engine;
  }
}

export function main() {
  describe('injector', function() {
    it('should instantiate a class without dependencies', function() {
      var injector = new Injector([Engine]);
      var engine = injector.get(Engine);

      expect(engine).toBeAnInstanceOf(Engine);
    });

    it('should resolve dependencies based on type information', function() {
      var injector = new Injector([Engine, Car]);
      var car = injector.get(Car);

      expect(car).toBeAnInstanceOf(Car);
      expect(car.engine).toBeAnInstanceOf(Engine);
    });

    it('should resolve dependencies based on @Inject annotation', function() {
      var injector = new Injector([TurboEngine, Engine, CarWithInject]);
      var car = injector.get(CarWithInject);

      expect(car).toBeAnInstanceOf(CarWithInject);
      expect(car.engine).toBeAnInstanceOf(TurboEngine);
    });

    it('should cache instances', function() {
      var injector = new Injector([Engine]);

      var e1 = injector.get(Engine);
      var e2 = injector.get(Engine);

      expect(e1).toBe(e2);
    });

    it('should bind to a value', function() {
      var injector = new Injector([
        bind(Engine).toValue("fake engine")
      ]);

      var engine = injector.get(Engine);
      expect(engine).toEqual("fake engine");
    });

    it('should bind to a factory', function() {
      var injector = new Injector([
        Engine,
        bind(Car).toFactory([Engine], (e) => new SportsCar(e))
      ]);

      var car = injector.get(Car);
      expect(car).toBeAnInstanceOf(SportsCar);
      expect(car.engine).toBeAnInstanceOf(Engine);
    });

    it('should use non-type tokens', function() {
      var injector = new Injector([
        bind('token').toValue('value')
      ]);

      expect(injector.get('token')).toEqual('value');
    });

    it('should throw when given invalid bindings', function() {
      expect(() => new Injector(["blah"])).toThrowError('Invalid binding blah');
      expect(() => new Injector([bind("blah")])).toThrowError('Invalid binding blah');
    });

    describe("child", function () {
      it('should load instances from parent injector', function() {
        var parent = new Injector([Engine]);
        var child = parent.createChild([]);

        var engineFromParent = parent.get(Engine);
        var engineFromChild = child.get(Engine);

        expect(engineFromChild).toBe(engineFromParent);
      });

      it('should create new instance in a child injector', function() {
        var parent = new Injector([Engine]);
        var child = parent.createChild([
          bind(Engine).toClass(TurboEngine)
        ]);

        var engineFromParent = parent.get(Engine);
        var engineFromChild = child.get(Engine);

        expect(engineFromParent).not.toBe(engineFromChild);
        expect(engineFromChild).toBeAnInstanceOf(TurboEngine);
      });
    });

    it('should provide itself', function() {
      var parent = new Injector([]);
      var child = parent.createChild([]);

      expect(child.get(Injector)).toBe(child);
    });

    it('should throw when no provider defined', function() {
      var injector = new Injector([]);
      expect(() => injector.get('NonExisting')).toThrowError('No provider for NonExisting!');
    });

    it('should show the full path when no provider', function() {
      var injector = new Injector([CarWithDashboard, Engine]);

      expect(() => injector.get(CarWithDashboard)).
        toThrowError('No provider for Dashboard! (CarWithDashboard -> Dashboard)');
    });
  });
}
