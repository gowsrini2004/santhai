import Dexie, { type Table } from "dexie";
import { Session, Folder } from "@/types";

export class SanthaiDB extends Dexie {
  sessions!: Table<Session>;
  folders!: Table<Folder>;

  constructor() {
    super("SanthaiDB");
    this.version(2).stores({
      sessions: "id, name, folderId, createdAt, updatedAt",
      folders: "id, name, parentId, createdAt",
    });
  }
}

export const db = new SanthaiDB();
