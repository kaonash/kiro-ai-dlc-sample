import { describe, expect, it } from "bun:test";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";

describe("TowerType", () => {
  describe("列挙値", () => {
    it("すべてのタワータイプが定義されている", () => {
      expect(TowerType.ARCHER).toBe("ARCHER");
      expect(TowerType.CANNON).toBe("CANNON");
      expect(TowerType.MAGIC).toBe("MAGIC");
      expect(TowerType.ICE).toBe("ICE");
      expect(TowerType.FIRE).toBe("FIRE");
      expect(TowerType.LIGHTNING).toBe("LIGHTNING");
      expect(TowerType.POISON).toBe("POISON");
      expect(TowerType.SUPPORT).toBe("SUPPORT");
    });
  });

  describe("ユーティリティメソッド", () => {
    it("すべてのタワータイプを取得できる", () => {
      const allTypes = TowerType.getAllTypes();
      expect(allTypes).toContain(TowerType.ARCHER);
      expect(allTypes).toContain(TowerType.CANNON);
      expect(allTypes).toContain(TowerType.MAGIC);
      expect(allTypes).toContain(TowerType.ICE);
      expect(allTypes).toContain(TowerType.FIRE);
      expect(allTypes).toContain(TowerType.LIGHTNING);
      expect(allTypes).toContain(TowerType.POISON);
      expect(allTypes).toContain(TowerType.SUPPORT);
      expect(allTypes.length).toBe(8);
    });

    it("有効なタワータイプかどうか判定できる", () => {
      expect(TowerType.isValid("ARCHER")).toBe(true);
      expect(TowerType.isValid("CANNON")).toBe(true);
      expect(TowerType.isValid("INVALID")).toBe(false);
      expect(TowerType.isValid("")).toBe(false);
    });

    it("タワータイプの表示名を取得できる", () => {
      expect(TowerType.getDisplayName(TowerType.ARCHER)).toBe("弓兵タワー");
      expect(TowerType.getDisplayName(TowerType.CANNON)).toBe("大砲タワー");
      expect(TowerType.getDisplayName(TowerType.MAGIC)).toBe("魔法タワー");
      expect(TowerType.getDisplayName(TowerType.ICE)).toBe("氷タワー");
      expect(TowerType.getDisplayName(TowerType.FIRE)).toBe("炎タワー");
      expect(TowerType.getDisplayName(TowerType.LIGHTNING)).toBe("雷タワー");
      expect(TowerType.getDisplayName(TowerType.POISON)).toBe("毒タワー");
      expect(TowerType.getDisplayName(TowerType.SUPPORT)).toBe("支援タワー");
    });

    it("無効なタワータイプの表示名取得でエラーが発生する", () => {
      expect(() => TowerType.getDisplayName("INVALID" as TowerType)).toThrow(
        "無効なタワータイプです: INVALID"
      );
    });
  });
});
