export interface EnvironmentVariables {
    teams: {
        MicrosoftAppId: string;
        MicrosoftAppPassword: string;
        MicrosoftAppType: string;
        MicrosoftAppTenantId?: string;
    },
    openai: {
        openaiKey: string;
    }
}