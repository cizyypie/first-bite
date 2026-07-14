import { db } from "../db/client";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";

export class UserService {
  async register(data: any) {
    // 1. Hash the password natively with Bun
    const hashedPassword = await Bun.password.hash(data.password);

    // 2. Insert the user
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        password: hashedPassword,
        role: data.role || "customer",
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
      });
    return newUser;
  }

  async login(data: any) {
     const [user] = await db.select().from(users).where(eq(users.email, data.email));
  if (!user) throw new Error("INVALID_CREDENTIALS");

  const isMatch = await Bun.password.verify(data.password, user.password);
  if (!isMatch) throw new Error("INVALID_CREDENTIALS");

  const { password, ...safeUser } = user;
  return safeUser;
  }
}