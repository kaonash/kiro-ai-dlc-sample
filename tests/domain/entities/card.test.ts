import { describe, expect, it } from "bun:test";
import { Card } from "../../../src/domain/entities/card.js";
import { CardCost } from "../../../src/domain/value-objects/card-cost.js";
import { SpecialAbility } from "../../../src/domain/value-objects/special-ability.js";
import { TowerType } from "../../../src/domain/value-objects/tower-type.js";

describe("Card", () => {
  describe("正常なケース", () => {
    it("有効なパラメータでカードを作成できる", () => {
      const card = new Card(
        "card-001",
        "弓兵カード",
        "基本的な弓兵タワーを配置する",
        new CardCost(2),
        TowerType.ARCHER,
        SpecialAbility.NONE
      );

      expect(card.id).toBe("card-001");
      expect(card.name).toBe("弓兵カード");
      expect(card.description).toBe("基本的な弓兵タワーを配置する");
      expect(card.cost.value).toBe(2);
      expect(card.towerType).toBe(TowerType.ARCHER);
      expect(card.specialAbility).toBe(SpecialAbility.NONE);
    });

    it("特殊能力付きのカードを作成できる", () => {
      const card = new Card(
        "card-002",
        "炎の大砲",
        "燃焼効果を持つ大砲タワーを配置する",
        new CardCost(5),
        TowerType.CANNON,
        SpecialAbility.BURN
      );

      expect(card.specialAbility).toBe(SpecialAbility.BURN);
    });
  });

  describe("異常なケース", () => {
    it("空のIDでエラーが発生する", () => {
      expect(
        () =>
          new Card(
            "",
            "テストカード",
            "説明",
            new CardCost(1),
            TowerType.ARCHER,
            SpecialAbility.NONE
          )
      ).toThrow("カードIDは空であってはいけません");
    });

    it("空の名前でエラーが発生する", () => {
      expect(
        () =>
          new Card("card-001", "", "説明", new CardCost(1), TowerType.ARCHER, SpecialAbility.NONE)
      ).toThrow("カード名は空であってはいけません");
    });

    it("空の説明でエラーが発生する", () => {
      expect(
        () =>
          new Card(
            "card-001",
            "テストカード",
            "",
            new CardCost(1),
            TowerType.ARCHER,
            SpecialAbility.NONE
          )
      ).toThrow("カード説明は空であってはいけません");
    });
  });

  describe("等価性", () => {
    it("同じIDのカードは等価である", () => {
      const card1 = new Card(
        "card-001",
        "弓兵カード",
        "説明",
        new CardCost(2),
        TowerType.ARCHER,
        SpecialAbility.NONE
      );
      const card2 = new Card(
        "card-001",
        "異なる名前",
        "異なる説明",
        new CardCost(3),
        TowerType.CANNON,
        SpecialAbility.BURN
      );

      expect(card1.equals(card2)).toBe(true);
    });

    it("異なるIDのカードは等価でない", () => {
      const card1 = new Card(
        "card-001",
        "弓兵カード",
        "説明",
        new CardCost(2),
        TowerType.ARCHER,
        SpecialAbility.NONE
      );
      const card2 = new Card(
        "card-002",
        "弓兵カード",
        "説明",
        new CardCost(2),
        TowerType.ARCHER,
        SpecialAbility.NONE
      );

      expect(card1.equals(card2)).toBe(false);
    });
  });

  describe("カード情報の取得", () => {
    it("カードの表示情報を取得できる", () => {
      const card = new Card(
        "card-001",
        "炎の魔法使い",
        "燃焼効果を持つ魔法タワーを配置する",
        new CardCost(4),
        TowerType.MAGIC,
        SpecialAbility.BURN
      );

      const displayInfo = card.getDisplayInfo();
      expect(displayInfo.name).toBe("炎の魔法使い");
      expect(displayInfo.description).toBe("燃焼効果を持つ魔法タワーを配置する");
      expect(displayInfo.cost).toBe(4);
      expect(displayInfo.towerType).toBe("魔法タワー");
      expect(displayInfo.specialAbility).toBe("燃焼");
      expect(displayInfo.specialAbilityDescription).toBe("攻撃した敵に燃焼ダメージを与える");
    });
  });
});
