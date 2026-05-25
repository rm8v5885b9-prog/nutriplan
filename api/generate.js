export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { age, weight, height, gender, activity, goal, budget, city, preferences } = req.body;

  if (!age || !weight || !height || !budget) {
    return res.status(400).json({ error: 'Заполни все обязательные поля' });
  }

  const prompt = `Ты нутрициолог и составляешь персональный план питания на 7 дней.

Данные пользователя:
- Пол: ${gender}
- Возраст: ${age} лет
- Вес: ${weight} кг, Рост: ${height} см
- Активность: ${activity}
- Цель: ${goal}
- Бюджет на неделю: ${budget} рублей (город: ${city || 'Россия'})
- Предпочтения/ограничения: ${preferences || 'нет особых ограничений'}

Составь подробный план питания. Ответь СТРОГО в следующем формате:

## 📊 Твои показатели

Рассчитай суточную норму калорий (формула Миффлина-Сан Жеора) и КБЖУ. Укажи конкретные цифры.

## 🍽️ Меню на 7 дней

Для каждого дня (День 1 — День 7) укажи:
### День [N] — [день недели]
- Завтрак: [блюдо] (~[калории] ккал)
- Обед: [блюдо] (~[калории] ккал)
- Ужин: [блюдо] (~[калории] ккал)
- Перекус: [блюдо] (~[калории] ккал)

## 🛒 Список продуктов на неделю

Составь таблицу нужных продуктов в формате:
ПРОДУКТ | КОЛИЧЕСТВО | ЦЕНА (₽)

Учитывай реальные цены в ${city || 'России'}. Бюджет: ${budget} рублей.

Итого: [сумма] рублей

## 💡 Советы

3-4 конкретных совета по данному плану питания.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4000, temperature: 0.7 }
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: 'Пустой ответ от AI' });

    return res.status(200).json({ result: text });

  } catch (err) {
    return res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
  }
}
