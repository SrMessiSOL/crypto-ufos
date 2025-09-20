"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, LogOut, RefreshCw } from "lucide-react";

interface XActivity {
  id: string;
  type: "post" | "like" | "repost" | "reply";
  text: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [ufosBalance, setUfosBalance] = useState(0);
  const [activities, setActivities] = useState<XActivity[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "likes" | "reposts" | "replies">("posts");
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nftLevel, setNftLevel] = useState(1);

  const fetchProfile = async (retries = 3, delay = 1000) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = localStorage.getItem("xSession");
      if (!session) throw new Error("Not authenticated");
      const { userId, access_token } = JSON.parse(session);
      const healthResponse = await axios.get("http://localhost:5000/health", { timeout: 3000 });
      if (healthResponse.data.status !== "ok") throw new Error("Backend health check failed");
      const response = await axios.get("http://localhost:5000/user/profile", {
        headers: { "x-user-id": userId },
        timeout: 5000,
      });
      const { username, ufosBalance, activities, nftLevel } = response.data;
      setUsername(username);
      setUfosBalance(ufosBalance || 0);
      setActivities(activities || []);
      setNftLevel(nftLevel || 1);
      setIsConnected(true);
      setIsLoading(false);
    } catch (err: any) {
      console.error("Profile fetch error:", {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status,
        stack: err.stack,
      });
      if (retries > 0 && (err.code === "ECONNREFUSED" || err.code === "ERR_NETWORK")) {
        console.log(`Retrying... (${retries} attempts left)`);
        setTimeout(() => fetchProfile(retries - 1, delay * 2), delay);
      } else {
        setError(
          err.response?.status === 429
            ? "X API rate limit reached. Please wait a few minutes and try again."
            : err.code === "ERR_NETWORK"
            ? "Cannot connect to backend server. Ensure 'node server.mjs' is running."
            : err.response?.data?.error || err.message || "Failed to load profile."
        );
        setIsLoading(false);
      }
    }
  };

  const renderActivities = (type: XActivity["type"]) => {
    const filtered = activities.filter((activity) => activity.type === type);
    return filtered.length ? (
      <ul className="space-y-4">
        {filtered.map((activity) => (
          <li key={activity.id} className="bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-300">{activity.text}</p>
            <p className="text-sm text-gray-500">{new Date(activity.created_at).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-gray-400">No {type}s found.</p>
    );
  };

  useEffect(() => {
    const session = localStorage.getItem("xSession");
    setIsSessionLoading(false);
    if (session) {
      setIsConnected(true);
      fetchProfile();
    } else {
      router.push("/");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("xSession");
    setUsername(null);
    setIsConnected(false);
    router.push("/");
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">CryptoUFOs Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center text-red-500 hover:text-red-400"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            <p>{error}</p>
            <div className="mt-2 flex space-x-2">
              <button
                onClick={() => fetchProfile()}
                className="flex items-center text-sm text-blue-400 underline"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </button>
              <button
                onClick={() => router.push("/")}
                className="text-sm text-blue-400 underline"
              >
                Return to Home
              </button>
            </div>
          </div>
        )}

        {!error && (
          <>
            <div className="bg-gray-800 p-6 rounded-lg mb-6">
              <h2 className="text-xl font-semibold mb-2">
                Welcome, @{username || "Guest"}
              </h2>
              <p>$UFOS Balance: <span className="font-bold">{ufosBalance}</span></p>
              <p>NFT Level: <span className="font-bold">{nftLevel}</span></p>
              <button
                onClick={() => router.push("/market")}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
              >
                Visit Interstellar Marketplace
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex space-x-4 border-b border-gray-700 mb-4">
                {["posts", "likes", "reposts", "replies"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`py-2 px-4 ${
                      activeTab === tab ? "border-b-2 border-blue-500 text-white" : "text-gray-400"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <div>
                {activeTab === "posts" && renderActivities("post")}
                {activeTab === "likes" && renderActivities("like")}
                {activeTab === "reposts" && renderActivities("repost")}
                {activeTab === "replies" && renderActivities("reply")}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;