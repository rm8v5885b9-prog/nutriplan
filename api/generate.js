export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const { age, weight, height, gender, activity, goal, budget, city, preferences } = req.body;

  if (!age || !weight || !height || !budget) {
    return res.status(400).json({ error: 'Заполни все обязательные поля' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API ключ не настроен на сервере' });
  }

  const prompt = `Ты нутрициолог. Составь план питания на 7 дней.

Пол: ${gender}, Возраст: ${age} лет, Вес: ${weight} кг, Рост: ${height} см
Активность: ${activity}
Цель: ${goal}
Бюджет: ${budget} рублей на неделю (${city || 'Россия'})
Ограничения: ${preferences || 'нет'}

Формат ответа:

## 📊 Твои показатели
Суточная норма калорий и КБЖУ.

## 🍽️ Меню на 7 дней
### День 1 — Понедельник
- Завтрак: [блюдо] (~300 ккал)
- Обед: [блюдо] (~500 ккал)
- Ужин: [блюдо] (~400 ккал)
- Перекус: [блюдо] (~150 ккал)
(и так для всех 7 дней)

## 🛒 Список продуктов на неделю
ПРОДУКТ | КОЛИЧЕСТВО | ЦЕНА (₽)
Итого: [сумма] рублей

## 💡 Советы
3 совета по плану.`;

  try {
   const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4000, temperature: 0.7 }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: 'Gemini: ' + data.error.message });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: 'Пустой ответ от AI' });

    return res.status(200).json({ result: text });

  } catch (err) {
    return res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
  }
}
