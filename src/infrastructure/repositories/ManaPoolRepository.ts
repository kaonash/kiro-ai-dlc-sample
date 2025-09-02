import type { ManaPool } from "../../domain/entities/ManaPool";

export interface SaveResult {
  isSuccess: boolean;
  savedPool?: ManaPool;
  error?: string;
}

export interface DeleteResult {
  isSuccess: boolean;
  error?: string;
}

export interface ManaPoolStatistics {
  totalPools: number;
  totalMana: number;
  averageMana: number;
  totalCapacity: number;
  averageCapacity: number;
}

export interface ManaPoolRepository {
  save(manaPool: ManaPool): Promise<SaveResult>;
  findById(id: string): Promise<ManaPool | undefined>;
  findAll(): Promise<ManaPool[]>;
  delete(id: string): Promise<DeleteResult>;
  clear(): Promise<DeleteResult>;
  findByManaRange(minMana: number, maxMana: number): Promise<ManaPool[]>;
  findAtMaxCapacity(): Promise<ManaPool[]>;
  findLowMana(threshold: number): Promise<ManaPool[]>;
  getStatistics(): Promise<ManaPoolStatistics>;
}
