// C:\Users\Admin\Desktop\Solana\CryptoUFOS dApp\(public)\new-crypto-ufos-game\lib\firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);


export { app, auth, provider, db };
