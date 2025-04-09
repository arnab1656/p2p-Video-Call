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

interface FireBaseContextType {
  googleSignUpWithPopUp: () => Promise<UserCredential | null>;
  currentUser: User | null;
}

const FireBaseContext = createContext<FireBaseContextType>({
  googleSignUpWithPopUp: () => Promise.resolve(null),
  currentUser: null,
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
  }, []);

  useEffect(() => {
    const unSubscribe = onAuthStateChanged(auth, handleAuthChangeState);

    return () => {
      unSubscribe();
    };
  }, [handleAuthChangeState]);

  return (
    <FireBaseContext.Provider value={{ googleSignUpWithPopUp, currentUser }}>
      {props.children}
    </FireBaseContext.Provider>
  );
};

export const handleSignOut = async () => {
  try {
    signOut(auth);
  } catch (error) {
    console.log("Error signnoing out ", error);
  }
};

export default FireBaseProvider;
