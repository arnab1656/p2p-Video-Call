"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth } from "../app/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  UserCredential,
  User,
  onAuthStateChanged,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { deleteCookies, setCookies } from "utils/cookiesSet";

interface FireBaseContextType {
  googleSignUpWithPopUp: () => Promise<UserCredential | null>;
  currentUser: User | null;
  handleSignOut: () => Promise<void>;
}

const FireBaseContext = createContext<FireBaseContextType>({
  googleSignUpWithPopUp: () => Promise.resolve(null),
  currentUser: null,
  handleSignOut: () => Promise.resolve(),
});

export const useFireBase = () => {
  const context = useContext(FireBaseContext);
  return context;
};

const provider = new GoogleAuthProvider();

const FireBaseProvider = (props: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  const googleSignUpWithPopUp = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, provider);

      setCurrentUser(result.user);

      await setCookies("auth-token", result.user.accessToken);

      if (result.user) {
        router.push("/lobby");
      }
      return result;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return null;
    }
  }, [router]);

  const handleAuthChangeState = useCallback((user: User | null) => {
    setCurrentUser(user);
    if (!user) {
      deleteCookies("auth-token");
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      signOut(auth);
    } catch (error) {
      console.log("Error signnoing out ", error);
    }
  }, []);

  useEffect(() => {
    const unSubscribe = onAuthStateChanged(auth, handleAuthChangeState);

    return () => {
      unSubscribe();
    };
  }, [handleAuthChangeState]);

  return (
    <FireBaseContext.Provider
      value={{ googleSignUpWithPopUp, currentUser, handleSignOut }}
    >
      {props.children}
    </FireBaseContext.Provider>
  );
};

export default FireBaseProvider;
