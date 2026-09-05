module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ 
                error: 'Vercel 환경 변수에 GEMINI_API_KEY가 설정되지 않았습니다.' 
            });
        }

        const { imageBase64, mimeType } = req.body || {};

        if (!imageBase64 || !mimeType) {
            return res.status(400).json({ error: '이미지 데이터가 전달되지 않았습니다.' });
        }

        // Gemini API 호출 (gemini-3.6-flash 사용)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Extract all visible text from this image as accurately as possible. Maintain original structure and line breaks without adding explanations." },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: imageBase64
                            }
                        }
                    ]
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: data.error?.message || `Gemini API 오류 (${response.status})` 
            });
        }

        const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '텍스트를 감지하지 못했습니다.';
        return res.status(200).json({ text: extractedText });

    } catch (error) {
        return res.status(500).json({ error: `서버 내부 오류: ${error.message}` });
    }
};
