import express from "express";
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import {logger} from "./utils/logger"
import {errorHandler} from "./middlewares/errorHandler"
import {authRoutes} from "./routes/auth"
import {userRoutes} from "./routes/user"
import {teamRoutes} from "./routes/teams"
import {serverRoutes} from "./routes/server"

const app = express();

// middlerware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(
    morgan("combined", {
        stream: { write: (message)=> logger.info(message.trim())},
    })
)

app.get("/health", (req,res)=>{
    res.json({
        status: "Ok",
        service: "user-service",
        timestamp: new Date().toISOString(),
    })
})
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/teams", teamRoutes);
app.use("/servers", serverRoutes);

// for error handling
app.use(errorHandler);

export default app;