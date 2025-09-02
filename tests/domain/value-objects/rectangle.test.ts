import { describe, it, expect } from "bun:test";
import { Rectangle } from "../../../src/domain/value-objects/rectangle";
import { Position } from "../../../src/domain/value-objects/position";

describe("Rectangle", () => {
  describe("constructor", () => {
    it("should create rectangle with position and dimensions", () => {
      const rect = new Rectangle(10, 20, 100, 50);
      
      expect(rect.x).toBe(10);
      expect(rect.y).toBe(20);
      expect(rect.width).toBe(100);
      expect(rect.height).toBe(50);
    });

    it("should ensure positive dimensions", () => {
      const rect = new Rectangle(10, 20, -100, -50);
      
      expect(rect.width).toBe(0);
      expect(rect.height).toBe(0);
    });
  });

  describe("contains", () => {
    it("should return true for point inside rectangle", () => {
      const rect = new Rectangle(10, 20, 100, 50);
      const point = new Position(50, 40);
      
      const result = rect.contains(point);
      
      expect(result).toBe(true);
    });

    it("should return false for point outside rectangle", () => {
      const rect = new Rectangle(10, 20, 100, 50);
      const point = new Position(5, 40);
      
      const result = rect.contains(point);
      
      expect(result).toBe(false);
    });

    it("should return true for point on rectangle edge", () => {
      const rect = new Rectangle(10, 20, 100, 50);
      const point1 = new Position(10, 30); // left edge
      const point2 = new Position(110, 30); // right edge
      const point3 = new Position(50, 20); // top edge
      const point4 = new Position(50, 70); // bottom edge
      
      expect(rect.contains(point1)).toBe(true);
      expect(rect.contains(point2)).toBe(true);
      expect(rect.contains(point3)).toBe(true);
      expect(rect.contains(point4)).toBe(true);
    });

    it("should return false for point on corner outside", () => {
      const rect = new Rectangle(10, 20, 100, 50);
      const point = new Position(111, 71);
      
      const result = rect.contains(point);
      
      expect(result).toBe(false);
    });
  });

  describe("intersects", () => {
    it("should return true for overlapping rectangles", () => {
      const rect1 = new Rectangle(10, 20, 100, 50);
      const rect2 = new Rectangle(50, 40, 100, 50);
      
      const result = rect1.intersects(rect2);
      
      expect(result).toBe(true);
    });

    it("should return false for non-overlapping rectangles", () => {
      const rect1 = new Rectangle(10, 20, 100, 50);
      const rect2 = new Rectangle(200, 200, 100, 50);
      
      const result = rect1.intersects(rect2);
      
      expect(result).toBe(false);
    });

    it("should return true for touching rectangles", () => {
      const rect1 = new Rectangle(10, 20, 100, 50);
      const rect2 = new Rectangle(110, 20, 100, 50);
      
      const result = rect1.intersects(rect2);
      
      expect(result).toBe(true);
    });

    it("should return true for identical rectangles", () => {
      const rect1 = new Rectangle(10, 20, 100, 50);
      const rect2 = new Rectangle(10, 20, 100, 50);
      
      const result = rect1.intersects(rect2);
      
      expect(result).toBe(true);
    });
  });

  describe("center", () => {
    it("should return center position of rectangle", () => {
      const rect = new Rectangle(10, 20, 100, 50);
      
      const center = rect.center();
      
      expect(center.x).toBe(60);
      expect(center.y).toBe(45);
    });
  });

  describe("area", () => {
    it("should return area of rectangle", () => {
      const rect = new Rectangle(10, 20, 100, 50);
      
      const area = rect.area();
      
      expect(area).toBe(5000);
    });

    it("should return 0 for zero-dimension rectangle", () => {
      const rect = new Rectangle(10, 20, 0, 50);
      
      const area = rect.area();
      
      expect(area).toBe(0);
    });
  });

  describe("equals", () => {
    it("should return true for equal rectangles", () => {
      const rect1 = new Rectangle(10, 20, 100, 50);
      const rect2 = new Rectangle(10, 20, 100, 50);
      
      expect(rect1.equals(rect2)).toBe(true);
    });

    it("should return false for different rectangles", () => {
      const rect1 = new Rectangle(10, 20, 100, 50);
      const rect2 = new Rectangle(10, 20, 100, 51);
      
      expect(rect1.equals(rect2)).toBe(false);
    });
  });
});