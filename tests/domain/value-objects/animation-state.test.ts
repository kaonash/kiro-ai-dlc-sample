import { describe, it, expect } from "bun:test";
import { AnimationState, EasingFunction } from "../../../src/domain/value-objects/animation-state";

describe("AnimationState", () => {
  const linearEasing: EasingFunction = (t: number) => t;
  const easeInQuad: EasingFunction = (t: number) => t * t;

  describe("constructor", () => {
    it("should create animation state with all parameters", () => {
      const startTime = 1000;
      const duration = 500;
      const startValue = 0;
      const endValue = 100;
      
      const animation = new AnimationState(startTime, duration, startValue, endValue, linearEasing);
      
      expect(animation.startTime).toBe(startTime);
      expect(animation.duration).toBe(duration);
      expect(animation.startValue).toBe(startValue);
      expect(animation.endValue).toBe(endValue);
      expect(animation.easingFunction).toBe(linearEasing);
    });

    it("should ensure positive duration", () => {
      const animation = new AnimationState(1000, -500, 0, 100, linearEasing);
      
      expect(animation.duration).toBe(0);
    });
  });

  describe("getCurrentValue", () => {
    it("should return start value at start time", () => {
      const animation = new AnimationState(1000, 500, 0, 100, linearEasing);
      
      const value = animation.getCurrentValue(1000);
      
      expect(value).toBe(0);
    });

    it("should return end value at end time", () => {
      const animation = new AnimationState(1000, 500, 0, 100, linearEasing);
      
      const value = animation.getCurrentValue(1500);
      
      expect(value).toBe(100);
    });

    it("should return interpolated value at middle time with linear easing", () => {
      const animation = new AnimationState(1000, 500, 0, 100, linearEasing);
      
      const value = animation.getCurrentValue(1250);
      
      expect(value).toBe(50);
    });

    it("should return interpolated value with custom easing function", () => {
      const animation = new AnimationState(1000, 400, 0, 100, easeInQuad);
      
      const value = animation.getCurrentValue(1200); // t = 0.5, easeInQuad(0.5) = 0.25
      
      expect(value).toBe(25);
    });

    it("should clamp to start value before start time", () => {
      const animation = new AnimationState(1000, 500, 0, 100, linearEasing);
      
      const value = animation.getCurrentValue(500);
      
      expect(value).toBe(0);
    });

    it("should clamp to end value after end time", () => {
      const animation = new AnimationState(1000, 500, 0, 100, linearEasing);
      
      const value = animation.getCurrentValue(2000);
      
      expect(value).toBe(100);
    });

    it("should handle zero duration", () => {
      const animation = new AnimationState(1000, 0, 0, 100, linearEasing);
      
      const value = animation.getCurrentValue(1000);
      
      expect(value).toBe(100);
    });

    it("should handle negative values", () => {
      const animation = new AnimationState(1000, 500, 100, -50, linearEasing);
      
      const value = animation.getCurrentValue(1250);
      
      expect(value).toBe(25);
    });
  });

  describe("isComplete", () => {
    it("should return false before completion", () => {
      const animation = new AnimationState(1000, 500, 0, 100, linearEasing);
      
      const isComplete = animation.isComplete(1250);
      
      expect(isComplete).toBe(false);
    });

    it("should return true at completion time", () => {
      const animation = new AnimationState(1000, 500, 0, 100, linearEasing);
      
      const isComplete = animation.isComplete(1500);
      
      expect(isComplete).toBe(true);
    });

    it("should return true after completion time", () => {
      const animation = new AnimationState(1000, 500, 0, 100, linearEasing);
      
      const isComplete = animation.isComplete(2000);
      
      expect(isComplete).toBe(true);
    });

    it("should return false before start time", () => {
      const animation = new AnimationState(1000, 500, 0, 100, linearEasing);
      
      const isComplete = animation.isComplete(500);
      
      expect(isComplete).toBe(false);
    });

    it("should return true immediately for zero duration", () => {
      const animation = new AnimationState(1000, 0, 0, 100, linearEasing);
      
      const isComplete = animation.isComplete(1000);
      
      expect(isComplete).toBe(true);
    });
  });

  describe("getProgress", () => {
    it("should return 0 at start time", () => {
      const animation = new AnimationState(1000, 500, 0, 100, linearEasing);
      
      const progress = animation.getProgress(1000);
      
      expect(progress).toBe(0);
    });

    it("should return 1 at end time", () => {
      const animation = new AnimationState(1000, 500, 0, 100, linearEasing);
      
      const progress = animation.getProgress(1500);
      
      expect(progress).toBe(1);
    });

    it("should return 0.5 at middle time", () => {
      const animation = new AnimationState(1000, 500, 0, 100, linearEasing);
      
      const progress = animation.getProgress(1250);
      
      expect(progress).toBe(0.5);
    });

    it("should clamp progress to 0-1 range", () => {
      const animation = new AnimationState(1000, 500, 0, 100, linearEasing);
      
      const progressBefore = animation.getProgress(500);
      const progressAfter = animation.getProgress(2000);
      
      expect(progressBefore).toBe(0);
      expect(progressAfter).toBe(1);
    });
  });
});