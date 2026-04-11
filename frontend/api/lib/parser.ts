/**
 * Backend port of AIExtractionService
 */

export interface ExtractedTransaction {
  transaction_type: 'expense' | 'income';
  date: string;
  amount: number;
  merchant: string;
  card_type: string;
}

export function parseEmailBody(subject: string, body: string): ExtractedTransaction | null {
  // SMBC (Vpass)
  if (subject.includes('三井住友カード')) {
    const vpassMatch = body.match(/利用日：(\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2})[\r\n]+[\s\S]*?利用先：(.+?)[\r\n]+[\s\S]*?利用金額：([\d,]+)円/);
    if (vpassMatch) {
      return {
        transaction_type: 'expense',
        date: vpassMatch[1].replace(/\//g, '-'),
        merchant: vpassMatch[2].trim(),
        amount: parseInt(vpassMatch[3].replace(/,/g, '')),
        card_type: 'smbc',
      };
    }
  }

  // Rakuten
  if (subject.includes('楽天カード')) {
    const rakutenMatch = body.match(/利用日: (\d{4}\/\d{2}\/\d{2})[\r\n]+[\s\S]*?利用先: (.*?)[\r\n]+[\s\S]*?利用金額: ([\d,]+) 円/);
    if (rakutenMatch) {
      return {
        transaction_type: 'expense',
        date: rakutenMatch[1].replace(/\//g, '-'),
        merchant: rakutenMatch[2].trim(),
        amount: parseInt(rakutenMatch[3].replace(/,/g, '')),
        card_type: 'rakuten',
      };
    }
  }

  // Seven-Eleven / Generic
  const genericMatch = body.match(/ご利用日時：(\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2})[\r\n]+(.+?)[\s\t]+([\d,]+)円/);
  if (genericMatch) {
    return {
      transaction_type: 'expense',
      date: genericMatch[1].replace(/\//g, '-'),
      merchant: genericMatch[2].trim(),
      amount: parseInt(genericMatch[3].replace(/,/g, '')),
      card_type: 'generic',
    };
  }

  return null;
}
