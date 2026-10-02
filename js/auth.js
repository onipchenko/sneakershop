import { auth, db, firebaseReady } from "./firebase-config.js";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    updateEmail,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export function watchAuth(callback) {
    if (!firebaseReady) return callback(null);
    return onAuthStateChanged(auth, callback);
}

export async function register(email, password, displayName) {
    if (!firebaseReady) throw new Error("Firebase config is not set");
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email,
        displayName,
        role: "user",
        preferredCity: "almaty",
        createdAt: serverTimestamp(),
    });
    return result.user;
}

export async function login(email, password) {
    if (!firebaseReady) throw new Error("Firebase config is not set");
    return (await signInWithEmailAndPassword(auth, email, password)).user;
}

export function logout() {
    return firebaseReady ? signOut(auth) : Promise.resolve();
}

export async function resetPassword(email) {
    if (!firebaseReady) throw new Error("Firebase config is not set");
    await sendPasswordResetEmail(auth, email);
}

export async function getCurrentUserProfile(user) {
    if (!user || !firebaseReady) return null;
    const snapshot = await getDoc(doc(db, "users", user.uid));
    return snapshot.exists()
        ? snapshot.data()
        : { uid: user.uid, email: user.email, displayName: user.displayName, role: "user" };
}

export async function updateUserProfile(user, data) {
    if (!user || !firebaseReady) return;
    if (data.displayName) await updateProfile(user, { displayName: data.displayName });
    await updateDoc(doc(db, "users", user.uid), {
        displayName: data.displayName || user.displayName,
        preferredCity: data.preferredCity || "almaty",
        updatedAt: serverTimestamp(),
    });
}

export async function requireAdmin(onAllowed) {
    watchAuth(async (user) => {
        if (!user) {
            document.body.innerHTML = `<main class="access-denied"><p class="eyebrow">403 / PRIVATE AREA</p><h1>Admin access<br><em>required.</em></h1><a class="button button-dark" href="../index.html">Back to shop</a></main>`;
            return;
        }
        const profile = await getCurrentUserProfile(user);
        if (profile?.role === "admin") {
            onAllowed(user, profile);
        } else {
            document.body.innerHTML = `<main class="access-denied"><p class="eyebrow">403 / PRIVATE AREA</p><h1>Admin access<br><em>required.</em></h1><a class="button button-dark" href="../index.html">Back to shop</a></main>`;
        }
    });
}