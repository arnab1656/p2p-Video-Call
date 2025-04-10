"use client";

import { useRouter } from "next/navigation";

const Onboard = () => {
  const router = useRouter();

  const handleCreateRoom = () => {
    router.push("/lobby?action=create");
  };

  const handleJoinRoom = () => {
    router.push("/lobby?action=join");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="border border-gray-300 rounded p-6 w-80 text-center">
        <h1 className="text-xl font-semibold mb-6">Start Video Call</h1>

        <div className="flex flex-col gap-4">
          <button
            className="border border-gray-300 rounded px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={handleCreateRoom}
          >
            Create a New Room
          </button>

          <button
            className="border border-gray-300 rounded px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={handleJoinRoom}
          >
            Join Existing Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboard;
