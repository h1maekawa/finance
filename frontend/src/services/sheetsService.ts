/**
 * Sheets Service
 * Responsible for communicating with Google Sheets via the GAS Proxy.
 */
export type SheetInvestmentRow = {
  type: 'stock' | 'fund'
  symbol: string
  name: string
  quantity: number
  averagePrice: number
  currentPrice?: number
  evaluationAmount?: number
  uid: string
}

export async function appendInvestmentToSheet(data: SheetInvestmentRow) {
  try {
    const response = await fetch('/api/gas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'append',
        ...data
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to append to sheet: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Sheets Append Error:', error);
    throw error;
  }
}

export async function deleteInvestmentFromSheet(symbol: string, name: string, type: 'stock' | 'fund', uid: string) {
  try {
    const response = await fetch('/api/gas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        type,
        symbol,
        name,
        uid,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete from sheet: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Sheets Delete Error:', error);
    throw error;
  }
}

export async function fetchInvestmentRowsFromSheet(uid: string, type: 'stock' | 'fund' | 'all' = 'all') {
  try {
    const query = new URLSearchParams({ uid, type });
    const response = await fetch(`/api/gas?${query.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from sheet: ${response.statusText}`);
    }

    const data = await response.json();
    return data.rows || [];
  } catch (error) {
    console.error('Sheets Fetch Error:', error);
    return [];
  }
}

/**
 * Triggers the manual Gmail import process on the GAS side.
 */
export async function triggerGmailImportOnGas() {
  try {
    const response = await fetch('/api/gas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'gmailImport' }),
    });
    return await response.json();
  } catch (error) {
    console.error('GAS Gmail Import Error:', error);
    throw error;
  }
}
