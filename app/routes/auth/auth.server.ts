import { compare } from "bcryptjs";
import { createUser, getUser } from "~/models/user.server";

export type GetUserIdReturns =
  | {
      status: "INVALID_PASSWORD";
    }
  | { status: "OK"; userId: string };

export async function getUserId({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<GetUserIdReturns> {
  const user = await getUser({ email });

  if (user === null) {
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
