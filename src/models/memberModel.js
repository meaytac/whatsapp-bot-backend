import { addDoc, collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../config/database";

const MEMBER_COLLECTION = "members";

export const createMember = async (memberData) => {
    const memberRef = collection(db, MEMBER_COLLECTION);

    const newMember = {
        uid: memberData.uid || "",
        email: memberData.email || "",
        role: "MEMBER",
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        phoneNumber: memberData.phoneNumber,
        address: memberData.address || "",
        totalCheckIns: memberData.totalCheckIns || 0,
        gender: memberData.gender || "UNSPECIFIED",
        birthDate: memberData.birthDate || null,
        bloodType: memberData.bloodType || "",
        weight: memberData.weight || null,
        height: memberData.height || null,
        emergencyContact: memberData.emergencyContact || { name: "", phone: "" },
        isActive: memberData.isActive || true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: memberData.createdBy || "SYSTEM"
    };

    const docRef = await addDoc(memberRef, newMember);
    return { id: docRef.id, ...newMember };
};

export const getMemberByPhoneNumber = async (phoneNumber) => {
    const memberRef = collection(db, MEMBER_COLLECTION);

    const q = query(memberRef, where("phoneNumber", "==", phoneNumber));
    const snapshot = await getDocs(q);

    if (snapshot.empty()) {
        return null;
    }

    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() };
};

export const getAllMembers = async () => {
    const memberRef = collection(db, MEMBER_COLLECTION);
    const snapshot = await getDocs(memberRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};


