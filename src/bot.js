import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";

const client = new Client({
    authStrategy: new LocalAuth()
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

    const rawNumber = msg.from.split("@")[0];
    const formattedPhone = `+${rawNumber}`;

    console.log(`📩 New message: "${msg.body}" | From: ${formattedPhone}`);

    if (["merhaba", "selam", "ping"].includes(messageText)) {
        await msg.reply("👋 Merhaba! Spor Salonu Otomasyon Botuna hoş geldiniz. Size nasıl yardımcı olabilirim?");
    }
});

client.initialize();
