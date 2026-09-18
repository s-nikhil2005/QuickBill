import db from "../config/db";

export interface IUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
}

class UserModel {

  static async createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<number> {

    const { name, email, password, role } = data;

    const sql = `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `;

    const [result]: any = await db.query(sql, [
      name,
      email,
      password,
      role || "staff"
    ]);

    return result.insertId;
  }

  static async findByEmail(email: string): Promise<IUser | undefined> {
    const sql = `SELECT * FROM users WHERE email = ? LIMIT 1`;
    const [rows]: any = await db.query(sql, [email]);
    return rows[0];
  }

  static async findById(id: number | string): Promise<IUser | undefined> {
    const sql = `SELECT * FROM users WHERE id = ? LIMIT 1`;
    const [rows]: any = await db.query(sql, [id]);
    return rows[0];
  }

  static async updateById(
    userId: number | string,
    updates: Partial<IUser>
  ): Promise<any> {

    const fields: string[] = [];
    const values: any[] = [];

    for (const key in updates) {
      fields.push(`${key} = ?`);
      values.push((updates as any)[key]);
    }

    values.push(userId);

    const sql = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = ?
    `;

    const [result]: any = await db.query(sql, values);
    return result;
  }

  static async updatePassword(
    email: string,
    hashedPassword: string
  ): Promise<any> {

    const sql = `
      UPDATE users
      SET password = ?
      WHERE email = ?
    `;

    const [result]: any = await db.query(sql, [hashedPassword, email]);
    return result;
  }

  static async updatePasswordById(
    id: number | string,
    hashedPassword: string
  ): Promise<any> {

    const sql = `
      UPDATE users
      SET password = ?
      WHERE id = ?
    `;

    const [result]: any = await db.query(sql, [hashedPassword, id]);
    return result;
  }
}

export default UserModel;
