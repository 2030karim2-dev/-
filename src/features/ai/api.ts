
import { generateAIContent } from './aiProvider';

export const aiApi = {
  analyzeFinancials: async (prompt: string) => {
    try {
      const systemInstruction = `أنت "المدقق المالي الذكي" لنظام الزهراء ERP. 
      مهمتك: اكتشاف الأخطاء المحاسبية، تحليل هوامش الربح، وتقديم نصائح لزيادة التدفق النقدي.
      رد دائماً بتنسيق JSON حصراً. لا تستخدم markdown أو code blocks.`;

      const result = await generateAIContent(prompt, systemInstruction, {
        jsonMode: true,
        temperature: 0.1,
      });

      return result;
    } catch (error: any) {
      console.error("AI API Error:", error);
      throw error;
    }
  }
};
