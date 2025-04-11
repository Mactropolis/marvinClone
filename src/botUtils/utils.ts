import { TurnContext } from "botbuilder";

/**
 * Mantém enviando "digitando..." até que a promessa termine, e retorna o resultado dessa promessa.
 * @param context Contexto do bot
 * @param promise Uma promessa que será aguardada
 * @param intervalo Intervalo entre os sinais de typing (default: 4000ms)
 * @returns Resultado da promessa resolvida
 */
export const loopTypingWhile = async <T>(
  context: TurnContext,
  promise: Promise<T>,
  intervalo = 4000
): Promise<T> => {
  let ativo = true;

  const typingLoop = async () => {
    while (ativo) {
      await context.sendActivity({ type: 'typing' });
      await new Promise(resolve => setTimeout(resolve, intervalo));
    }
  };

  const loop = typingLoop(); 

  try {
    const resultado = await promise;
    ativo = false;
    return resultado; 
  } catch (err) {
    ativo = false;
    throw err;
  }
};
