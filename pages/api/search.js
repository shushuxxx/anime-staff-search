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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: `あなたはアニメ業界のスタッフ情報に詳しい専門家です。
Web検索ツールを使い、特に seesaawiki.jp/w/radioi_34（アニメスタッフデータベース）を参照して情報を収集してください。
検索クエリ例: "site:seesaawiki.jp/w/radioi_34 [スタッフ名]"

必ずJSON形式のみで返してください。マークダウン記号・前置き・説明は一切不要です。

返すJSON形式:
{
  "name": "正式名",
  "nameReading": "読み仮名（わかれば）",
  "role": "主な役職",
  "known": true,
  "works": [
    {"title": "作品名", "year": "放送年", "role": "担当役職", "company": "制作会社"}
  ],
  "companies": [
    {"name": "会社名", "count": 作品数}
  ],
  "summary": "300字程度のプロフィール",
  "sources": ["参照したURLや情報源"]
}

スタッフが見つからない場合: {"known": false, "name": "入力された名前"}`,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `アニメスタッフ「${name.trim()}」について、seesaawiki.jp/w/radioi_34 を中心にWeb検索で詳しく調べ、参加作品リストと関わった制作会社をJSONで返してください。できるだけ多くの作品を収集してください。`
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
