import AfricasTalking from 'africastalking';

const credentials = {
    apiKey: process.env.AFRICASTALKING_API_KEY || 'sandbox_key',
    username: process.env.AFRICASTALKING_USERNAME || 'sandbox'
};

export const africastalking = AfricasTalking(credentials);
