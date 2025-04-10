// components/Navbar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useFireBase } from "../provider/firebaseProvider";
import { useRouter } from "next/navigation";
import { FaVideo, FaUserCircle, FaSignOutAlt, FaCog } from "react-icons/fa";

const Navbar = () => {
  const { currentUser, handleSignOut } = useFireBase();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    console.log("user is in navbar", currentUser);
  }, [currentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = async () => {
    await handleSignOut();
    setDropdownOpen(false);
    router.push("/");
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser?.displayName) return "?";

    const nameParts = currentUser.displayName.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };

  return (
    <nav className="bg-white shadow-md px-4 py-2 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo and App Name */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-semibold"
        >
          <FaVideo className="text-blue-600" />
          <span>VideoCall</span>
        </Link>

        {/* Middle Navigation Links */}
        <div className="hidden md:flex space-x-8">
          <Link
            href="/lobby?action=create"
            className="hover:text-blue-600 transition-colors"
          >
            New Meeting
          </Link>
          <Link
            href="/lobby?action=join"
            className="hover:text-blue-600 transition-colors"
          >
            Join Meeting
          </Link>
        </div>

        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          {currentUser ? (
            <div
              onClick={toggleDropdown}
              className="flex items-center gap-2 cursor-pointer"
            >
              {currentUser.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.photoURL}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  {getUserInitials()}
                </div>
              )}
              <span className="hidden md:inline">
                {currentUser.displayName || currentUser.email}
              </span>
            </div>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
            >
              <FaUserCircle className="text-xl" />
              <span className="hidden md:inline">Sign In</span>
            </Link>
          )}

          {/* Dropdown Menu */}
          {dropdownOpen && currentUser && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentUser.displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {currentUser.email}
                </p>
              </div>

              <Link
                href="/profile"
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => setDropdownOpen(false)}
              >
                <FaCog />
                <span>Settings</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
              >
                <FaSignOutAlt />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
