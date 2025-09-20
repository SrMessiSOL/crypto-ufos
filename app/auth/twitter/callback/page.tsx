"use client";

import React, { useEffect } from "react";
import axios, { AxiosError } from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { db } from "../../../lib/firebase";
import { doc, setDoc, getDoc, collection, writeBatch, query, where, getDocs } from "firebase/firestore";

interface TwitterErrorResponse {
  error?: string;
  details?: string;
  twitterApiErrors?: unknown;
  userId?: string;
  username?: string;
  accessToken?: string;
  accessSecret?: string;
  profile_image_url?: string | null;
}

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  replies: number;
  reposts: number;
  likes: number;
  views: number;
}

const POINTS_WEIGHTS = {
  likes: 1,
  replies: 2,
  reposts: 3,
  views: 0.1,
};

const calculatePoints = (metrics: { likes: number; replies: number; reposts: number; views: number }) => {
  return (
    metrics.likes * POINTS_WEIGHTS.likes +
    metrics.replies * POINTS_WEIGHTS.replies +
    metrics.reposts * POINTS_WEIGHTS.reposts +
    metrics.views * POINTS_WEIGHTS.views
  );
};

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

      const fetchFirestoreData = async (userId: string) => {
        let userData = null;
        let tweets: Tweet[] = [];
        let points = 1000; // Default

        try {
          const userDocRef = doc(db, "TwitterAccounts", userId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            userData = {
              userId: data.userId,
              username: data.username,
              profile_image_url: data.profile_image_url || null,
              accessToken: data.accessToken,
              accessSecret: data.accessSecret,
            };
            points = data.points || 1000;
          }
        } catch (error) {
          console.error("Error fetching user from Firestore:", error);
        }

        try {
          const tweetsQuery = query(collection(db, "TweetLogs"), where("userId", "==", userId));
          const tweetSnapshot = await getDocs(tweetsQuery);
          tweets = tweetSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: data.tweetId,
              text: data.text,
              created_at: data.createdAt,
              replies: data.metrics.replies || 0,
              reposts: data.metrics.reposts || 0,
              likes: data.metrics.likes || 0,
              views: data.metrics.views || 0,
            };
          });
        } catch (error) {
          console.error("Error fetching tweets from Firestore:", error);
        }

        return { userData, tweets, points, source: tweets.length > 0 || userData ? "firestore" : "none" };
      };

      const saveToFirestore = async (
        userData: { userId: string; username: string; profile_image_url: string | null; accessToken: string; accessSecret: string },
        tweets: Tweet[],
        existingPoints: number
      ) => {
        let totalPointsDelta = 0;
        const batch = writeBatch(db);

        for (const tweet of tweets) {
          const metrics = {
            likes: tweet.likes || 0,
            replies: tweet.replies || 0,
            reposts: tweet.reposts || 0,
            views: tweet.views || 0,
          };
          const tweetPoints = calculatePoints(metrics);

          const tweetRef = doc(collection(db, "TweetLogs"), tweet.id);
          let tweetDoc;
          try {
            tweetDoc = await getDoc(tweetRef);
          } catch (error) {
            console.error(`Error fetching tweet ${tweet.id} from Firestore:`, error);
            continue;
          }

          if (tweetDoc.exists()) {
            const existingData = tweetDoc.data();
            const existingMetrics = existingData.metrics || { likes: 0, replies: 0, reposts: 0, views: 0 };
            const pointsDelta = calculatePoints({
              likes: metrics.likes - existingMetrics.likes,
              replies: metrics.replies - existingMetrics.replies,
              reposts: metrics.reposts - existingMetrics.reposts,
              views: metrics.views - existingMetrics.views,
            });

            if (pointsDelta > 0) {
              totalPointsDelta += pointsDelta;
              batch.update(tweetRef, {
                metrics,
                pointsAwarded: (existingData.pointsAwarded || 0) + pointsDelta,
                lastUpdated: new Date().toISOString(),
                lastChecked: new Date().toISOString(),
              });
              console.log(`Updated tweet ${tweet.id} for ${userData.username}, points delta: ${pointsDelta}`);
            } else {
              batch.update(tweetRef, {
                lastChecked: new Date().toISOString(),
              });
            }
          } else {
            totalPointsDelta += tweetPoints;
            batch.set(tweetRef, {
              tweetId: tweet.id,
              userId: userData.userId,
              username: userData.username,
              text: tweet.text,
              createdAt: tweet.created_at,
              metrics,
              pointsAwarded: tweetPoints,
              lastUpdated: new Date().toISOString(),
              lastChecked: new Date().toISOString(),
            });
            console.log(`Added new tweet ${tweet.id} for ${userData.username}, points: ${tweetPoints}`);
          }
        }

        const userDocRef = doc(db, "TwitterAccounts", userData.userId);
        let userDoc;
        try {
          userDoc = await getDoc(userDocRef);
        } catch (error) {
          console.error(`Error fetching user ${userData.userId} from Firestore:`, error);
          throw new Error("Failed to access user data in Firestore");
        }

        const now = new Date().toISOString();
        let finalPoints = existingPoints + totalPointsDelta;

        batch.set(
          userDocRef,
          {
            userId: userData.userId,
            username: userData.username,
            accessToken: userData.accessToken,
            accessSecret: userData.accessSecret,
            profile_image_url: userData.profile_image_url,
            points: finalPoints,
            createdAt: userDoc.exists() ? userDoc.data().createdAt : now,
            updatedAt: now,
          },
          { merge: true }
        );

        try {
          await batch.commit();
          console.log(`Saved Twitter account and tweets for userId: ${userData.userId} to Firestore`);
        } catch (error) {
          console.error("Error committing Firestore batch:", error);
          throw new Error("Failed to save data to Firestore");
        }

        return finalPoints;
      };

      const fetchData = async () => {
        let userData = null;
        let tweets: Tweet[] = [];
        let source = "none";
        let points = 1000; // Default

        try {
          const backendUrl = "https://crypto-ufos-backend.vercel.app";
          console.log("Sending callback request to:", `${backendUrl}/auth/twitter/callback`);
          const response = await axios.get(`${backendUrl}/auth/twitter/callback`, {
            params: { oauth_token: oauthToken, oauth_verifier: oauthVerifier },
            timeout: 90000,
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            withCredentials: true,
          });

          // Validate response
          const requiredFields = ["userId", "username", "accessToken", "accessSecret", "tweets"];
          const isValid = requiredFields.every((field) => response.data[field] !== undefined);
          if (!isValid) {
            throw new Error("Incomplete Twitter callback response: missing required fields");
          }

          userData = {
            userId: response.data.userId,
            username: response.data.username,
            profile_image_url: response.data.profile_image_url,
            accessToken: response.data.accessToken,
            accessSecret: response.data.accessSecret,
          };
          tweets = response.data.tweets || [];
          source = response.data.source;
          points = response.data.points || 1000;

          // Fetch existing Firestore data for points baseline
          const { points: existingPoints } = await fetchFirestoreData(userData.userId);
          points = await saveToFirestore(userData, tweets, existingPoints);
        } catch (error: unknown) {
          const axiosError = error as AxiosError<TwitterErrorResponse>;
          console.error("Error in callback:", {
            message: axiosError.message,
            response: axiosError.response?.data,
            status: axiosError.response?.status,
            code: axiosError.code,
            headers: axiosError.response?.headers,
          });

          if (axiosError.response?.status === 429 && axiosError.response?.data?.userId) {
            console.log("Rate limit exceeded. Fetching data from Firestore.");
            const responseData = axiosError.response.data;
            if (
              responseData.userId &&
              responseData.username &&
              responseData.accessToken &&
              responseData.accessSecret
            ) {
              userData = {
                userId: responseData.userId,
                username: responseData.username,
                profile_image_url: responseData.profile_image_url || null,
                accessToken: responseData.accessToken,
                accessSecret: responseData.accessSecret,
              };

              // Fetch Firestore data
              const firestoreData = await fetchFirestoreData(userData.userId);
              if (firestoreData.userData) {
                userData = firestoreData.userData;
                tweets = firestoreData.tweets;
                source = firestoreData.source;
                points = firestoreData.points;
              } else {
                // Save new user data to Firestore
                points = await saveToFirestore(userData, [], 1000);
              }

              localStorage.setItem("twitterWarning", "Rate limit exceeded. Displaying cached data.");
            } else {
              console.error("Incomplete user data in 429 response:", responseData);
              localStorage.setItem("twitterError", "Rate limit exceeded and incomplete user data. Please try again later.");
              localStorage.removeItem("oauthToken");
              router.push("/connectX");
              return;
            }
          } else {
            let errorMessage = axiosError.response?.data?.error || `Failed to process Twitter callback: ${axiosError.message}`;
            if (axiosError.response?.status === 401) {
              errorMessage = "Authentication failed. Please reconnect your X account.";
            }
            localStorage.setItem("twitterError", errorMessage);
            localStorage.removeItem("oauthToken");
            router.push("/connectX");
            return;
          }
        }

        localStorage.setItem(
          "twitterData",
          JSON.stringify({
            username: userData.username,
            userId: userData.userId,
            profile_image_url: userData.profile_image_url,
            points,
          })
        );
        localStorage.removeItem("oauthToken");
        router.push("/connectX");
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