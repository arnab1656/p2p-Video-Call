"use client";

import { useEffect, useState } from "react";
import { useFireBase } from "../provider/firebaseProvider";
import { FaGoogle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { getCookies } from "utils/cookiesSet";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const {
    googleSignUpWithPopUp,
    signUpWithPasswordAndEmail,
    loginWithPasswordAndEmail,
    currentUser,
    handleSignOut,
  } = useFireBase();

  const router = useRouter();

  const handleSignUPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signUpWithPasswordAndEmail({ email, password });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginWithPasswordAndEmail({ email, password });
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (currentUser === null) {
        const authToken = await getCookies("auth-token");
        if (!authToken) {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [currentUser]);

  const buttonStyle =
    "border border-gray-300 rounded px-4 py-2 m-2 cursor-pointer hover:bg-gray-100";
  const inputStyle = "border border-gray-300 rounded px-4 py-2 m-2 w-full";

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="flex space-x-4">
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-2xl mb-8">Video Call App</h1>

      {currentUser ? (
        <div className="border border-gray-200 p-6 rounded shadow-sm">
          <p>Signed in as: {currentUser.email}</p>
          <button onClick={handleSignOut} className={buttonStyle}>
            Sign Out
          </button>

          <button
            onClick={() => {
              router.push("/onboard");
            }}
            className={buttonStyle}
          >
            Lets Start the Chat
          </button>
        </div>
      ) : (
        <div className="border border-gray-200 p-6 rounded shadow-sm w-80">
          <form onSubmit={handleSignUPSubmit} className="mb-6">
            <div className="mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className={inputStyle}
              />
            </div>
            <div className="mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className={inputStyle}
              />
            </div>
            <div className="flex justify-between items-center">
              <button type="submit" className={buttonStyle}>
                Sign Up
              </button>
              <span>or</span>
              <button
                type="button"
                onClick={handleLoginSubmit}
                className={buttonStyle}
              >
                Login
              </button>
            </div>
          </form>

          <div className="mt-4 border-t pt-4">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors cursor-pointer w-full justify-center"
              onClick={googleSignUpWithPopUp}
            >
              <FaGoogle className="text-red-500" />
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
