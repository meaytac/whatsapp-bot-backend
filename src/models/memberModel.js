import {
    addDoc,
    collection,
    getDocs,
    query,
    where,
    limit,
    serverTimestamp
} from "firebase/firestore";

import { db } from "../config/database.js";

const MEMBER_COLLECTION = "members";

const normalizePhoneNumber = (phoneNumber = "") => {
    const digits = phoneNumber.replace(/\D/g, "");

    if (!digits) {
        return "";
    }

    if (digits.startsWith("90")) {
        return `+${digits}`;
    }

    if (digits.startsWith("0")) {
        return `+9${digits}`;
    }

    return `+90${digits}`;
};

const mapMemberForBot = (docSnapshot) => {
    const data = docSnapshot.data();

    return {
        id: docSnapshot.id,
        uid: data.uid || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        fullName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
        phoneNumber: data.phoneNumber || "",
        role: data.role || "MEMBER",
        isActive: data.isActive ?? false,
        subscriptionStatus: data.subscriptionStatus || "UNKNOWN",
        totalCheckIns: data.totalCheckIns || 0,
        endDate: data.endDate || data.subscriptionEndDate || data.membershipEndDate || null,
        packageName: data.packageName || ""
    };
};


export const createMember = async (memberData) => {
    const memberRef = collection(db, MEMBER_COLLECTION);
    const formattedPhone = normalizePhoneNumber(memberData.phoneNumber);

    const newMember = {
        uid: memberData.uid || "",
        email: memberData.email || "",
        role: "MEMBER",
        firstName: memberData.firstName || "",
        lastName: memberData.lastName || "",
        phoneNumber: formattedPhone,
        isActive: memberData.isActive ?? true,
        subscriptionStatus: memberData.subscriptionStatus || "ACTIVE",
        totalCheckIns: memberData.totalCheckIns || 0,
        endDate: memberData.endDate || memberData.subscriptionEndDate || null,
        packageName: memberData.packageName || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: memberData.createdBy || "SYSTEM"
    };

    const docRef = await addDoc(memberRef, newMember);

    return {
        id: docRef.id,
        ...newMember
    };
};

export const getMemberByPhoneNumber = async (phoneNumber) => {
    const formattedPhone = normalizePhoneNumber(phoneNumber);
    const memberRef = collection(db, MEMBER_COLLECTION);

    const memberQuery = query(
        memberRef,
        where("phoneNumber", "==", formattedPhone),
        limit(1)
    );

    const snapshot = await getDocs(memberQuery);

    if (snapshot.empty) {
        return null;
    }

    return mapMemberForBot(snapshot.docs[0]);
};


export const getAllMembers = async () => {
    const memberRef = collection(db, MEMBER_COLLECTION);
    const snapshot = await getDocs(memberRef);

    return snapshot.docs.map(mapMemberForBot);
};
