import { db } from "hub:db";
import { userTable } from "hub:db:schema";

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
