import { describe, it, expect } from "bun:test";
import { Color } from "../../../src/domain/value-objects/color";

describe("Color", () => {
  describe("constructor", () => {
    it("should create color with RGBA values", () => {
      const color = new Color(255, 128, 64, 0.8);
      
      expect(color.r).toBe(255);
      expect(color.g).toBe(128);
      expect(color.b).toBe(64);
      expect(color.a).toBe(0.8);
    });

    it("should default alpha to 1.0 when not provided", () => {
      const color = new Color(255, 128, 64);
      
      expect(color.a).toBe(1.0);
    });

    it("should clamp RGB values to 0-255 range", () => {
      const color = new Color(-10, 300, 128);
      
      expect(color.r).toBe(0);
      expect(color.g).toBe(255);
      expect(color.b).toBe(128);
    });

    it("should clamp alpha to 0-1 range", () => {
      const color1 = new Color(255, 128, 64, -0.5);
      const color2 = new Color(255, 128, 64, 1.5);
      
      expect(color1.a).toBe(0);
      expect(color2.a).toBe(1);
    });
  });

  describe("toRGBA", () => {
    it("should return RGBA string", () => {
      const color = new Color(255, 128, 64, 0.8);
      
      const rgba = color.toRGBA();
      
      expect(rgba).toBe("rgba(255, 128, 64, 0.8)");
    });

    it("should handle integer alpha values", () => {
      const color = new Color(255, 128, 64, 1);
      
      const rgba = color.toRGBA();
      
      expect(rgba).toBe("rgba(255, 128, 64, 1)");
    });
  });

  describe("withAlpha", () => {
    it("should return new color with different alpha", () => {
      const original = new Color(255, 128, 64, 1.0);
      
      const newColor = original.withAlpha(0.5);
      
      expect(newColor.r).toBe(255);
      expect(newColor.g).toBe(128);
      expect(newColor.b).toBe(64);
      expect(newColor.a).toBe(0.5);
    });

    it("should not modify original color", () => {
      const original = new Color(255, 128, 64, 1.0);
      
      original.withAlpha(0.5);
      
      expect(original.a).toBe(1.0);
    });

    it("should clamp alpha to valid range", () => {
      const original = new Color(255, 128, 64);
      
      const newColor1 = original.withAlpha(-0.5);
      const newColor2 = original.withAlpha(1.5);
      
      expect(newColor1.a).toBe(0);
      expect(newColor2.a).toBe(1);
    });
  });

  describe("static factory methods", () => {
    it("should create white color", () => {
      const white = Color.white();
      
      expect(white.r).toBe(255);
      expect(white.g).toBe(255);
      expect(white.b).toBe(255);
      expect(white.a).toBe(1);
    });

    it("should create black color", () => {
      const black = Color.black();
      
      expect(black.r).toBe(0);
      expect(black.g).toBe(0);
      expect(black.b).toBe(0);
      expect(black.a).toBe(1);
    });

    it("should create transparent color", () => {
      const transparent = Color.transparent();
      
      expect(transparent.r).toBe(0);
      expect(transparent.g).toBe(0);
      expect(transparent.b).toBe(0);
      expect(transparent.a).toBe(0);
    });
  });

  describe("equals", () => {
    it("should return true for equal colors", () => {
      const color1 = new Color(255, 128, 64, 0.8);
      const color2 = new Color(255, 128, 64, 0.8);
      
      expect(color1.equals(color2)).toBe(true);
    });

    it("should return false for different colors", () => {
      const color1 = new Color(255, 128, 64, 0.8);
      const color2 = new Color(255, 128, 64, 0.9);
      
      expect(color1.equals(color2)).toBe(false);
    });
  });
});