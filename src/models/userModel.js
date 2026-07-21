import { addDoc, collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../config/database.js";

const USERS_COLLECTION = "users";

export const createUser = async (userData) => {
    const userRef = collection(db, USERS_COLLECTION);

    const newUser = {
        uid: userData.uid || "",
        email: userData.email,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        role: userData.role || "STAFF",
        isActive: userData.isActive ?? true,
        createdAt: new Date().toISOString(),
        lastLoginAt: null 
    };

    const docRef = await addDoc(userRef, newUser);
    return { id: docRef.id, ...newUser };
};

export const getAllUsers = async () => {
    const userRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(userRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
};

export const getUserById = async (id) => {
    const userDocRef = doc(db, USERS_COLLECTION, id);
    const snapshot = await getDoc(userDocRef);

    if (!snapshot.exists()) {
        return null;
    }

    return { id: snapshot.id, ...snapshot.data() };
};