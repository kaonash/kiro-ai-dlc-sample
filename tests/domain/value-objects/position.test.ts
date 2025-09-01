import { describe, it, expect } from 'bun:test';
import { Position } from '../../../src/domain/value-objects/position';

describe('Position', () => {
  describe('constructor', () => {
    it('should create position with valid coordinates', () => {
      const position = new Position(100, 200);
      
      expect(position.x).toBe(100);
      expect(position.y).toBe(200);
    });

    it('should create position with zero coordinates', () => {
      const position = new Position(0, 0);
      
      expect(position.x).toBe(0);
      expect(position.y).toBe(0);
    });

    it('should create position with negative coordinates', () => {
      const position = new Position(-50, -100);
      
      expect(position.x).toBe(-50);
      expect(position.y).toBe(-100);
    });
  });

  describe('distanceTo', () => {
    it('should calculate distance between two positions', () => {
      const pos1 = new Position(0, 0);
      const pos2 = new Position(3, 4);
      
      const distance = pos1.distanceTo(pos2);
      
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    it('should return zero for same position', () => {
      const pos1 = new Position(100, 200);
      const pos2 = new Position(100, 200);
      
      const distance = pos1.distanceTo(pos2);
      
      expect(distance).toBe(0);
    });

    it('should calculate distance with negative coordinates', () => {
      const pos1 = new Position(-3, -4);
      const pos2 = new Position(0, 0);
      
      const distance = pos1.distanceTo(pos2);
      
      expect(distance).toBe(5);
    });
  });

  describe('equals', () => {
    it('should return true for same coordinates', () => {
      const pos1 = new Position(100, 200);
      const pos2 = new Position(100, 200);
      
      expect(pos1.equals(pos2)).toBe(true);
    });

    it('should return false for different coordinates', () => {
      const pos1 = new Position(100, 200);
      const pos2 = new Position(101, 200);
      
      expect(pos1.equals(pos2)).toBe(false);
    });

    it('should return false for different y coordinates', () => {
      const pos1 = new Position(100, 200);
      const pos2 = new Position(100, 201);
      
      expect(pos1.equals(pos2)).toBe(false);
    });
  });

  describe('add', () => {
    it('should add two positions', () => {
      const pos1 = new Position(100, 200);
      const pos2 = new Position(50, 75);
      
      const result = pos1.add(pos2);
      
      expect(result.x).toBe(150);
      expect(result.y).toBe(275);
    });

    it('should handle negative values', () => {
      const pos1 = new Position(100, 200);
      const pos2 = new Position(-50, -75);
      
      const result = pos1.add(pos2);
      
      expect(result.x).toBe(50);
      expect(result.y).toBe(125);
    });

    it('should not modify original positions', () => {
      const pos1 = new Position(100, 200);
      const pos2 = new Position(50, 75);
      
      pos1.add(pos2);
      
      expect(pos1.x).toBe(100);
      expect(pos1.y).toBe(200);
      expect(pos2.x).toBe(50);
      expect(pos2.y).toBe(75);
    });
  });

  describe('interpolate', () => {
    it('should interpolate between two positions at factor 0', () => {
      const pos1 = new Position(0, 0);
      const pos2 = new Position(100, 200);
      
      const result = pos1.interpolate(pos2, 0);
      
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should interpolate between two positions at factor 1', () => {
      const pos1 = new Position(0, 0);
      const pos2 = new Position(100, 200);
      
      const result = pos1.interpolate(pos2, 1);
      
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    it('should interpolate between two positions at factor 0.5', () => {
      const pos1 = new Position(0, 0);
      const pos2 = new Position(100, 200);
      
      const result = pos1.interpolate(pos2, 0.5);
      
      expect(result.x).toBe(50);
      expect(result.y).toBe(100);
    });

    it('should interpolate between two positions at factor 0.25', () => {
      const pos1 = new Position(100, 200);
      const pos2 = new Position(200, 400);
      
      const result = pos1.interpolate(pos2, 0.25);
      
      expect(result.x).toBe(125);
      expect(result.y).toBe(250);
    });

    it('should handle negative coordinates', () => {
      const pos1 = new Position(-100, -200);
      const pos2 = new Position(100, 200);
      
      const result = pos1.interpolate(pos2, 0.5);
      
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });
});