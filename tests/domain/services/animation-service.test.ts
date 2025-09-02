import { describe, it, expect } from "bun:test";
import { AnimationService } from "../../../src/domain/services/animation-service";
import { AnimationState } from "../../../src/domain/value-objects/animation-state";

describe("AnimationService", () => {
  describe("createTween", () => {
    it("should create animation state with linear easing", () => {
      const service = new AnimationService();
      const startTime = 1000;
      const startValue = 0;
      const endValue = 100;
      const duration = 500;

      const animation = service.createTween(startTime, startValue, endValue, duration);

      expect(animation.startTime).toBe(startTime);
      expect(animation.startValue).toBe(startValue);
      expect(animation.endValue).toBe(endValue);
      expect(animation.duration).toBe(duration);
    });

    it("should create animation with custom easing", () => {
      const service = new AnimationService();
      const customEasing = (t: number) => t * t;
      
      const animation = service.createTween(1000, 0, 100, 500, customEasing);
      
      // Test that custom easing is applied
      const midValue = animation.getCurrentValue(1250); // t = 0.5, easing(0.5) = 0.25
      expect(midValue).toBe(25);
    });
  });

  describe("updateAnimation", () => {
    it("should return current value for active animation", () => {
      const service = new AnimationService();
      const animation = service.createTween(1000, 0, 100, 500);
      
      const value = service.updateAnimation(animation, 1250);
      
      expect(value).toBe(50);
    });

    it("should return end value for completed animation", () => {
      const service = new AnimationService();
      const animation = service.createTween(1000, 0, 100, 500);
      
      const value = service.updateAnimation(animation, 2000);
      
      expect(value).toBe(100);
    });
  });

  describe("easing functions", () => {
    const service = new AnimationService();

    describe("easeInOut", () => {
      it("should return 0 at start", () => {
        expect(service.easeInOut(0)).toBe(0);
      });

      it("should return 1 at end", () => {
        expect(service.easeInOut(1)).toBe(1);
      });

      it("should return 0.5 at middle", () => {
        expect(service.easeInOut(0.5)).toBe(0.5);
      });

      it("should have smooth curve", () => {
        const quarter = service.easeInOut(0.25);
        const threeQuarter = service.easeInOut(0.75);
        
        expect(quarter).toBeLessThan(0.25);
        expect(threeQuarter).toBeGreaterThan(0.75);
      });
    });

    describe("easeIn", () => {
      it("should return 0 at start", () => {
        expect(service.easeIn(0)).toBe(0);
      });

      it("should return 1 at end", () => {
        expect(service.easeIn(1)).toBe(1);
      });

      it("should have slow start", () => {
        const quarter = service.easeIn(0.25);
        expect(quarter).toBeLessThan(0.25);
      });

      it("should accelerate towards end", () => {
        const threeQuarter = service.easeIn(0.75);
        expect(threeQuarter).toBeGreaterThan(0.5);
      });
    });

    describe("easeOut", () => {
      it("should return 0 at start", () => {
        expect(service.easeOut(0)).toBe(0);
      });

      it("should return 1 at end", () => {
        expect(service.easeOut(1)).toBe(1);
      });

      it("should have fast start", () => {
        const quarter = service.easeOut(0.25);
        expect(quarter).toBeGreaterThan(0.25);
      });

      it("should decelerate towards end", () => {
        const threeQuarter = service.easeOut(0.75);
        expect(threeQuarter).toBeLessThan(1);
      });
    });

    describe("bounce", () => {
      it("should return 0 at start", () => {
        expect(service.bounce(0)).toBe(0);
      });

      it("should return 1 at end", () => {
        expect(service.bounce(1)).toBe(1);
      });

      it("should have bouncing effect", () => {
        const values = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(t => service.bounce(t));
        
        // Should have some variation (not strictly monotonic)
        let hasVariation = false;
        for (let i = 1; i < values.length - 1; i++) {
          if (values[i] < values[i-1] || values[i] < values[i+1]) {
            hasVariation = true;
            break;
          }
        }
        expect(hasVariation).toBe(true);
      });
    });

    describe("elastic", () => {
      it("should return 0 at start", () => {
        expect(service.elastic(0)).toBe(0);
      });

      it("should return 1 at end", () => {
        expect(service.elastic(1)).toBe(1);
      });

      it("should have elastic oscillation", () => {
        const midValue = service.elastic(0.5);
        // Elastic should overshoot or undershoot
        expect(Math.abs(midValue - 0.5)).toBeGreaterThan(0.1);
      });
    });
  });

  describe("createSequence", () => {
    it("should create sequence of animations", () => {
      const service = new AnimationService();
      const animations = [
        service.createTween(0, 0, 50, 100),
        service.createTween(100, 50, 100, 100),
        service.createTween(200, 100, 0, 100),
      ];

      const sequence = service.createSequence(animations);

      expect(sequence.length).toBe(3);
      expect(sequence[0].startTime).toBe(0);
      expect(sequence[1].startTime).toBe(100);
      expect(sequence[2].startTime).toBe(200);
    });

    it("should handle empty sequence", () => {
      const service = new AnimationService();
      
      const sequence = service.createSequence([]);
      
      expect(sequence.length).toBe(0);
    });
  });

  describe("createParallel", () => {
    it("should create parallel animations with same start time", () => {
      const service = new AnimationService();
      const startTime = 1000;
      const configs = [
        { startValue: 0, endValue: 100, duration: 500 },
        { startValue: 50, endValue: 150, duration: 300 },
        { startValue: -10, endValue: 10, duration: 200 },
      ];

      const parallel = service.createParallel(startTime, configs);

      expect(parallel.length).toBe(3);
      parallel.forEach(animation => {
        expect(animation.startTime).toBe(startTime);
      });
      expect(parallel[0].endValue).toBe(100);
      expect(parallel[1].endValue).toBe(150);
      expect(parallel[2].endValue).toBe(10);
    });
  });

  describe("interpolate", () => {
    it("should interpolate between two values", () => {
      const service = new AnimationService();
      
      expect(service.interpolate(0, 100, 0)).toBe(0);
      expect(service.interpolate(0, 100, 1)).toBe(100);
      expect(service.interpolate(0, 100, 0.5)).toBe(50);
      expect(service.interpolate(10, 20, 0.3)).toBe(13);
    });

    it("should handle negative values", () => {
      const service = new AnimationService();
      
      expect(service.interpolate(-10, 10, 0.5)).toBe(0);
      expect(service.interpolate(10, -10, 0.25)).toBe(5);
    });
  });
});