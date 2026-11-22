declare module "node:sqlite" {
  type SQLInputValue = string | number | bigint | null | ArrayBufferView;

  export class StatementSync {
    all(...anonymousParameters: SQLInputValue[]): unknown[];
    get(...anonymousParameters: SQLInputValue[]): unknown;
    run(...anonymousParameters: SQLInputValue[]): {
      changes: number | bigint;
      lastInsertRowid: number | bigint;
    };
  }

  export class DatabaseSync {
    constructor(location: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }
}
