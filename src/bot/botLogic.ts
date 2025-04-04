import { TurnContext } from "botbuilder";
import { loopTypingWhile } from "../botUtils/utils";
import { gerarRespostaChatGPT } from "../botUtils/openai";

export const botLogic = async (context: TurnContext): Promise<void> => {
    const { activity } = context;
    await context.sendActivity(`Recebi uma atividade do tipo: ${context.activity.type}`);

    const activityHandlers: Record<string, () => Promise<void>> = {
        message: async () => {
            const mensagens = [
              {
                role: "system",
                content: "Você é um assistente útil que responde em português."
              },
              {
                role: "user",
                content: activity.text
              }
            ];
      
            try {
                const resposta = await loopTypingWhile(
                    context,
                    gerarRespostaChatGPT(mensagens)
                  );
      
                  if (resposta && resposta.trim().length > 0) {
                    await context.sendActivity(resposta);
                  } else {
                    await context.sendActivity("Não consegui entender sua pergunta. Tente novamente?");
                  }
            } catch (error) {
              console.error("Erro ao chamar ChatGPT:", error);
              await context.sendActivity("Houve um erro ao buscar a resposta.");
            }
          },

        messageReaction: async () => {
            if (activity.reactionsAdded?.length) {
                for (const reaction of activity.reactionsAdded) {
                    await context.sendActivity(`Você enviou um "${reaction.type}"`);
                }
            }

            if (activity.reactionsRemoved?.length) {
                for (const reaction of activity.reactionsRemoved) {
                    await context.sendActivity(`Você removeu um "${reaction.type}"`);
                }
            }
        },

        conversationUpdate: async () => {
            await context.sendActivity("Alguém entrou ou saiu da conversa.");
        }
    };

    const handler = activityHandlers[activity.type];

    if (handler) {
        await handler();
    } else {
        await context.sendActivity(`Recebi uma atividade do tipo: ${activity.type}`);
    }
};
