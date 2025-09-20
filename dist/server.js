"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const admin = __importStar(require("firebase-admin"));
const twitter_api_v2_1 = require("twitter-api-v2");
require('dotenv').config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: 'http://localhost:3000' }));
app.use(express_1.default.json());
const PORT = process.env.PORT || 5000;
try {
    const serviceAccount = require('./firebase-service-account.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}
catch (error) {
    console.error('Error initializing Firebase Admin:', error.message || error);
    process.exit(1);
}
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
if (!TWITTER_API_KEY || !TWITTER_API_SECRET) {
    console.error('TWITTER_API_KEY or TWITTER_API_SECRET not set in .env');
    process.exit(1);
}
const verifyToken = async (req, res, next) => {
    var _a;
    const idToken = req.query.token || ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split('Bearer ')[1]);
    if (!idToken) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log('Decoded Firebase token:', decodedToken.uid);
        req.user = decodedToken;
        next();
    }
    catch (error) {
        console.error('Error verifying token:', error.message || error);
        res.status(401).json({ error: 'Invalid token', details: error.message || 'Unknown error' });
    }
};
app.get('/user/me', verifyToken, async (req, res) => {
    const accessToken = req.headers['x-twitter-access-token'];
    const accessTokenSecret = req.headers['x-twitter-access-token-secret'];
    if (!accessToken || !accessTokenSecret) {
        return res.status(400).json({ error: 'Missing Twitter access token or secret' });
    }
    try {
        console.log('Fetching Twitter user ID...');
        const client = new twitter_api_v2_1.TwitterApi({
            appKey: TWITTER_API_KEY,
            appSecret: TWITTER_API_SECRET,
            accessToken: accessToken,
            accessSecret: accessTokenSecret,
        });
        const user = await client.v2.me();
        console.log('Twitter user ID response:', user);
        res.json(user);
    }
    catch (error) {
        console.error('Error fetching Twitter user ID:', error.message, error.data);
        res.status(500).json({ error: 'Failed to fetch user ID', details: error.message || 'Unknown error' });
    }
});
app.get('/tweets/:userId', verifyToken, async (req, res) => {
    var _a, e_1, _b, _c;
    const { userId } = req.params;
    const accessToken = req.headers['x-twitter-access-token'];
    const accessTokenSecret = req.headers['x-twitter-access-token-secret'];
    if (!accessToken || !accessTokenSecret) {
        return res.status(400).json({ error: 'Missing Twitter access token or secret' });
    }
    try {
        console.log('Fetching tweets for user ID:', userId);
        const client = new twitter_api_v2_1.TwitterApi({
            appKey: TWITTER_API_KEY,
            appSecret: TWITTER_API_SECRET,
            accessToken: accessToken,
            accessSecret: accessTokenSecret,
        });
        const tweets = await client.v2.userTimeline(userId, { max_results: 10 });
        const tweetData = [];
        try {
            for (var _d = true, tweets_1 = __asyncValues(tweets), tweets_1_1; tweets_1_1 = await tweets_1.next(), _a = tweets_1_1.done, !_a; _d = true) {
                _c = tweets_1_1.value;
                _d = false;
                const tweet = _c;
                tweetData.push(tweet);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = tweets_1.return)) await _b.call(tweets_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        console.log('Tweets response:', tweetData);
        res.json({ data: tweetData });
    }
    catch (error) {
        console.error('Error fetching tweets:', error.message, error.data);
        res.status(500).json({ error: 'Failed to fetch tweets', details: error.message || 'Unknown error' });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
