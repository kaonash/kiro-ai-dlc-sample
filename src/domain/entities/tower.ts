import type { TowerType } from "../value-objects/tower-type";
import type { Position } from "../value-objects/position";
import type { Enemy } from "./enemy";

/**
 * タワーの統計情報
 */
export interface TowerStats {
  damage: number;
  range: number;
  attackSpeed: number; // 攻撃間隔（ミリ秒）
  cost: number;
}

/**
 * タワーエンティティ
 */
export class Tower {
  private _lastAttackTime = 0;
  private _currentTarget: Enemy | null = null;

  constructor(
    public readonly id: string,
    public readonly type: TowerType,
    public readonly position: Position,
    public readonly stats: TowerStats,
    public readonly createdAt: Date = new Date()
  ) {}

  /**
   * 現在のターゲット
   */
  get currentTarget(): Enemy | null {
    return this._currentTarget;
  }

  /**
   * 攻撃可能かどうか判定
   */
  canAttack(currentTime: number): boolean {
    return currentTime - this._lastAttackTime >= this.stats.attackSpeed;
  }

  /**
   * 範囲内の敵を検索
   */
  findEnemiesInRange(enemies: Enemy[]): Enemy[] {
    return enemies.filter(enemy => 
      enemy.isAlive && 
      this.position.distanceTo(enemy.currentPosition) <= this.stats.range
    );
  }

  /**
   * ターゲットを選択
   */
  selectTarget(enemies: Enemy[]): Enemy | null {
    const enemiesInRange = this.findEnemiesInRange(enemies);
    
    if (enemiesInRange.length === 0) {
      return null;
    }

    // 最も進行度の高い敵を優先
    return enemiesInRange.reduce((closest, enemy) => 
      enemy.pathProgress > closest.pathProgress ? enemy : closest
    );
  }

  /**
   * 敵を攻撃
   */
  attack(target: Enemy, currentTime: number): boolean {
    if (!this.canAttack(currentTime)) {
      return false;
    }

    if (!target.isAlive) {
      return false;
    }

    const distance = this.position.distanceTo(target.currentPosition);
    if (distance > this.stats.range) {
      return false;
    }

    // ダメージを与える
    target.takeDamage(this.stats.damage);
    this._lastAttackTime = currentTime;
    this._currentTarget = target;

    return true;
  }

  /**
   * 更新処理
   */
  update(enemies: Enemy[], currentTime: number): { attacked: boolean; target?: Enemy } {
    // 現在のターゲットが無効になった場合は新しいターゲットを選択
    if (!this._currentTarget || !this._currentTarget.isAlive || 
        this.position.distanceTo(this._currentTarget.currentPosition) > this.stats.range) {
      this._currentTarget = this.selectTarget(enemies);
    }

    // 攻撃実行
    if (this._currentTarget && this.canAttack(currentTime)) {
      const attacked = this.attack(this._currentTarget, currentTime);
      return { attacked, target: attacked ? this._currentTarget : undefined };
    }

    return { attacked: false };
  }

  /**
   * タワータイプに基づくデフォルト統計を取得
   */
  static getDefaultStats(type: TowerType): TowerStats {
    const statsMap: Record<TowerType, TowerStats> = {
      ARCHER: { damage: 25, range: 100, attackSpeed: 1000, cost: 3 },
      CANNON: { damage: 50, range: 80, attackSpeed: 2000, cost: 5 },
      MAGIC: { damage: 35, range: 120, attackSpeed: 1500, cost: 4 },
      ICE: { damage: 20, range: 90, attackSpeed: 1200, cost: 4 },
      FIRE: { damage: 40, range: 70, attackSpeed: 800, cost: 5 },
      LIGHTNING: { damage: 60, range: 150, attackSpeed: 2500, cost: 6 },
      POISON: { damage: 15, range: 85, attackSpeed: 600, cost: 3 },
      SUPPORT: { damage: 0, range: 120, attackSpeed: 0, cost: 2 },
    };

    return statsMap[type];
  }

  /**
   * カードからタワーを作成
   */
  static fromCard(card: any, position: Position): Tower {
    // カード名からタワータイプを推定（簡略化）
    let towerType: TowerType = "ARCHER";
    
    if (card.name.includes("弓") || card.name.includes("archer")) {
      towerType = "ARCHER";
    } else if (card.name.includes("大砲") || card.name.includes("cannon")) {
      towerType = "CANNON";
    } else if (card.name.includes("魔法") || card.name.includes("magic")) {
      towerType = "MAGIC";
    }

    const stats = Tower.getDefaultStats(towerType);
    const towerId = `tower-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return new Tower(towerId, towerType, position, stats);
  }
}