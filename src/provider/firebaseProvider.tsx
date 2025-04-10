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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { deleteCookies, setCookies } from "utils/cookiesSet";

interface FireBaseContextType {
  googleSignUpWithPopUp: () => Promise<UserCredential | null>;
  currentUser: User | null;
  handleSignOut: () => Promise<void>;
  signUpWithPasswordAndEmail: ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => Promise<void>;

  loginWithPasswordAndEmail: ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => void;

  signInWithEmailLink: (email: string) => Promise<void>;
}

const FireBaseContext = createContext<FireBaseContextType>({
  googleSignUpWithPopUp: () => Promise.resolve(null),
  currentUser: null,
  handleSignOut: () => Promise.resolve(),
  signUpWithPasswordAndEmail: () => Promise.resolve(),
  loginWithPasswordAndEmail: () => {},
  signInWithEmailLink: () => Promise.resolve(),
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

      const token = await result.user.getIdToken();
      await setCookies("auth-token", token);

      if (result.user) {
        router.push("/onboard");
      }
      return result;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return null;
    }
  }, [router]);

  const signUpWithPasswordAndEmail = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      try {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        setCurrentUser(result.user);

        const token = await result.user.getIdToken();
        await setCookies("auth-token", token);

        if (result.user) {
          router.push("/onboard");
        }
      } catch (err) {
        console.log(err);
      }
    },
    [router]
  );

  const loginWithPasswordAndEmail = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);

        setCurrentUser(result.user);

        const token = await result.user.getIdToken();
        await setCookies("auth-token", token);

        if (result.user) {
          router.push("/onboard");
        }
      } catch (err) {
        console.log(err);
      }
    },
    [router]
  );

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

  const signInWithEmailLink = useCallback(async (email: string) => {
    try {
      const actionCodeSettings = {
        url: window.location.href,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      alert("Check your email for the sign-in link");
    } catch (error) {
      console.error("Error sending email link:", error);
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
      value={{
        googleSignUpWithPopUp,
        currentUser,
        handleSignOut,
        signUpWithPasswordAndEmail,
        loginWithPasswordAndEmail,
        signInWithEmailLink,
      }}
    >
      {props.children}
    </FireBaseContext.Provider>
  );
};

export default FireBaseProvider;
