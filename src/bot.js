import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";
import { getMemberByPhoneNumber } from "./models/memberModel.js";
import { getActiveSubscriptionForMember } from "./models/subscriptionModel.js";

const MENU_MESSAGE = [
    "👋 Merhaba! Spor Salonu Otomasyon Botuna hoş geldiniz.",
    "Size nasıl yardımcı olabilirim?",
    "",
    "🏋️ 1 - Üyelik Durumum",
    "📅 2 - Üyelik Bitiş Tarihim",
    "📍 3 - Salon İletişim Bilgileri",
    "🔄 0 - Menü"
].join("\n");

const normalizeWhatsappPhoneNumber = (rawNumber = "") => {
    const digits = rawNumber.replace(/\D/g, "");

    if (!digits) {
        return "";
    }

    if (digits.startsWith("90")) {
        return `+${digits}`;
    }

    if (digits.startsWith("05")) {
        return `+90${digits.substring(1)}`;
    }

    if (digits.startsWith("5")) {
        return `+90${digits}`;
    }

    return `+${digits}`;
};

const formatSubscriptionStatus = (status = "UNKNOWN") => {
    const statuses = {
        ACTIVE: "Aktif",
        EXPIRED: "Süresi Dolmuş",
        CANCELLED: "İptal Edilmiş",
        UNKNOWN: "Bilinmiyor"
    };

    return statuses[status] || status;
};

const toDate = (dateValue) => {
    if (!dateValue) {
        return null;
    }

    if (typeof dateValue.toDate === "function") {
        return dateValue.toDate();
    }

    const date = new Date(dateValue);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (dateValue) => {
    const date = toDate(dateValue);

    if (!date) {
        return null;
    }

    return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(date);
};

const getRemainingDays = (dateValue) => {
    const endDate = toDate(dateValue);

    if (!endDate) {
        return null;
    }

    const today = new Date();
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffMs = endDate.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const getSubscriptionEndDate = (subscription, member) => (
    subscription?.endDate ||
    subscription?.subscriptionEndDate ||
    subscription?.membershipEndDate ||
    subscription?.expiryDate ||
    subscription?.endAt ||
    member?.endDate ||
    null
);

const getMemberNotFoundMessage = () => [
    "⚠️ Bu WhatsApp numarasıyla kayıtlı bir üyelik bulamadım.",
    "📞 Lütfen salon personeliyle iletişime geçin."
].join("\n");

const getMembershipStatusMessage = async (phoneNumber) => {
    const member = await getMemberByPhoneNumber(phoneNumber);

    if (!member) {
        return getMemberNotFoundMessage();
    }

    const membershipStatus = member.isActive ? "Aktif" : "Pasif";
    const subscriptionStatus = formatSubscriptionStatus(member.subscriptionStatus);

    return [
        `👋 Merhaba ${member.fullName || "değerli üyemiz"}.`,
        "",
        `🏋️ Üyelik durumunuz: ${membershipStatus}`,
        `✅ Abonelik durumunuz: ${subscriptionStatus}`,
        `🚪 Toplam giriş sayınız: ${member.totalCheckIns}`,
        "",
        "📞 Detaylı işlem için salon personeliyle iletişime geçebilirsiniz."
    ].join("\n");
};

const getSubscriptionEndDateMessage = async (phoneNumber) => {
    const member = await getMemberByPhoneNumber(phoneNumber);

    if (!member) {
        return getMemberNotFoundMessage();
    }

    const subscription = await getActiveSubscriptionForMember(member);
    const endDate = getSubscriptionEndDate(subscription, member);

    if (!subscription && !endDate) {
        return [
            `👋 Merhaba ${member.fullName || "değerli üyemiz"}.`,
            "",
            "⚠️ Aktif bir üyelik kaydı bulamadım.",
            "📞 Lütfen salon personeliyle iletişime geçin."
        ].join("\n");
    }

    const formattedEndDate = formatDate(endDate);
    const remainingDays = getRemainingDays(endDate);

    if (!formattedEndDate) {
        return [
            `👋 Merhaba ${member.fullName || "değerli üyemiz"}.`,
            "",
            "⚠️ Üyelik bitiş tarihiniz sistemde eksik görünüyor.",
            "📞 Lütfen salon personeliyle iletişime geçin."
        ].join("\n");
    }

    if (remainingDays < 0) {
        return [
            `👋 Merhaba ${member.fullName || "değerli üyemiz"}.`,
            "",
            `📅 Üyelik bitiş tarihiniz: ${formattedEndDate}`,
            "⏰ Üyeliğinizin süresi dolmuş görünüyor.",
            "",
            "📞 Yenileme için salon personeliyle iletişime geçebilirsiniz."
        ].join("\n");
    }

    if (remainingDays === 0) {
        return [
            `👋 Merhaba ${member.fullName || "değerli üyemiz"}.`,
            "",
            `📅 Üyelik bitiş tarihiniz: ${formattedEndDate}`,
            "⏰ Üyeliğiniz bugün sona eriyor.",
            "",
            "📞 Yenileme için salon personeliyle iletişime geçebilirsiniz."
        ].join("\n");
    }

    return [
        `👋 Merhaba ${member.fullName || "değerli üyemiz"}.`,
        "",
        `📅 Üyelik bitiş tarihiniz: ${formattedEndDate}`,
        `⏳ Kalan gün: ${remainingDays}`,
        "",
        "💪 Sağlıklı antrenmanlar dileriz."
    ].join("\n");
};

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "gym-bot"
    })
});

client.on("qr", (qr) => {
    console.log("\n📱 Please scan the QR code below using your WhatsApp mobile app:\n");
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    console.log("\n🚀 WhatsApp bot is connected and ready!\n");
});

client.on("message", async (msg) => {
    const messageText = msg.body.toLowerCase().trim();

    const contact = await msg.getContact();
    const rawPhoneNumber = contact.number || msg.from.split("@")[0];
    const formattedPhone = normalizeWhatsappPhoneNumber(rawPhoneNumber);

    console.log(`📩 New message: "${msg.body}" | From: ${formattedPhone}`);

    try {
        if (["merhaba", "selam", "menu", "menü", "ping", "0"].includes(messageText)) {
            await msg.reply(MENU_MESSAGE);
            return;
        }

        if (messageText === "1") {
            const reply = await getMembershipStatusMessage(formattedPhone);
            await msg.reply(reply);
            return;
        }

        if (messageText === "2") {
            const reply = await getSubscriptionEndDateMessage(formattedPhone);
            await msg.reply(reply);
            return;
        }

        if (messageText === "3") {
            await msg.reply([
                "📍 Salon iletişim bilgileri:",
                "",
                "📞 Telefon: +90 555 000 00 00",
                "🏢 Adres: Spor Salonu adresi",
                "🕘 Çalışma Saatleri: 08:00 - 22:00"
            ].join("\n"));
            return;
        }

        await msg.reply(`🤔 Mesajınızı anlayamadım.\n\n${MENU_MESSAGE}`);
    } catch (error) {
        console.error("Bot message handling failed: ", error);
        await msg.reply("⚠️ Şu an işleminizi gerçekleştiremiyorum. Lütfen daha sonra tekrar deneyiniz.");
    }
});

client.initialize();
