import { compare } from "bcryptjs";
import { isPasswordBreached } from "~/lib/utils/pangea.server";
import { createUser, getUserByEmail } from "~/models/user.server";

export type GetUserIdReturns =
  | {
      status: "INVALID_PASSWORD";
    }
  | { status: "PASSWORD_BREACHED" }
  | { status: "OK"; userId: string };

export async function getUserId({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<GetUserIdReturns> {
  const user = await getUserByEmail({ email });

  if (user === null) {
    const isBreached = await isPasswordBreached(password);
    if (isBreached) {
      return { status: "PASSWORD_BREACHED" };
    }

    const createdUser = await createUser({ email, password });

    return { status: "OK", userId: createdUser.id };
  }

  const isPasswordMatching = await comparePassword(password, user.password);

  if (!isPasswordMatching) {
    return { status: "INVALID_PASSWORD" };
  }

  return { status: "OK", userId: user.id };
}

async function comparePassword(
  plainTextPassword: string,
  hashedPassword: string,
) {
  return compare(plainTextPassword, hashedPassword);
}
