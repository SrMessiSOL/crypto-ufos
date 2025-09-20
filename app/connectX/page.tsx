"use client";
import React, { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface TwitterData {
  username: string;
  profile_image_url?: string; // Profile picture URL from X
  points?: number; // Points metric (assumed from backend)
}

const TwitterConnectContent: React.FC = () => {
  const [twitterData, setTwitterData] = useState<TwitterData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedTwitterData = localStorage.getItem("twitterData");
    const twitterError = localStorage.getItem("twitterError");

    if (storedTwitterData) {
      try {
        const data: TwitterData = JSON.parse(storedTwitterData);
        console.log("Loaded X data from localStorage:", {
          username: data.username,
          profileImage: data.profile_image_url,
          points: data.points,
        });
        setTwitterData(data);
        localStorage.removeItem("twitterData");
      } catch (e) {
        console.error("Error parsing X data:", e);
        setError("Failed to load X data.");
      }
    } else if (twitterError) {
      console.error("X error from localStorage:", twitterError);
      setError(twitterError);
      localStorage.removeItem("twitterError");
    }
  }, []);

  const handleLogin = async () => {
    try {
      setError(null);
      const backendUrl = "https://crypto-ufos-backend.vercel.app";
      console.log("Sending auth request to:", `${backendUrl}/auth/twitter`);
      const response = await axios.get(`${backendUrl}/auth/twitter`, {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Origin": "https://www.cryptoufos.com",
        },
        withCredentials: true,
      });
      console.log("OAuth auth URL:", response.data.authUrl);
      localStorage.setItem("oauthToken", response.data.oauthToken);
      window.location.href = response.data.authUrl;
    } catch (error: any) {
      console.error("Error starting OAuth:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
      });
      setError(
        error.code === "ECONNREFUSED" || error.message.includes("Network Error")
          ? "Cannot connect to backend. Ensure the backend is deployed or running locally."
          : error.response?.data?.error
          ? `${error.response.data.error}: ${error.response.data.details || ""}`
          : `Failed to start OAuth: ${error.message || "Unknown error"}`
      );
    }
  };

  const handleDisconnect = () => {
    setTwitterData(null);
    setError(null);
    localStorage.removeItem("oauthToken");
    console.log("User disconnected");
    router.replace("/connectX");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0A0A0A 0%, #1C2526 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily: "'Orbitron', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated grid background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(0deg, rgba(0,221,235,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,221,235,0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          opacity: 0.15,
          animation: "glitch 5s infinite",
        }}
      />
      <style jsx>{`
        @keyframes glitch {
          0% {
            transform: translate(0);
          }
          20% {
            transform: translate(-2px, 2px);
          }
          40% {
            transform: translate(2px, -2px);
          }
          60% {
            transform: translate(-2px, 2px);
          }
          80% {
            transform: translate(2px, -2px);
          }
          100% {
            transform: translate(0);
          }
        }
        @keyframes glow {
          0% {
            box-shadow: 0 0 5px #00ddeb, 0 0 10px #00ddeb;
          }
          50% {
            box-shadow: 0 0 10px #00ddeb, 0 0 20px #00ddeb;
          }
          100% {
            box-shadow: 0 0 5px #00ddeb, 0 0 10px #00ddeb;
          }
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: "700px",
          width: "100%",
          background: "rgba(10, 10, 10, 0.85)",
          backdropFilter: "blur(12px)",
          border: "2px solid #00DDEB",
          borderRadius: "15px",
          padding: "30px",
          boxShadow: "0 0 20px rgba(0, 221, 235, 0.5)",
          position: "relative",
          zIndex: 1,
        }}
        role="main"
      >
        <h1
          style={{
            color: "#00DDEB",
            textShadow: "0 0 10px #00DDEB",
            fontSize: "2.5rem",
            textAlign: "center",
            marginBottom: "20px",
            animation: "glow 2s infinite",
          }}
        >
          Connect Your X Account
        </h1>

        {error && (
          <div
            style={{
              background: "rgba(255, 0, 0, 0.2)",
              border: "1px solid #FF0000",
              color: "#FF0000",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              textAlign: "center",
              animation: "glitch 1s infinite",
            }}
            role="alert"
          >
            {error}
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: "10px",
                background: "none",
                border: "none",
                color: "#FF0000",
                cursor: "pointer",
                textDecoration: "underline",
              }}
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}

        {!twitterData ? (
          <button
            onClick={handleLogin}
            style={{
              display: "block",
              width: "100%",
              padding: "15px",
              background: "linear-gradient(45deg, #00DDEB, #39FF14)",
              color: "#0A0A0A",
              border: "2px solid #00DDEB",
              borderRadius: "8px",
              fontSize: "1.2rem",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s",
              textTransform: "uppercase",
              animation: "glow 2s infinite",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 0 20px #00DDEB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 0 10px #00DDEB";
            }}
            aria-label="Connect to X"
          >
            Connect to X
          </button>
        ) : (
          <div>
            <h2
              style={{
                color: "#39FF14",
                textShadow: "0 0 10px #39FF14",
                fontSize: "1.8rem",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              Welcome, @{twitterData.username}
            </h2>
            {twitterData.profile_image_url && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <img
                  src={twitterData.profile_image_url}
                  alt={`${twitterData.username}'s profile picture`}
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    border: "2px solid #00DDEB",
                    boxShadow: "0 0 10px #00DDEB",
                  }}
                />
              </div>
            )}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(5px)",
                border: "1px solid #00DDEB",
                borderRadius: "10px",
                padding: "15px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  color: "#FF00FF",
                  textShadow: "0 0 10px #FF00FF",
                  fontSize: "1.5rem",
                  marginBottom: "10px",
                }}
              >
                Your Points
              </h3>
              <p
                style={{
                  color: "#FFFFFF",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                }}
              >
                {twitterData.points !== undefined
                  ? twitterData.points
                  : "No points available"}
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              style={{
                display: "block",
                width: "100%",
                padding: "10px",
                background: "rgba(255, 0, 0, 0.2)",
                border: "2px solid #FF0000",
                color: "#FF0000",
                borderRadius: "8px",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.3s",
                marginBottom: "30px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 0 20px #FF0000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
              aria-label="Disconnect from X"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const TwitterConnect: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "#0A0A0A",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #00DDEB",
              borderTop: "4px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      }
    >
      <TwitterConnectContent />
    </Suspense>
  );
};

export default TwitterConnect;