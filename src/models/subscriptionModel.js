import {
    collection,
    getDocs,
    limit,
    query,
    where
} from "firebase/firestore";

import { db } from "../config/database.js";

const SUBSCRIPTION_COLLECTION = "subscriptions";

const mapSubscription = (docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data()
});

const pickActiveSubscription = (subscriptions) => {
    const activeSubscription = subscriptions.find((subscription) => (
        subscription.status === "ACTIVE" || subscription.subscriptionStatus === "ACTIVE"
    ));

    return activeSubscription || subscriptions[0] || null;
};

const getSubscriptionsByField = async (fieldName, value) => {
    if (!value) {
        return [];
    }

    const subscriptionRef = collection(db, SUBSCRIPTION_COLLECTION);

    const subscriptionQuery = query(
        subscriptionRef,
        where(fieldName, "==", value),
        limit(10)
    );

    const snapshot = await getDocs(subscriptionQuery);

    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(mapSubscription);
};

export const getActiveSubscriptionForMember = async (member) => {
    const lookupFields = [
        ["memberId", member.id],
        ["memberId", member.uid],
        ["uid", member.uid],
        ["userId", member.uid],
        ["userId", member.id],
        ["memberUid", member.uid],
        ["phoneNumber", member.phoneNumber]
    ];

    for (const [fieldName, value] of lookupFields) {
        const subscriptions = await getSubscriptionsByField(fieldName, value);
        const subscription = pickActiveSubscription(subscriptions);

        if (subscription) {
            return subscription;
        }
    }

    return null;
};

export const getActiveSubscriptionByMemberId = async (memberId) => {
    const subscriptions = await getSubscriptionsByField("memberId", memberId);
    return pickActiveSubscription(subscriptions);
};
