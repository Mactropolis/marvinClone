import express from "express";
import dotenv from "dotenv";
import {
    ConfigurationBotFrameworkAuthentication,
    CloudAdapter,
    ConfigurationServiceClientCredentialFactory,
} from "botbuilder";
import { env } from "./environment/environment";
import { setupRoutes } from "./routes/routes";
import { botLogic } from "./bot/botLogic"; // <--- importação aqui

dotenv.config();

const { teams } = env;
const app = express();
const PORT = process.env.PORT || 3978;

// Autenticação
const credentialsFactory = new ConfigurationServiceClientCredentialFactory(teams);
const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication({}, credentialsFactory);
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Usa as rotas externas com a lógica do bot
app.use(express.json());
app.use(setupRoutes(adapter, botLogic));

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
