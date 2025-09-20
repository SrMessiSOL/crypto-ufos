import express from "express";
import { TwitterApi } from "twitter-api-v2";
import cors from "cors";
import { config as dotenvConfig } from "dotenv";

// Load environment variables
dotenvConfig();

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://www.cryptoufos.com",
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://cryptoufos.vercel.app",
    ],
    credentials: true, // Optional, if needed for cookies or auth
  })
);
app.use(express.json());

const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;

if (!TWITTER_API_KEY || !TWITTER_API_SECRET) {
  console.error("TWITTER_API_KEY or TWITTER_API_SECRET not set in .env");
  process.exit(1);
}

// In-memory store for OAuth token secrets (use a database in production)
const oauthTokenSecrets = new Map();

app.get("/auth/twitter", async (req, res) => {
  try {
    console.log("Attempting to generate OAuth link with keys:", {
      apiKey: TWITTER_API_KEY.substring(0, 5) + "...",
      apiSecret: TWITTER_API_SECRET.substring(0, 5) + "...",
    });
    const client = new TwitterApi({
      appKey: TWITTER_API_KEY,
      appSecret: TWITTER_API_SECRET,
    });
    const authLink = await client.generateAuthLink(
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/auth/twitter/callback`
        : "http://localhost:3000/auth/twitter/callback"
    );
    console.log("OAuth auth link generated:", {
      url: authLink.url,
      oauth_token: authLink.oauth_token,
      oauth_token_secret: authLink.oauth_token_secret.substring(0, 20) + "...",
    });
    oauthTokenSecrets.set(authLink.oauth_token, {
      secret: authLink.oauth_token_secret,
      timestamp: Date.now(),
    });
    // Clean up old tokens (older than 10 minutes)
    for (const [token, data] of oauthTokenSecrets.entries()) {
      if (Date.now() - data.timestamp > 10 * 60 * 1000) {
        oauthTokenSecrets.delete(token);
      }
    }
    return res.json({ authUrl: authLink.url, oauthToken: authLink.oauth_token });
  } catch (error) {
    console.error("Error generating OAuth link:", {
      message: error.message,
      code: error.code,
      details: error,
      twitterApiErrors: error.errors || null,
    });
    const statusCode = error.code === 401 || error.code === 403 ? error.code : 500;
    const errorMessage =
      error.code === 401
        ? "Invalid Twitter API credentials. Please check TWITTER_API_KEY and TWITTER_API_SECRET."
        : error.code === 403
        ? "Twitter API access forbidden. Please check app permissions or restrictions."
        : "Failed to start OAuth";
    return res.status(statusCode).json({
      error: errorMessage,
      details: error.message,
      twitterApiErrors: error.errors || null,
    });
  }
});

app.get("/auth/twitter/callback", async (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;
  console.log("OAuth callback received:", {
    oauth_token: oauth_token || "null",
    oauth_verifier: oauth_verifier || "null",
  });

  if (!oauth_token || !oauth_verifier) {
    console.error("Missing OAuth token or verifier");
    return res.status(400).json({ error: "Missing OAuth token or verifier" });
  }

  const tokenData = oauthTokenSecrets.get(oauth_token);
  if (!tokenData) {
    console.error("Invalid or expired OAuth token:", oauth_token);
    return res.status(400).json({ error: "Invalid or expired OAuth token" });
  }

  try {
    const client = new TwitterApi({
      appKey: TWITTER_API_KEY,
      appSecret: TWITTER_API_SECRET,
      accessToken: oauth_token,
      accessSecret: tokenData.secret,
    });
    const { accessToken, accessSecret, userId, screenName } = await client.login(oauth_verifier);
    console.log("OAuth login successful:", {
      userId,
      screenName,
      accessToken: accessToken.substring(0, 20) + "...",
      accessSecret: accessSecret.substring(0, 20) + "...",
    });

    const tweetsClient = new TwitterApi({
      appKey: TWITTER_API_KEY,
      appSecret: TWITTER_API_SECRET,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });
    let searchQuery = `"@0xCryptoUFOs" from:${screenName}`;
    let tweets = await tweetsClient.v2.search(searchQuery, {
      "tweet.fields": ["created_at", "text", "public_metrics"],
      max_results: 10,
    });
    let tweetData = [];
    for await (const tweet of tweets) {
      tweetData.push({
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        replies: tweet.public_metrics.reply_count || 0,
        reposts: tweet.public_metrics.retweet_count || 0,
        likes: tweet.public_metrics.like_count || 0,
        views: tweet.public_metrics.impression_count || 0,
      });
    }

    console.log("Search tweets response:", {
      tweetCount: tweetData.length,
      searchQuery,
      tweets: tweetData.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        replies: tweet.replies,
        reposts: tweet.reposts,
        likes: tweet.likes,
        views: tweet.views,
      })),
    });

    oauthTokenSecrets.delete(oauth_token);

    return res.json({
      username: screenName,
      userId,
      tweets: tweetData,
    });
  } catch (error) {
    console.error("Error in OAuth callback:", {
      message: error.message,
      code: error.code,
      details: error,
      twitterApiErrors: error.errors || null,
    });
    const statusCode = error.code === 400 || error.code === 401 || error.code === 403 ? error.code : 500;
    const errorMessage =
      error.code === 400
        ? "Invalid search query or parameters. Please check the query format."
        : error.code === 401
        ? "Authentication failed. Please check API credentials or tokens."
        : error.code === 403
        ? "Twitter API access forbidden. Please check app permissions or restrictions."
        : "Failed to process callback";
    return res.status(statusCode).json({
      error: errorMessage,
      details: error.message,
      twitterApiErrors: error.errors || null,
    });
  }
});

app.get("/test-api", async (req, res) => {
  try {
    console.log("Testing Twitter API with keys:", {
      apiKey: TWITTER_API_KEY.substring(0, 5) + "...",
      apiSecret: TWITTER_API_SECRET.substring(0, 5) + "...",
    });
    const client = new TwitterApi({
      appKey: TWITTER_API_KEY,
      appSecret: TWITTER_API_SECRET,
    });
    const trends = await client.v2.trendsByPlace("1");
    console.log("Trends response:", trends);
    return res.json(trends);
  } catch (error) {
    console.error("Error testing Twitter API:", {
      message: error.message,
      code: error.code,
      details: error,
      twitterApiErrors: error.errors || null,
    });
    const statusCode = error.code === 401 || error.code === 403 ? error.code : 500;
    return res.status(statusCode).json({
      error: "Test failed",
      details: error.message,
      twitterApiErrors: error.errors || null,
    });
  }
});

module.exports = app;