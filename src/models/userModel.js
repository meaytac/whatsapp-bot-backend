import { addDoc, collection, doc, getDocs } from "firebase/firestore";
import { db } from "../config/database.js";

const USERS_COLLECTION = "users";

export const createUser = async (userData) => {
    const userRef = collection(db, USERS_COLLECTION);
    const newUser = {
        ...userData,
        createdAt: new Date().toISOString() 
    };
    const docRef = await addDoc(userRef, newUser);
    return { id: docRef.id, ...newUser };
};

export const getAllUsers = async () => {
    const userRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(userRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
};