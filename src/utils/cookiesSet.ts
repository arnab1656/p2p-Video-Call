"use server";

import { cookies } from "next/headers";

export const setCookies = async (cookieName: string, token: string) => {
  const cookiesStore = await cookies();

  cookiesStore.set(cookieName, token);
};

export const getCookies = async (cookieName: string) => {
  const cookiesStore = await cookies();

  const cookie = cookiesStore.get(cookieName);

  return cookie?.value;
};

export const deleteCookies = async (cookiesName: string) => {
  (await cookies()).delete(cookiesName);
};
