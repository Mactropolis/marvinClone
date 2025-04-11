import { TurnContext, CardFactory } from "botbuilder";
import { loopTypingWhile } from "../botUtils/utils";
import { gerarRespostaChatGPT } from "../botUtils/openai";

// Estado simples em memória
const userStateMap = new Map<
  string,
  {
    aguardandoComplemento?: boolean;
    perguntaOriginal?: string;
    feedbackRespondido?: boolean;
  }
>();

const feedbackCard = CardFactory.adaptiveCard({
  type: "AdaptiveCard",
  body: [
    {
      type: "TextBlock",
      text: "💬 Essa resposta foi útil para você?",
      wrap: true,
      weight: "Bolder",
      size: "Medium"
    }
  ],
  actions: [
    {
      type: "Action.Submit",
      title: "✅ Sim",
      data: { feedback: "sim" }
    },
    {
      type: "Action.Submit",
      title: "⚠️ Ajudou parcialmente",
      data: { feedback: "parcial" }
    },
    {
      type: "Action.Submit",
      title: "❌ Não",
      data: { feedback: "nao" }
    }
  ],
  $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
  version: "1.3"
});


export const botLogic = async (context: TurnContext): Promise<void> => {
  const { activity } = context;
  const userId = activity.from.id;

  if (activity.value?.feedback) {
    const feedback = activity.value.feedback;
    const previousState = userStateMap.get(userId);
  
    // ✅ Verifica se o feedback já foi enviado
    if (previousState?.feedbackRespondido) {
      await context.sendActivity("Você já respondeu esse feedback. Obrigado novamente! 🙌");
      return;
    }
  
    // ✅ Marca que já respondeu
    userStateMap.set(userId, {
      ...previousState,
      feedbackRespondido: true,
    });
  
    switch (feedback) {
      case "sim":
        await context.sendActivity("Fico feliz em ajudar! 😊");
        break;
      case "parcial":
        userStateMap.set(userId, {
          ...previousState,
          aguardandoComplemento: true,
          feedbackRespondido: true
        });
        await context.sendActivity("Entendi! Me diga o que faltou ou como posso melhorar a resposta. ✍️");
        break;
      case "nao":
        userStateMap.set(userId, {
          ...previousState,
          aguardandoComplemento: true,
          feedbackRespondido: true
        });
        await context.sendActivity("Poxa! O que faltou na resposta para te ajudar melhor? 🧐");
        break;
    }
  
    return;
  }
  
  

  const activityHandlers: Record<string, () => Promise<void>> = {
    message: async () => {
      const userState = userStateMap.get(userId);

      // 2. Se está aguardando complemento do usuário
      if (userState?.aguardandoComplemento) {
        userStateMap.delete(userId); // limpa o estado

        const explicacao = activity.text;
        const perguntaOriginal = userState.perguntaOriginal || "";

        const mensagens = [
          {
            role: "system",
            content: "Você é um assistente útil que responde em português."
          },
          {
            role: "user",
            content: `O usuário não se sentiu ajudado pela resposta original: "${perguntaOriginal}". Ele explicou: "${explicacao}". Gere uma nova resposta mais útil.`
          }
        ];

        try {
          const novaResposta = await loopTypingWhile(
            context,
            gerarRespostaChatGPT(mensagens)
          );

          if (novaResposta && novaResposta.trim().length > 0) {
            await context.sendActivity(novaResposta);
            await context.sendActivity({ attachments: [feedbackCard] });

            // Salva nova pergunta como base para eventual feedback futuro
            userStateMap.set(userId, {
              perguntaOriginal: explicacao
            });
          } else {
            await context.sendActivity("Ainda não consegui te ajudar. Pode tentar reformular a pergunta?");
          }
        } catch (error) {
          console.error("Erro ao tentar nova resposta:", error);
          await context.sendActivity("Ocorreu um erro ao tentar refinar a resposta.");
        }

        return;
      }

      // 3. Fluxo padrão: primeira pergunta do usuário
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
          await context.sendActivity({ attachments: [feedbackCard] });

          userStateMap.set(userId, {
            perguntaOriginal: activity.text
          });
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
