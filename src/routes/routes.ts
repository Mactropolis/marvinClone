import { Router } from "express";
import { CloudAdapter, TurnContext } from "botbuilder";

// Recebe o adapter e a lógica como parâmetros
export function setupRoutes(adapter: CloudAdapter, botLogic: (context: TurnContext) => Promise<void>) {
    const router = Router();

    // Rota de teste
    router.get("/", (_req, res) => {
        res.send("Microsoft Teams App em execução!");
    });

    // Rota do bot
    router.post("/api/messages", async (req, res) => {
        try {
            await adapter.process(req, res, botLogic);
            } 
        catch (error) {
            console.error("Erro no adapter.process:", error);
            res.status(500).send("Erro interno no bot");
        }
    });

    return router;
}
