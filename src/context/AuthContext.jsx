import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    signInWithPhoneNumber
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRoles, setUserRoles] = useState([]); // Array of roles
    const [metroMiles, setMetroMiles] = useState(0);
    const [loading, setLoading] = useState(true);

    async function loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            await checkCreateUser(result.user);
        } catch (error) {
            console.error("Google Sign-in Error:", error);
            throw error;
        }
    }

    async function loginWithEmail(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    async function signupWithEmail(email, password) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await checkCreateUser(result.user);
        return result;
    }

    function logout() {
        return signOut(auth);
    }

    async function loginWithPhone(phoneNumber, appVerifier) {
        try {
            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            return confirmationResult;
        } catch (error) {
            console.error("Phone Auth Error:", error);
            throw error;
        }
    }

    async function checkCreateUser(user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const newUser = {
                uid: user.uid,
                name: user.displayName || user.phoneNumber || 'User',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                isVerified: false,
                aadhaarNumber: '',
                profilePhotoUrl: user.photoURL || '',
                roles: ['rider', 'driver'], // Unified roles
                metroMiles: 0, // Signup bonus could be added here
                createdAt: new Date()
            };
            await setDoc(userRef, newUser);
            setUserRoles(newUser.roles);
            setMetroMiles(newUser.metroMiles);
        } else {
            const data = userSnap.data();
            setUserRoles(data.roles || ['rider']); // Fallback
            setMetroMiles(data.metroMiles || 0);
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Ensure user document exists and fetch data
                await checkCreateUser(user);
            } else {
                setUserRoles([]);
                setMetroMiles(0);
            }
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRoles,
        metroMiles,
        loginWithGoogle,
        loginWithEmail,
        loginWithPhone,
        signupWithEmail,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
