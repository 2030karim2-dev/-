
import { generateAIContent } from './aiProvider';
import { CartItem } from '../sales/types';

export const aiPosService = {
  /**
   * تقديم توصيات "قطع مكملة" بناءً على محتوى سلة التسوق
   */
  getComplementaryParts: async (cartItems: CartItem[]): Promise<string[]> => {
    if (cartItems.length === 0) return [];

    try {
      const itemNames = cartItems.map(i => i.name).join(", ");

      const systemInstruction = "أنت خبير قطع غيار سيارات محترف. هدفك مساعدة البائع في زيادة المبيعات من خلال اقتراح قطع مكملة ضرورية فنياً للقطع الموجودة في السلة.";

      const prompt = `العميل يشتري الآن: [${itemNames}]. اقترح 3 أسماء قطع غيار أخرى ترتبط ميكانيكياً بهذه القطع وغالباً ما تُباع معها. رد بأسماء القطع فقط مفصولة بفاصلة.`;

      const text = await generateAIContent(prompt, systemInstruction, {
        temperature: 0.3,
      });

      return text.split(',').map(s => s.trim()).filter(s => s.length > 0);
    } catch (error: any) {
      console.error("AI Recommendation Error:", error);
      return [];
    }
  }
};
