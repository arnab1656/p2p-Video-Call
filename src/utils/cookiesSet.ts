"use server";

import { cookies } from "next/headers";

export const setCookies = async (cookieName: string, token: string) => {
  const cookiesStore = await cookies();

  cookiesStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 7200,
  });
};

export const getCookies = async (cookieName: string) => {
  const cookiesStore = await cookies();
  const cookie = cookiesStore.get(cookieName);
  return cookie?.value;
};

export const deleteCookies = async (cookieName: string) => {
  const cookiesStore = await cookies();
  cookiesStore.delete(cookieName);
};
