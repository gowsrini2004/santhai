import Dexie, { type Table } from "dexie";
import { Session } from "@/types";

export class SanthaiDB extends Dexie {
  sessions!: Table<Session>;

  constructor() {
    super("SanthaiDB");
    this.version(1).stores({
      sessions: "id, name, createdAt, updatedAt",
    });
  }
}

export const db = new SanthaiDB();
