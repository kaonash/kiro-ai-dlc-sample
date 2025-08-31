import type { CardCost } from "../value-objects/card-cost.js";
import { SpecialAbility } from "../value-objects/special-ability.js";
import { TowerType } from "../value-objects/tower-type.js";

/**
 * カードの表示情報
 */
export interface CardDisplayInfo {
  name: string;
  description: string;
  cost: number;
  towerType: string;
  specialAbility: string;
  specialAbilityDescription: string;
}

/**
 * カードエンティティ
 */
export class Card {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _description: string;
  private readonly _cost: CardCost;
  private readonly _towerType: TowerType;
  private readonly _specialAbility: SpecialAbility;

  constructor(
    id: string,
    name: string,
    description: string,
    cost: CardCost,
    towerType: TowerType,
    specialAbility: SpecialAbility
  ) {
    if (!id.trim()) {
      throw new Error("カードIDは空であってはいけません");
    }
    if (!name.trim()) {
      throw new Error("カード名は空であってはいけません");
    }
    if (!description.trim()) {
      throw new Error("カード説明は空であってはいけません");
    }

    this._id = id;
    this._name = name;
    this._description = description;
    this._cost = cost;
    this._towerType = towerType;
    this._specialAbility = specialAbility;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get cost(): CardCost {
    return this._cost;
  }

  get towerType(): TowerType {
    return this._towerType;
  }

  get specialAbility(): SpecialAbility {
    return this._specialAbility;
  }

  /**
   * カードの等価性を判定（IDベース）
   */
  equals(other: Card): boolean {
    return this._id === other._id;
  }

  /**
   * カードの表示情報を取得
   */
  getDisplayInfo(): CardDisplayInfo {
    return {
      name: this._name,
      description: this._description,
      cost: this._cost.value,
      towerType: TowerType.getDisplayName(this._towerType),
      specialAbility: SpecialAbility.getDisplayName(this._specialAbility),
      specialAbilityDescription: SpecialAbility.getDescription(this._specialAbility),
    };
  }
}
