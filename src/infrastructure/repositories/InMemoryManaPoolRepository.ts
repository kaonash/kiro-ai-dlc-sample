import { ManaPool } from "../../domain/entities/ManaPool";
import { 
  ManaPoolRepository, 
  SaveResult, 
  DeleteResult, 
  ManaPoolStatistics 
} from "./ManaPoolRepository";

export class InMemoryManaPoolRepository implements ManaPoolRepository {
  private readonly pools: Map<string, ManaPool> = new Map();

  async save(manaPool: ManaPool): Promise<SaveResult> {
    try {
      if (!manaPool) {
        return {
          isSuccess: false,
          error: "魔力プールが無効です"
        };
      }

      // 深いコピーを作成して保存
      const poolCopy = this.createPoolCopy(manaPool);
      this.pools.set(manaPool.getId(), poolCopy);

      return {
        isSuccess: true,
        savedPool: poolCopy
      };
    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "魔力プール保存中にエラーが発生しました"
      };
    }
  }

  async findById(id: string): Promise<ManaPool | undefined> {
    if (!id || id.trim() === "") {
      return undefined;
    }

    const pool = this.pools.get(id);
    return pool ? this.createPoolCopy(pool) : undefined;
  }

  async findAll(): Promise<ManaPool[]> {
    return Array.from(this.pools.values()).map(pool => this.createPoolCopy(pool));
  }

  async delete(id: string): Promise<DeleteResult> {
    try {
      this.pools.delete(id);
      return { isSuccess: true };
    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "魔力プール削除中にエラーが発生しました"
      };
    }
  }

  async clear(): Promise<DeleteResult> {
    try {
      this.pools.clear();
      return { isSuccess: true };
    } catch (error) {
      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : "魔力プールクリア中にエラーが発生しました"
      };
    }
  }

  async findByManaRange(minMana: number, maxMana: number): Promise<ManaPool[]> {
    const result: ManaPool[] = [];
    
    for (const pool of this.pools.values()) {
      const currentMana = pool.getCurrentMana();
      if (currentMana >= minMana && currentMana <= maxMana) {
        result.push(this.createPoolCopy(pool));
      }
    }
    
    return result;
  }

  async findAtMaxCapacity(): Promise<ManaPool[]> {
    const result: ManaPool[] = [];
    
    for (const pool of this.pools.values()) {
      if (pool.isAtMaxCapacity()) {
        result.push(this.createPoolCopy(pool));
      }
    }
    
    return result;
  }

  async findLowMana(threshold: number): Promise<ManaPool[]> {
    const result: ManaPool[] = [];
    
    for (const pool of this.pools.values()) {
      if (pool.getCurrentMana() < threshold) {
        result.push(this.createPoolCopy(pool));
      }
    }
    
    return result;
  }

  async getStatistics(): Promise<ManaPoolStatistics> {
    const pools = Array.from(this.pools.values());
    
    if (pools.length === 0) {
      return {
        totalPools: 0,
        totalMana: 0,
        averageMana: 0,
        totalCapacity: 0,
        averageCapacity: 0
      };
    }

    const totalMana = pools.reduce((sum, pool) => sum + pool.getCurrentMana(), 0);
    const totalCapacity = pools.reduce((sum, pool) => sum + pool.getMaxMana(), 0);

    return {
      totalPools: pools.length,
      totalMana,
      averageMana: totalMana / pools.length,
      totalCapacity,
      averageCapacity: totalCapacity / pools.length
    };
  }

  private createPoolCopy(original: ManaPool): ManaPool {
    // 新しいManaPoolインスタンスを作成
    const copy = new ManaPool(
      original.getId(),
      original.getCurrentMana(),
      original.getMaxMana()
    );

    // ドメインイベントもコピー
    const events = original.getDomainEvents();
    for (const event of events) {
      // イベントを再発行（実際の実装では適切なイベント復元が必要）
    }

    return copy;
  }
}