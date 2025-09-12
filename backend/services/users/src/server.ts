import app from "./app"
import {PrismaClient} from "@prisma/client"
import {logger} from "./utils/logger"
import dotenv from "dotenv"

dotenv.config()


const prisma = new PrismaClient()
const PORT = process.env.PORT;

const server = app.listen(PORT, ()=>{console.log("Auth-server started at ",PORT)});

const shutdown = async () =>{
    logger.info("Shutting down ther user service...");
    await prisma.$disconnect()
    server.close(()=>{
        process.exit(0);
    })
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
