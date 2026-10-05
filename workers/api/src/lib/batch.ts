import type { Db } from "../types";

export type Stmt = Parameters<Db["batch"]>[0][number];

/** Run statements atomically in one D1 batch (all succeed or none are applied). */
export async function runBatch(db: Db, stmts: Stmt[]): Promise<void> {
  if (stmts.length === 0) return;
  await db.batch(stmts as [Stmt, ...Stmt[]]);
}
