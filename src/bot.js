import pkg from "whatsapp-web.js";
const {
    Client,
    LocalAuth
    } = pkg;
import qrcode from "qrcode-terminal";
import { getMemberByPhoneNumber } from "./models/memberModel.js";

const MENU_MESSAGE = [
    "👋 Merhaba! Spor Salonu Otomasyon Botuna hoş geldiniz. Size nasıl yardımcı olabilirim?",
    "",
    "1 - Üyelik Durumum",
    "2 - Üyelik Bitiş Tarihim",
    "3 - Salon İletişim Bilgileri",
    "0 - Menü"
].join("\n");

const normalizeWhatsappPhoneNumber = (whatsAppId = "") => {
    const rawNumber = whatsAppId.split("@")[0];
    const digits = rawNumber.replace(/\D/g, "");

    if (!digits) {
        return "";
    }

    return digits.startsWith("90") ? `+${digits}` : `+90${digits}`;
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

const getMembershipStatusMessage = async (phoneNumber) => {
    const member = await getMemberByPhoneNumber(phoneNumber);

    if (!member) {
        return [
            "Bu Whatsapp numarasıyla kayıtlı bir üyelik bulamadım.",
            "Lütfen salon personeliyle iletişime geçin."
        ].join("\n");
    }

    const membershipStatus = member.isActive ? "Aktif" : "Pasif";
    const subscriptionStatus = formatSubscriptionStatus(member.subscriptionStatus);

    return [
        `Merhaba ${member.fullName || "değerli üyemiz "}.`,
        "",
        `Üyelik durumunuz: ${membershipStatus}`,
        `Abonelik durumunuz: ${subscriptionStatus}`,
        `Toplam giriş sayınız: ${member.totalCheckIns}`,
        "",
        "Detaylı işlem için salon personeliyle iletişime geçebilirsiniz."
    ].join("\n");
};


const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "gym-bot"
    })
});

client.on("qr", (qr) => {
    console.log("\n📱 Please scan the QR code below using your WhatsApp mobile app:\n");
    qrcode.generate(qr, { small: true })
});

client.on("ready", () => {
    console.log("\n🚀 WhatsApp bot is connected and ready!\n");
});

client.on("message", async (msg) => {
    const messageText = msg.body.toLowerCase().trim();
    const formattedPhone = normalizeWhatsappPhoneNumber(msg.from);

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
            await msg.reply("Üyelik bitiş tarihi sorgusu bir sonraki adımda abonelik kaydı ile bağlanacak.");
            return;
        }

        if (messageText === "3") {
            await msg.reply([
                "Salon iletişim bilgileri:",
                "Telefon: +90 555 000 00 00",
                "Adres: Spor Salonu adresi",
                "Çalışma Saatleri: 08:00 - 22:00"
            ].join("\n"));
            return;
        }

        await msg.reply(`Mesajınızı anlayamadım.\n\n${MENU_MESSAGE}`);
    } catch (error) {
        console.error("Bot message handling failed: ", error);
        await msg.reply("Şuan işleminizi gerçekleştiremiyorum. Lütfen daha sonra tekrar deneyiniz.")
    }
});

client.initialize();
