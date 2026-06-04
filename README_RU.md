# Math Trainer — Тренажёр устного счёта

Прогрессивное веб-приложение (PWA) для тренировки устного счёта. Для детей 1–4 классов, 55 типов заданий, 8 языков, подробная статистика.

## Возможности

- 55 типов заданий — сложение, вычитание, умножение, деление с разной разрядностью
- 8 языков — русский, английский, испанский, французский, немецкий, итальянский, португальский, украинский
- Статистика — календарь активности, серия (streak), почасовая активность, детали каждого теста
- Родительский раздел — защищён ПИН-кодом: включение заданий, количество примеров, звук, сброс статистики
- PWA — устанавливается на главный экран iPad/телефона, работает офлайн
- Звуковые эффекты, своя цифровая клавиатура, анимации

## Скриншоты

<img src="screenshots/img01.png" width="200" /> <img src="screenshots/img02.png" width="200" /> <img src="screenshots/img03.png" width="200" /> <img src="screenshots/img04.png" width="200" />
<img src="screenshots/img05.png" width="200" /> <img src="screenshots/img06.png" width="200" /> <img src="screenshots/img07.png" width="200" /> <img src="screenshots/img08.png" width="200" />

## Технологии

React 19 + TypeScript, Vite 6 + vite-plugin-pwa, react-router-dom (HashRouter), localStorage, чистый CSS.

## Запуск

```bash
npm install
npm run dev
```

Откройте http://localhost:5173.

### Сборка

```bash
npm run build
```

Результат в папке `dist/` — деплой на любой статический хостинг.

## Деплой на GitHub Pages

### В первый раз

1. Залейте проект на GitHub:
   ```bash
   git remote add origin git@github.com:slyvkanychserhii/mathtrainer.git
   git push -u origin main
   ```
2. Задеплойте:
   ```bash
   npm run deploy
   ```
3. Зайдите в `Settings → Pages` на GitHub, выберите **Source**: `Deploy from a branch`, ветку `gh-pages`, папку `/ (root)`.
4. Подождите 1–2 минуты, откройте `https://slyvkanychserhii.github.io/mathtrainer/`.

### Обновление после изменений

```bash
npm run deploy
```

Собирает проект и пушит `dist/` в ветку `gh-pages`. GitHub Pages обновляется в течение минуты.

## Установка на iPad

1. Откройте `https://slyvkanychserhii.github.io/mathtrainer/` в Safari.
2. Нажмите **«Поделиться»** (квадрат со стрелкой).
3. Нажмите **«На экран «Домой»**.
4. Нажмите **«Добавить»**.
5. Открывайте с рабочего стола — приложение запускается на весь экран, без адресной строки, работает офлайн.

## ПИН-код

Устанавливается при первом входе в Настройки. Если забыли — очистите данные сайта через DevTools (`F12` → Application → Local Storage → удалить ключи `matemagic_*`).
