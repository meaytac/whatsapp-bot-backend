import dotenv from "dotenv";
import connectDB from "./config/database.js";

dotenv.config({
    path: './.env/'
});

const startServer = async () => {
    try {
        await connectDB();

        app.on("error", (error) => {
            console.log("SERVER ERROR", error);
            throw error;
        });

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port: ${process.env.PORT}`);
        });
    } catch (error) {
        console.log("Firebase connection failed.", error);
    }
}

startServer();