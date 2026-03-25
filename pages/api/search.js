export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'スタッフ名を入力してください' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: `アニメスタッフ情報の専門家。JSON形式のみで返答。説明不要。
{"name":"名前","nameReading":"読み","role":"役職","known":true,"works":[{"title":"作品名","year":"年","role":"役割","company":"会社"}],"companies":[{"name":"会社名","count":数}],"summary":"概要100字","sources":[]}
不明な場合:{"known":false,"name":"名前"}`,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `「${name.trim()}」のアニメスタッフ情報をseesaawiki.jp/w/radioi_34で検索してJSONで返して。`
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find(b => b.type === 'text');
    if (!textBlock) throw new Error('レスポンスが空です');

    let raw = textBlock.text.trim().replace(/```json\s*/g, '').replace(/```/g, '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON形式の回答が得られませんでした');

    const result = JSON.parse(match[0]);
    return res.status(200).json(result);

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: error.message || '検索中にエラーが発生しました' });
  }
}
