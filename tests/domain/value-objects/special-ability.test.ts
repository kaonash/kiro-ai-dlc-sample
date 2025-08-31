import { describe, expect, it } from "bun:test";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";

describe("SpecialAbility", () => {
  describe("列挙値", () => {
    it("すべての特殊能力が定義されている", () => {
      expect(SpecialAbility.NONE).toBe("NONE");
      expect(SpecialAbility.SPLASH_DAMAGE).toBe("SPLASH_DAMAGE");
      expect(SpecialAbility.SLOW_EFFECT).toBe("SLOW_EFFECT");
      expect(SpecialAbility.POISON_EFFECT).toBe("POISON_EFFECT");
      expect(SpecialAbility.CHAIN_LIGHTNING).toBe("CHAIN_LIGHTNING");
      expect(SpecialAbility.ARMOR_PIERCE).toBe("ARMOR_PIERCE");
      expect(SpecialAbility.RANGE_BOOST).toBe("RANGE_BOOST");
      expect(SpecialAbility.DAMAGE_BOOST).toBe("DAMAGE_BOOST");
      expect(SpecialAbility.FREEZE).toBe("FREEZE");
      expect(SpecialAbility.BURN).toBe("BURN");
      expect(SpecialAbility.STUN).toBe("STUN");
      expect(SpecialAbility.MULTI_SHOT).toBe("MULTI_SHOT");
    });
  });

  describe("ユーティリティメソッド", () => {
    it("すべての特殊能力を取得できる", () => {
      const allAbilities = SpecialAbility.getAllAbilities();
      expect(allAbilities).toContain(SpecialAbility.NONE);
      expect(allAbilities).toContain(SpecialAbility.SPLASH_DAMAGE);
      expect(allAbilities).toContain(SpecialAbility.SLOW_EFFECT);
      expect(allAbilities).toContain(SpecialAbility.POISON_EFFECT);
      expect(allAbilities).toContain(SpecialAbility.CHAIN_LIGHTNING);
      expect(allAbilities).toContain(SpecialAbility.ARMOR_PIERCE);
      expect(allAbilities).toContain(SpecialAbility.RANGE_BOOST);
      expect(allAbilities).toContain(SpecialAbility.DAMAGE_BOOST);
      expect(allAbilities).toContain(SpecialAbility.FREEZE);
      expect(allAbilities).toContain(SpecialAbility.BURN);
      expect(allAbilities).toContain(SpecialAbility.STUN);
      expect(allAbilities).toContain(SpecialAbility.MULTI_SHOT);
      expect(allAbilities.length).toBe(12);
    });

    it("有効な特殊能力かどうか判定できる", () => {
      expect(SpecialAbility.isValid("NONE")).toBe(true);
      expect(SpecialAbility.isValid("SPLASH_DAMAGE")).toBe(true);
      expect(SpecialAbility.isValid("INVALID")).toBe(false);
      expect(SpecialAbility.isValid("")).toBe(false);
    });

    it("特殊能力の表示名を取得できる", () => {
      expect(SpecialAbility.getDisplayName(SpecialAbility.NONE)).toBe("なし");
      expect(SpecialAbility.getDisplayName(SpecialAbility.SPLASH_DAMAGE)).toBe("範囲ダメージ");
      expect(SpecialAbility.getDisplayName(SpecialAbility.SLOW_EFFECT)).toBe("減速効果");
      expect(SpecialAbility.getDisplayName(SpecialAbility.POISON_EFFECT)).toBe("毒効果");
      expect(SpecialAbility.getDisplayName(SpecialAbility.CHAIN_LIGHTNING)).toBe("連鎖雷撃");
      expect(SpecialAbility.getDisplayName(SpecialAbility.ARMOR_PIERCE)).toBe("防御貫通");
      expect(SpecialAbility.getDisplayName(SpecialAbility.RANGE_BOOST)).toBe("射程強化");
      expect(SpecialAbility.getDisplayName(SpecialAbility.DAMAGE_BOOST)).toBe("攻撃力強化");
      expect(SpecialAbility.getDisplayName(SpecialAbility.FREEZE)).toBe("凍結");
      expect(SpecialAbility.getDisplayName(SpecialAbility.BURN)).toBe("燃焼");
      expect(SpecialAbility.getDisplayName(SpecialAbility.STUN)).toBe("スタン");
      expect(SpecialAbility.getDisplayName(SpecialAbility.MULTI_SHOT)).toBe("多重射撃");
    });

    it("特殊能力の説明を取得できる", () => {
      expect(SpecialAbility.getDescription(SpecialAbility.NONE)).toBe("特殊能力なし");
      expect(SpecialAbility.getDescription(SpecialAbility.SPLASH_DAMAGE)).toBe(
        "攻撃時に周囲の敵にもダメージを与える"
      );
      expect(SpecialAbility.getDescription(SpecialAbility.SLOW_EFFECT)).toBe(
        "攻撃した敵の移動速度を一定時間減少させる"
      );
    });

    it("無効な特殊能力の表示名取得でエラーが発生する", () => {
      expect(() => SpecialAbility.getDisplayName("INVALID" as SpecialAbility)).toThrow(
        "無効な特殊能力です: INVALID"
      );
    });
  });
});
