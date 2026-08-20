import { db } from "@nuxthub/db";
import { userTable } from "@nuxthub/db/schema";

class UserService {
  private readonly database: typeof db;
  constructor(database: typeof db) {
    this.database = database;
  }

  async list() {
    return await this.database.select().from(userTable);
  }
}

export const userService = new UserService(db);
