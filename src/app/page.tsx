"use client";

import { useEffect } from "react";
import { useFireBase } from "../provider/firebaseProvider";
import { FaGoogle } from "react-icons/fa";

function HomePage() {
  const { googleSignUpWithPopUp, currentUser } = useFireBase();

  useEffect(() => {
    console.log("CURRETN USER", currentUser);
  }, [currentUser]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div>
        <h1>Login with Google</h1>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={googleSignUpWithPopUp}
        >
          <FaGoogle className="text-red-500" />
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}

export default HomePage;
