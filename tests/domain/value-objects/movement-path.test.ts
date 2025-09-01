import { describe, it, expect } from 'bun:test';
import { MovementPath } from '../../../src/domain/value-objects/movement-path';
import { Position } from '../../../src/domain/value-objects/position';

describe('MovementPath', () => {
  const createTestPath = () => {
    const pathPoints = [
      new Position(0, 100),
      new Position(200, 100),
      new Position(400, 200),
      new Position(600, 200),
      new Position(800, 300)
    ];
    return new MovementPath(pathPoints);
  };

  describe('constructor', () => {
    it('should create path with valid points', () => {
      const pathPoints = [
        new Position(0, 100),
        new Position(100, 200),
        new Position(200, 300)
      ];
      const path = new MovementPath(pathPoints);
      
      expect(path.pathPoints).toHaveLength(3);
      expect(path.spawnPoint.equals(new Position(0, 100))).toBe(true);
      expect(path.basePoint.equals(new Position(200, 300))).toBe(true);
    });

    it('should throw error for empty path', () => {
      expect(() => new MovementPath([])).toThrow('Path must have at least 2 points');
    });

    it('should throw error for single point path', () => {
      const pathPoints = [new Position(0, 0)];
      expect(() => new MovementPath(pathPoints)).toThrow('Path must have at least 2 points');
    });

    it('should calculate total length correctly', () => {
      const pathPoints = [
        new Position(0, 0),
        new Position(3, 0),
        new Position(3, 4)
      ];
      const path = new MovementPath(pathPoints);
      
      expect(path.totalLength).toBe(7); // 3 + 4
    });
  });

  describe('getPositionAtProgress', () => {
    it('should return spawn point at progress 0', () => {
      const path = createTestPath();
      const position = path.getPositionAtProgress(0);
      
      expect(position.equals(new Position(0, 100))).toBe(true);
    });

    it('should return base point at progress 1', () => {
      const path = createTestPath();
      const position = path.getPositionAtProgress(1);
      
      expect(position.equals(new Position(800, 300))).toBe(true);
    });

    it('should interpolate correctly at progress 0.5', () => {
      const pathPoints = [
        new Position(0, 0),
        new Position(100, 0)
      ];
      const path = new MovementPath(pathPoints);
      const position = path.getPositionAtProgress(0.5);
      
      expect(position.equals(new Position(50, 0))).toBe(true);
    });

    it('should handle progress beyond 1', () => {
      const path = createTestPath();
      const position = path.getPositionAtProgress(1.5);
      
      expect(position.equals(new Position(800, 300))).toBe(true);
    });

    it('should handle negative progress', () => {
      const path = createTestPath();
      const position = path.getPositionAtProgress(-0.5);
      
      expect(position.equals(new Position(0, 100))).toBe(true);
    });

    it('should interpolate between segments correctly', () => {
      const pathPoints = [
        new Position(0, 0),
        new Position(100, 0),
        new Position(100, 100)
      ];
      const path = new MovementPath(pathPoints);
      
      // Progress 0.25 should be halfway through first segment
      const position1 = path.getPositionAtProgress(0.25);
      expect(position1.x).toBe(50);
      expect(position1.y).toBe(0);
      
      // Progress 0.75 should be halfway through second segment
      const position2 = path.getPositionAtProgress(0.75);
      expect(position2.x).toBe(100);
      expect(position2.y).toBe(50);
    });
  });

  describe('getNextPosition', () => {
    it('should calculate next position based on speed and time', () => {
      const pathPoints = [
        new Position(0, 0),
        new Position(100, 0)
      ];
      const path = new MovementPath(pathPoints);
      
      // Speed: 50 pixels/second, deltaTime: 1 second
      // Should move 50 pixels along 100-pixel path = 0.5 progress
      const nextPosition = path.getNextPosition(0, 50, 1000);
      
      expect(nextPosition.equals(new Position(50, 0))).toBe(true);
    });

    it('should not exceed base point', () => {
      const pathPoints = [
        new Position(0, 0),
        new Position(100, 0)
      ];
      const path = new MovementPath(pathPoints);
      
      // Speed: 200 pixels/second, deltaTime: 1 second
      // Should move 200 pixels along 100-pixel path, but clamped to end
      const nextPosition = path.getNextPosition(0, 200, 1000);
      
      expect(nextPosition.equals(new Position(100, 0))).toBe(true);
    });

    it('should handle starting from middle of path', () => {
      const pathPoints = [
        new Position(0, 0),
        new Position(100, 0)
      ];
      const path = new MovementPath(pathPoints);
      
      // Start at 50% progress, move 25 pixels (25% of total path)
      const nextPosition = path.getNextPosition(0.5, 25, 1000);
      
      expect(nextPosition.equals(new Position(75, 0))).toBe(true);
    });
  });

  describe('getTotalTravelTime', () => {
    it('should calculate travel time correctly', () => {
      const pathPoints = [
        new Position(0, 0),
        new Position(100, 0)
      ];
      const path = new MovementPath(pathPoints);
      
      // 100 pixels at 50 pixels/second = 2 seconds
      const travelTime = path.getTotalTravelTime(50);
      
      expect(travelTime).toBe(2000); // milliseconds
    });

    it('should handle zero speed', () => {
      const path = createTestPath();
      
      expect(() => path.getTotalTravelTime(0)).toThrow('Speed must be positive');
    });

    it('should handle negative speed', () => {
      const path = createTestPath();
      
      expect(() => path.getTotalTravelTime(-10)).toThrow('Speed must be positive');
    });
  });

  describe('getProgressFromDistance', () => {
    it('should calculate progress from distance correctly', () => {
      const pathPoints = [
        new Position(0, 0),
        new Position(100, 0)
      ];
      const path = new MovementPath(pathPoints);
      
      expect(path.getProgressFromDistance(0)).toBe(0);
      expect(path.getProgressFromDistance(50)).toBe(0.5);
      expect(path.getProgressFromDistance(100)).toBe(1);
    });

    it('should handle distance beyond path length', () => {
      const pathPoints = [
        new Position(0, 0),
        new Position(100, 0)
      ];
      const path = new MovementPath(pathPoints);
      
      expect(path.getProgressFromDistance(150)).toBe(1);
    });

    it('should handle negative distance', () => {
      const pathPoints = [
        new Position(0, 0),
        new Position(100, 0)
      ];
      const path = new MovementPath(pathPoints);
      
      expect(path.getProgressFromDistance(-50)).toBe(0);
    });
  });
});