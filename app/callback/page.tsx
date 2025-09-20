"use client";

import React, { useEffect } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const CallbackContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const oauthToken = searchParams.get("oauth_token");
    const oauthVerifier = searchParams.get("oauth_verifier");
    const storedOauthToken = localStorage.getItem("oauthToken");

    console.log("Environment check:", {
      NODE_ENV: process.env.NODE_ENV,
      currentUrl: window.location.href,
      oauthToken: oauthToken?.substring(0, 20) + "...",
      oauthVerifier: oauthVerifier?.substring(0, 20) + "...",
      storedOauthToken: storedOauthToken?.substring(0, 20) + "...",
    });

    if (oauthToken && oauthVerifier && storedOauthToken === oauthToken) {
      console.log("Callback route received params:", {
        oauthToken: oauthToken.substring(0, 20) + "...",
        oauthVerifier: oauthVerifier.substring(0, 20) + "...",
      });

      const fetchData = async (retries = 0, delay = 10000) => {
        try {
          const backendUrl = "https://crypto-ufos-backend.vercel.app"; // Hardcode production URL
          console.log("Sending callback request to:", `${backendUrl}/auth/twitter/callback`);
          const response = await axios.get(`${backendUrl}/auth/twitter/callback`, {
            params: { oauth_token: oauthToken, oauth_verifier: oauthVerifier },
            timeout: 60000, // 60 seconds
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Origin": "https://www.cryptoufos.com",
            },
            withCredentials: true,
          });
          console.log("Callback response:", {
            username: response.data.username,
            userId: response.data.userId,
          });

          // Save to Firestore
          try {
            await setDoc(doc(db, "TwitterAccounts", response.data.userId), {
              userId: response.data.userId,
              username: response.data.username,
              accessToken: response.data.accessToken,
              accessSecret: response.data.accessSecret,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }, { merge: true });
            console.log(`Saved Twitter account for userId: ${response.data.userId} to Firestore`);
          } catch (firestoreError: any) {
            console.error("Error saving to Firestore:", {
              message: firestoreError.message,
              stack: firestoreError.stack,
            });
            localStorage.setItem("twitterError", "Failed to save Twitter data to database");
          }

          // Save to localStorage for frontend use
          localStorage.setItem(
            "twitterData",
            JSON.stringify({
              username: response.data.username,
              userId: response.data.userId,
              accessToken: response.data.accessToken,
              accessSecret: response.data.accessSecret,
            })
          );
          localStorage.removeItem("oauthToken");
          router.push("/connectX");
        } catch (error: any) {
          console.error("Error in callback:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            code: error.code,
            axiosConfig: error.config,
            headers: error.response?.headers,
            requestHeaders: error.request?.headers,
          });
          if (
            retries > 0 &&
            (error.code === "ECONNREFUSED" ||
              error.message.includes("Network Error") ||
              error.code === "ERR_BAD_RESPONSE" ||
              error.response?.status === 429 ||
              error.response?.status === 403 ||
              error.response?.status === 500)
          ) {
            console.warn(`Retrying callback request (${retries} attempts left)...`);
            setTimeout(() => fetchData(retries - 1, delay * 2), delay);
            return;
          }
          localStorage.setItem(
            "twitterError",
            error.response?.data?.error || `Failed to process Twitter callback: ${error.message}`
          );
          localStorage.removeItem("oauthToken");
          router.push("/connectX");
        }
      };

      fetchData();
    } else {
      console.error("Invalid callback parameters:", {
        oauthToken: oauthToken || "null",
        oauthVerifier: oauthVerifier || "null",
        storedOauthToken: storedOauthToken || "null",
      });
      localStorage.setItem("twitterError", "Invalid Twitter authentication callback parameters");
      localStorage.removeItem("oauthToken");
      router.push("/connectX");
    }
  }, [searchParams, router]);

  return <div>Redirecting...</div>;
};

const Callback: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
};

export const dynamic = "force-dynamic";
export default Callback;