import { describe, it, expect } from "bun:test";
import { Position } from "../../../src/domain/value-objects/position";

describe("Position", () => {
  describe("constructor", () => {
    it("should create position with x and y coordinates", () => {
      const position = new Position(10, 20);
      
      expect(position.x).toBe(10);
      expect(position.y).toBe(20);
    });
  });

  describe("distance", () => {
    it("should calculate distance between two positions", () => {
      const pos1 = new Position(0, 0);
      const pos2 = new Position(3, 4);
      
      const distance = pos1.distance(pos2);
      
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    it("should return 0 for same position", () => {
      const pos1 = new Position(5, 5);
      const pos2 = new Position(5, 5);
      
      const distance = pos1.distance(pos2);
      
      expect(distance).toBe(0);
    });
  });

  describe("add", () => {
    it("should add two positions", () => {
      const pos1 = new Position(10, 20);
      const pos2 = new Position(5, 15);
      
      const result = pos1.add(pos2);
      
      expect(result.x).toBe(15);
      expect(result.y).toBe(35);
    });

    it("should not modify original positions", () => {
      const pos1 = new Position(10, 20);
      const pos2 = new Position(5, 15);
      
      pos1.add(pos2);
      
      expect(pos1.x).toBe(10);
      expect(pos1.y).toBe(20);
      expect(pos2.x).toBe(5);
      expect(pos2.y).toBe(15);
    });
  });

  describe("subtract", () => {
    it("should subtract two positions", () => {
      const pos1 = new Position(10, 20);
      const pos2 = new Position(5, 15);
      
      const result = pos1.subtract(pos2);
      
      expect(result.x).toBe(5);
      expect(result.y).toBe(5);
    });

    it("should not modify original positions", () => {
      const pos1 = new Position(10, 20);
      const pos2 = new Position(5, 15);
      
      pos1.subtract(pos2);
      
      expect(pos1.x).toBe(10);
      expect(pos1.y).toBe(20);
      expect(pos2.x).toBe(5);
      expect(pos2.y).toBe(15);
    });
  });

  describe("equals", () => {
    it("should return true for equal positions", () => {
      const pos1 = new Position(10, 20);
      const pos2 = new Position(10, 20);
      
      expect(pos1.equals(pos2)).toBe(true);
    });

    it("should return false for different positions", () => {
      const pos1 = new Position(10, 20);
      const pos2 = new Position(10, 21);
      
      expect(pos1.equals(pos2)).toBe(false);
    });
  });
});