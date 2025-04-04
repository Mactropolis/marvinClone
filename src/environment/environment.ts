import dotenv from "dotenv";
import { EnvironmentVariables } from "../interfaces/environment";

dotenv.config();

function getEnvVar(name: string, required = true): string {
  const value = process.env[name];
  if (!value && required) {
    throw new Error(`Environment variable ${name} is required but not set.`);
  }
  return value || "";
}

export const env: EnvironmentVariables = {
  teams: {
    MicrosoftAppId: getEnvVar("MicrosoftAppId"),
    MicrosoftAppPassword: getEnvVar("MicrosoftAppPassword"),
    MicrosoftAppType: getEnvVar("MicrosoftAppType"),
    MicrosoftAppTenantId: process.env.MicrosoftAppTenantId
  },
  openai: {
    openaiKey: getEnvVar("OPEN_API_KEY")
  }
};
