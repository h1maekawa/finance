/**
 * AI/Regex based Email Extraction Service
 * Supports Mitsui Sumitomo (Vpass), Rakuten Card, and SMBC Direct notifications.
 */

export interface ExtractedTransaction {
  transaction_type: 'expense' | 'income';
  date: string; // YYYY-MM-DD HH:mm or YYYY-MM-DD
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  raw_description: string;
  confidence: number;
}

export class AIExtractionService {
  /**
   * Parses the email text and extracts transaction data.
   * In a real production app, this might send the text to an LLM API.
   * Here we use a high-precision regex approach based on known patterns.
   */
  static extract(text: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];

    // 1. Mitsui Sumitomo (Vpass) Pattern
    const vpassMatch = text.match(/利用日：(\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2})[\s\S]*?利用先：(.+?)[\r\n]+[\s\S]*?利用金額：([\d,]+)円/);
    if (vpassMatch) {
      const dateStr = vpassMatch[1].replace(/\//g, '-');
      const merchant = vpassMatch[2].trim();
      const amount = parseInt(vpassMatch[3].replace(/,/g, ''));
      transactions.push({
        transaction_type: 'expense',
        date: dateStr,
        amount,
        currency: 'JPY',
        merchant,
        category: this.predictCategory(merchant),
        raw_description: merchant,
        confidence: 0.95,
      });
    }

    // 2. Rakuten Card Pattern
    const rakutenMatch = text.match(/利用日: (\d{4}\/\d{2}\/\d{2})[\s\S]*?利用先: (.*?)[\r\n]+[\s\S]*?利用金額: ([\d,]+) 円/);
    if (rakutenMatch) {
      const dateStr = rakutenMatch[1].replace(/\//g, '-');
      const merchant = rakutenMatch[2].trim();
      const amount = parseInt(rakutenMatch[3].replace(/,/g, ''));
      transactions.push({
        transaction_type: 'expense',
        date: dateStr,
        amount,
        currency: 'JPY',
        merchant,
        category: this.predictCategory(merchant),
        raw_description: merchant,
        confidence: 0.95,
      });
    }

    // 3. SMBC Bank Withdrawal Pattern
    const smbcMatch = text.match(/出金日\s*：\s*(\d{4})年(\d{2})月(\d{2})日[\s\S]*?出金額\s*：\s*([\d,]+)円[\s\S]*?内容\s*：\s*([^\r\n]+)/);
    if (smbcMatch) {
      const dateStr = `${smbcMatch[1]}-${smbcMatch[2]}-${smbcMatch[3]}`;
      const amount = parseInt(smbcMatch[4].replace(/,/g, ''));
      const merchant = smbcMatch[5].trim();
      transactions.push({
        transaction_type: 'expense',
        date: dateStr,
        amount,
        currency: 'JPY',
        merchant,
        category: this.predictCategory(merchant),
        raw_description: merchant,
        confidence: 0.9,
      });
    }

    // 4. Seven-Eleven / Generic Payment Pattern
    //ご​利用日時：2026/04/11 01:34
    //セブン－イレブン（買物） 570円
    const genericMatch = text.match(/ご利用日時：(\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2})[\r\n]+(.+?)[\s\t]+([\d,]+)円/);
    if (genericMatch) {
      const dateStr = genericMatch[1].replace(/\//g, '-');
      const merchant = genericMatch[2].trim();
      const amount = parseInt(genericMatch[3].replace(/,/g, ''));
      transactions.push({
        transaction_type: 'expense',
        date: dateStr,
        amount,
        currency: 'JPY',
        merchant,
        category: this.predictCategory(merchant),
        raw_description: merchant,
        confidence: 0.95,
      });
    }

    return transactions;
  }

  private static predictCategory(merchant: string): string {
    const m = merchant.toLowerCase();
    if (m.includes('ローソン') || m.includes('セブン') || m.includes('ファミマ') || m.includes('11')) return '食費';
    if (m.includes('スーパー') || m.includes('成城石井') || m.includes('ライフ')) return '食費';
    if (m.includes('amazon') || m.includes('楽天') || m.includes('メルカリ')) return '買い物';
    if (m.includes('suica') || m.includes('pasmo') || m.includes('taxi') || m.includes('タクシー') || m.includes('電車')) return '交通費';
    return 'その他';
  }
}
