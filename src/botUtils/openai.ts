import axios from "axios";
import { env } from "../environment/environment";

const OPENAI_API_KEY = env.openai.openaiKey;

if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não definida no Environment");
}

export const gerarRespostaChatGPT = async (
    mensagens: { role: string; content: string }[]
  ): Promise<string> => {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4", // ou "gpt-3.5-turbo"
          messages: mensagens,
          temperature: 0.7
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
  
      const resposta = response.data?.choices?.[0]?.message?.content;
  
      console.log("📥 Resposta OpenAI:", resposta);
  
      if (!resposta || resposta.trim().length === 0) {
        throw new Error("A resposta da OpenAI veio vazia ou mal formatada.");
      }
  
      return resposta.trim();
    } catch (error: any) {
      console.error("❌ Erro ao chamar OpenAI:", error?.response?.data || error.message || error);
      throw new Error("Erro ao obter resposta do ChatGPT.");
    }
  };