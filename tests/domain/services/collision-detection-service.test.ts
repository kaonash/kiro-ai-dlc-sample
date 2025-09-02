import { describe, it, expect } from "bun:test";
import { CollisionDetectionService } from "../../../src/domain/services/collision-detection-service";
import { Position } from "../../../src/domain/value-objects/position";
import { Rectangle } from "../../../src/domain/value-objects/rectangle";

// Mock UI element for testing
interface MockUIElement {
  bounds: Rectangle;
  id: string;
  isVisible: boolean;
}

describe("CollisionDetectionService", () => {
  const service = new CollisionDetectionService();

  describe("pointInRectangle", () => {
    it("should return true for point inside rectangle", () => {
      const point = new Position(50, 30);
      const rect = new Rectangle(10, 20, 100, 50);

      const result = service.pointInRectangle(point, rect);

      expect(result).toBe(true);
    });

    it("should return false for point outside rectangle", () => {
      const point = new Position(5, 30);
      const rect = new Rectangle(10, 20, 100, 50);

      const result = service.pointInRectangle(point, rect);

      expect(result).toBe(false);
    });

    it("should return true for point on rectangle edge", () => {
      const rect = new Rectangle(10, 20, 100, 50);
      
      expect(service.pointInRectangle(new Position(10, 30), rect)).toBe(true); // left edge
      expect(service.pointInRectangle(new Position(110, 30), rect)).toBe(true); // right edge
      expect(service.pointInRectangle(new Position(50, 20), rect)).toBe(true); // top edge
      expect(service.pointInRectangle(new Position(50, 70), rect)).toBe(true); // bottom edge
    });

    it("should return true for point on rectangle corner", () => {
      const rect = new Rectangle(10, 20, 100, 50);
      
      expect(service.pointInRectangle(new Position(10, 20), rect)).toBe(true); // top-left
      expect(service.pointInRectangle(new Position(110, 20), rect)).toBe(true); // top-right
      expect(service.pointInRectangle(new Position(10, 70), rect)).toBe(true); // bottom-left
      expect(service.pointInRectangle(new Position(110, 70), rect)).toBe(true); // bottom-right
    });
  });

  describe("pointInCircle", () => {
    it("should return true for point inside circle", () => {
      const point = new Position(52, 53);
      const center = new Position(50, 50);
      const radius = 10;

      const result = service.pointInCircle(point, center, radius);

      expect(result).toBe(true);
    });

    it("should return false for point outside circle", () => {
      const point = new Position(65, 50);
      const center = new Position(50, 50);
      const radius = 10;

      const result = service.pointInCircle(point, center, radius);

      expect(result).toBe(false);
    });

    it("should return true for point on circle edge", () => {
      const center = new Position(50, 50);
      const radius = 10;
      const point = new Position(60, 50); // exactly on edge

      const result = service.pointInCircle(point, center, radius);

      expect(result).toBe(true);
    });

    it("should return true for point at circle center", () => {
      const center = new Position(50, 50);
      const radius = 10;

      const result = service.pointInCircle(center, center, radius);

      expect(result).toBe(true);
    });

    it("should handle zero radius", () => {
      const center = new Position(50, 50);
      const radius = 0;

      expect(service.pointInCircle(center, center, radius)).toBe(true);
      expect(service.pointInCircle(new Position(51, 50), center, radius)).toBe(false);
    });
  });

  describe("findUIElementAt", () => {
    const elements: MockUIElement[] = [
      {
        id: "element1",
        bounds: new Rectangle(10, 10, 50, 30),
        isVisible: true,
      },
      {
        id: "element2",
        bounds: new Rectangle(70, 10, 50, 30),
        isVisible: true,
      },
      {
        id: "element3",
        bounds: new Rectangle(10, 50, 50, 30),
        isVisible: false, // invisible
      },
      {
        id: "element4",
        bounds: new Rectangle(70, 50, 50, 30),
        isVisible: true,
      },
    ];

    it("should find element at position", () => {
      const position = new Position(30, 25);

      const result = service.findUIElementAt(position, elements);

      expect(result?.id).toBe("element1");
    });

    it("should return null when no element at position", () => {
      const position = new Position(5, 5);

      const result = service.findUIElementAt(position, elements);

      expect(result).toBeNull();
    });

    it("should ignore invisible elements", () => {
      const position = new Position(30, 65); // inside element3 bounds but it's invisible

      const result = service.findUIElementAt(position, elements);

      expect(result).toBeNull();
    });

    it("should return topmost element when multiple elements overlap", () => {
      const overlappingElements: MockUIElement[] = [
        {
          id: "bottom",
          bounds: new Rectangle(10, 10, 100, 100),
          isVisible: true,
        },
        {
          id: "top",
          bounds: new Rectangle(20, 20, 50, 50),
          isVisible: true,
        },
      ];
      const position = new Position(30, 30);

      const result = service.findUIElementAt(position, overlappingElements);

      // Should return the last element in array (topmost)
      expect(result?.id).toBe("top");
    });

    it("should handle empty element array", () => {
      const position = new Position(50, 50);

      const result = service.findUIElementAt(position, []);

      expect(result).toBeNull();
    });
  });

  describe("rectangleIntersection", () => {
    it("should return intersection area for overlapping rectangles", () => {
      const rect1 = new Rectangle(10, 10, 50, 50);
      const rect2 = new Rectangle(30, 30, 50, 50);

      const intersection = service.rectangleIntersection(rect1, rect2);

      expect(intersection).not.toBeNull();
      expect(intersection?.x).toBe(30);
      expect(intersection?.y).toBe(30);
      expect(intersection?.width).toBe(30);
      expect(intersection?.height).toBe(30);
    });

    it("should return null for non-overlapping rectangles", () => {
      const rect1 = new Rectangle(10, 10, 20, 20);
      const rect2 = new Rectangle(50, 50, 20, 20);

      const intersection = service.rectangleIntersection(rect1, rect2);

      expect(intersection).toBeNull();
    });

    it("should return null for touching rectangles", () => {
      const rect1 = new Rectangle(10, 10, 20, 20);
      const rect2 = new Rectangle(30, 10, 20, 20);

      const intersection = service.rectangleIntersection(rect1, rect2);

      expect(intersection).toBeNull();
    });

    it("should handle identical rectangles", () => {
      const rect1 = new Rectangle(10, 10, 50, 50);
      const rect2 = new Rectangle(10, 10, 50, 50);

      const intersection = service.rectangleIntersection(rect1, rect2);

      expect(intersection).not.toBeNull();
      expect(intersection?.equals(rect1)).toBe(true);
    });
  });

  describe("circleRectangleIntersection", () => {
    it("should return true for circle intersecting rectangle", () => {
      const center = new Position(50, 50);
      const radius = 20;
      const rect = new Rectangle(60, 40, 30, 20);

      const result = service.circleRectangleIntersection(center, radius, rect);

      expect(result).toBe(true);
    });

    it("should return false for circle not intersecting rectangle", () => {
      const center = new Position(50, 50);
      const radius = 10;
      const rect = new Rectangle(80, 80, 30, 20);

      const result = service.circleRectangleIntersection(center, radius, rect);

      expect(result).toBe(false);
    });

    it("should return true for circle completely inside rectangle", () => {
      const center = new Position(50, 50);
      const radius = 10;
      const rect = new Rectangle(30, 30, 40, 40);

      const result = service.circleRectangleIntersection(center, radius, rect);

      expect(result).toBe(true);
    });

    it("should return true for rectangle completely inside circle", () => {
      const center = new Position(50, 50);
      const radius = 50;
      const rect = new Rectangle(45, 45, 10, 10);

      const result = service.circleRectangleIntersection(center, radius, rect);

      expect(result).toBe(true);
    });
  });
});