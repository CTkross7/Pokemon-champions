// Minimal D1 typings (avoids pulling @cloudflare/workers-types into the app build).
export interface D1Database {
  prepare(query: string): D1PreparedStatement
}
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  run(): Promise<unknown>
  all<T = unknown>(): Promise<{ results: T[] }>
}
