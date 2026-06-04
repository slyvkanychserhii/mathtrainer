export interface TaskDef {
  id: number;
  name: string;
  example: string;
  group: string;
  generate: () => { a: number; op: string; b: number; answer: number };
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function genWithRetry(fn: () => { a: number; op: string; b: number; answer: number } | null, maxTries = 200) {
  for (let i = 0; i < maxTries; i++) {
    const r = fn();
    if (r !== null) return r;
  }
  return { a: 1, op: '+', b: 1, answer: 2 };
}

export const TASK_GROUPS = [
  { id: 'single', name: 'СЛОЖЕНИЕ И ВЫЧИТАНИЕ: ОДНОЗНАЧНЫЕ (1–2 КЛАСС)', range: [1, 4] },
  { id: 'two_one', name: 'СЛОЖЕНИЕ И ВЫЧИТАНИЕ: ДВУЗНАЧНЫЕ + ОДНОЗНАЧНЫЕ (2 КЛАСС)', range: [5, 8] },
  { id: 'two_two', name: 'СЛОЖЕНИЕ И ВЫЧИТАНИЕ: ДВУЗНАЧНЫЕ + ДВУЗНАЧНЫЕ (2–3 КЛАСС)', range: [9, 14] },
  { id: 'three_one', name: 'СЛОЖЕНИЕ И ВЫЧИТАНИЕ: ТРЁХЗНАЧНЫЕ + ОДНОЗНАЧНЫЕ (3 КЛАСС)', range: [15, 18] },
  { id: 'three_two', name: 'СЛОЖЕНИЕ И ВЫЧИТАНИЕ: ТРЁХЗНАЧНЫЕ + ДВУЗНАЧНЫЕ (3–4 КЛАСС)', range: [19, 26] },
  { id: 'three_three', name: 'СЛОЖЕНИЕ И ВЫЧИТАНИЕ: ТРЁХЗНАЧНЫЕ + ТРЁХЗНАЧНЫЕ (4 КЛАСС)', range: [27, 37] },
  { id: 'multiply', name: 'УМНОЖЕНИЕ И ДЕЛЕНИЕ: ТАБЛИЦА УМНОЖЕНИЯ (2–3 КЛАСС)', range: [38, 55] },
];

export const TASKS: TaskDef[] = [
  {
    id: 1, name: 'Сложение простое', example: '3 + 4', group: 'single',
    generate: () => {
      const a = randInt(1, 8);
      const b = randInt(1, 9 - a);
      return { a, op: '+', b, answer: a + b };
    }
  },
  {
    id: 2, name: 'Сложение с переходом через 10', example: '7 + 5', group: 'single',
    generate: () => genWithRetry(() => {
      const a = randInt(2, 9);
      const b = randInt(2, 9);
      if (a + b >= 11 && a + b <= 18) return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 3, name: 'Вычитание простое', example: '8 − 3', group: 'single',
    generate: () => {
      const a = randInt(3, 9);
      const b = randInt(1, a - 1);
      return { a, op: '−', b, answer: a - b };
    }
  },
  {
    id: 4, name: 'Вычитание с переходом через 10', example: '13 − 7', group: 'single',
    generate: () => {
      const a = randInt(11, 18);
      const b = randInt(a - 9 < 2 ? 2 : a - 9, 9);
      if (a - b >= 1 && b > a % 10) return { a, op: '−', b, answer: a - b };
      return genWithRetry(() => {
        const aa = randInt(11, 18);
        const bb = randInt(2, 9);
        if (aa - bb >= 1 && bb > aa % 10) return { a: aa, op: '−', b: bb, answer: aa - bb };
        return null;
      });
    }
  },
  {
    id: 5, name: 'Сложение без переноса', example: '32 + 5', group: 'two_one',
    generate: () => genWithRetry(() => {
      const a = randInt(11, 94);
      const b = randInt(1, 9);
      if ((a % 10) + b <= 9) return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 6, name: 'Сложение с переносом', example: '37 + 5', group: 'two_one',
    generate: () => genWithRetry(() => {
      const a = randInt(11, 91);
      const b = randInt(2, 9);
      if ((a % 10) + b >= 10 && a + b <= 99) return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 7, name: 'Вычитание без займа', example: '48 − 3', group: 'two_one',
    generate: () => genWithRetry(() => {
      const a = randInt(12, 99);
      const b = randInt(1, 9);
      if (a % 10 >= b && a - b >= 10) return { a, op: '−', b, answer: a - b };
      return null;
    })
  },
  {
    id: 8, name: 'Вычитание с займом', example: '43 − 7', group: 'two_one',
    generate: () => genWithRetry(() => {
      const a = randInt(12, 99);
      const b = randInt(2, 9);
      if (a % 10 < b && a - b >= 10) return { a, op: '−', b, answer: a - b };
      return null;
    })
  },
  {
    id: 9, name: 'Сложение без переноса', example: '32 + 45', group: 'two_two',
    generate: () => genWithRetry(() => {
      const a = randInt(11, 88);
      const b = randInt(11, 88);
      if ((a % 10) + (b % 10) <= 9 && a + b <= 99) return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 10, name: 'Сложение с переносом', example: '37 + 46', group: 'two_two',
    generate: () => genWithRetry(() => {
      const a = randInt(11, 88);
      const b = randInt(11, 88);
      if ((a % 10) + (b % 10) >= 10 && a + b <= 99) return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 11, name: 'Сложение с переносом через сотню', example: '64 + 73', group: 'two_two',
    generate: () => genWithRetry(() => {
      const a = randInt(50, 99);
      const b = randInt(50, 99);
      if (a + b >= 100 && a + b <= 198) return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 12, name: 'Вычитание без займа', example: '57 − 23', group: 'two_two',
    generate: () => genWithRetry(() => {
      const a = randInt(22, 99);
      const b = randInt(11, a - 1);
      if (b < a && (a % 10) >= (b % 10) && Math.floor(a / 10) >= Math.floor(b / 10) && a - b >= 10)
        return { a, op: '−', b, answer: a - b };
      return null;
    })
  },
  {
    id: 13, name: 'Вычитание с займом из десятков', example: '53 − 27', group: 'two_two',
    generate: () => genWithRetry(() => {
      const a = randInt(22, 99);
      const b = randInt(11, a - 1);
      if ((a % 10) < (b % 10) && a - b >= 1) return { a, op: '−', b, answer: a - b };
      return null;
    })
  },
  {
    id: 14, name: 'Вычитание из круглого числа', example: '50 − 23', group: 'two_two',
    generate: () => {
      const a = randInt(2, 9) * 10;
      const b = randInt(11, a - 1);
      return { a, op: '−', b, answer: a - b };
    }
  },
  {
    id: 15, name: 'Сложение без переноса', example: '324 + 5', group: 'three_one',
    generate: () => genWithRetry(() => {
      const a = randInt(100, 990);
      const b = randInt(1, 9);
      if ((a % 10) + b <= 9) return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 16, name: 'Сложение с переносом', example: '328 + 5', group: 'three_one',
    generate: () => genWithRetry(() => {
      const a = randInt(100, 990);
      const b = randInt(2, 9);
      if ((a % 10) + b >= 10 && a + b <= 999) return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 17, name: 'Вычитание без займа', example: '347 − 4', group: 'three_one',
    generate: () => genWithRetry(() => {
      const a = randInt(101, 999);
      const b = randInt(1, 9);
      if ((a % 10) >= b) return { a, op: '−', b, answer: a - b };
      return null;
    })
  },
  {
    id: 18, name: 'Вычитание с займом', example: '342 − 7', group: 'three_one',
    generate: () => genWithRetry(() => {
      const a = randInt(101, 999);
      const b = randInt(2, 9);
      if ((a % 10) < b && a - b >= 100) return { a, op: '−', b, answer: a - b };
      return null;
    })
  },
  {
    id: 19, name: 'Сложение без переноса', example: '324 + 45', group: 'three_two',
    generate: () => genWithRetry(() => {
      const a = randInt(100, 900);
      const b = randInt(10, 99);
      if ((a % 10) + (b % 10) <= 9 && (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) <= 9 && a + b <= 999)
        return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 20, name: 'Сложение с переносом единиц', example: '327 + 46', group: 'three_two',
    generate: () => genWithRetry(() => {
      const a = randInt(100, 900);
      const b = randInt(10, 99);
      const unitsSum = (a % 10) + (b % 10);
      const tensSum = (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) + (unitsSum >= 10 ? 1 : 0);
      if (unitsSum >= 10 && tensSum <= 9 && a + b <= 999)
        return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 21, name: 'Сложение с переносом десятков', example: '362 + 54', group: 'three_two',
    generate: () => genWithRetry(() => {
      const a = randInt(100, 900);
      const b = randInt(10, 99);
      const unitsSum = (a % 10) + (b % 10);
      const tensSum = (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10);
      if (unitsSum <= 9 && tensSum >= 10 && a + b <= 999)
        return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 22, name: 'Сложение с двойным переносом', example: '368 + 57', group: 'three_two',
    generate: () => genWithRetry(() => {
      const a = randInt(100, 900);
      const b = randInt(10, 99);
      const unitsSum = (a % 10) + (b % 10);
      const tensSum = (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) + (unitsSum >= 10 ? 1 : 0);
      if (unitsSum >= 10 && tensSum >= 10 && a + b <= 999)
        return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 23, name: 'Вычитание без займа', example: '578 − 34', group: 'three_two',
    generate: () => genWithRetry(() => {
      const a = randInt(110, 999);
      const b = randInt(10, 99);
      if ((a % 10) >= (b % 10) && (Math.floor(a / 10) % 10) >= (Math.floor(b / 10) % 10) && a - b >= 100)
        return { a, op: '−', b, answer: a - b };
      return null;
    })
  },
  {
    id: 24, name: 'Вычитание с займом из десятков', example: '543 − 27', group: 'three_two',
    generate: () => genWithRetry(() => {
      const a = randInt(120, 999);
      const b = randInt(10, 99);
      const au = a % 10, bu = b % 10;
      const at = Math.floor(a / 10) % 10, bt = Math.floor(b / 10) % 10;
      if (au < bu && (at - 1) >= bt && a - b >= 100)
        return { a, op: '−', b, answer: a - b };
      return null;
    })
  },
  {
    id: 25, name: 'Вычитание с займом из сотен', example: '523 − 54', group: 'three_two',
    generate: () => genWithRetry(() => {
      const a = randInt(200, 999);
      const b = randInt(10, 99);
      const au = a % 10, bu = b % 10;
      const at = Math.floor(a / 10) % 10, bt = Math.floor(b / 10) % 10;
      if (au >= bu && at < bt && a - b >= 100)
        return { a, op: '−', b, answer: a - b };
      return null;
    })
  },
  {
    id: 26, name: 'Вычитание с двойным займом', example: '513 − 57', group: 'three_two',
    generate: () => genWithRetry(() => {
      const a = randInt(200, 999);
      const b = randInt(10, 99);
      const au = a % 10, bu = b % 10;
      const at = Math.floor(a / 10) % 10, bt = Math.floor(b / 10) % 10;
      if (au < bu && at <= bt && a - b >= 100)
        return { a, op: '−', b, answer: a - b };
      return null;
    })
  },
  {
    id: 27, name: 'Сложение без переноса', example: '321 + 456', group: 'three_three',
    generate: () => genWithRetry(() => {
      const a = randInt(100, 888);
      const b = randInt(100, 888);
      const u = (a % 10) + (b % 10);
      const t = (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10);
      const h = Math.floor(a / 100) + Math.floor(b / 100);
      if (u <= 9 && t <= 9 && h <= 9 && a + b <= 999)
        return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 28, name: 'Сложение с переносом единиц', example: '324 + 438', group: 'three_three',
    generate: () => genWithRetry(() => {
      const a = randInt(100, 888);
      const b = randInt(100, 888);
      const u = (a % 10) + (b % 10);
      const t = (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) + (u >= 10 ? 1 : 0);
      const h = Math.floor(a / 100) + Math.floor(b / 100) + (t >= 10 ? 1 : 0);
      if (u >= 10 && t <= 9 && h <= 9 && a + b <= 999)
        return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 29, name: 'Сложение с переносом десятков', example: '361 + 352', group: 'three_three',
    generate: () => genWithRetry(() => {
      const a = randInt(100, 888);
      const b = randInt(100, 888);
      const u = (a % 10) + (b % 10);
      const t = (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10);
      const h = Math.floor(a / 100) + Math.floor(b / 100) + (t >= 10 ? 1 : 0);
      if (u <= 9 && t >= 10 && h <= 9 && a + b <= 999)
        return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 30, name: 'Сложение с двойным переносом', example: '357 + 486', group: 'three_three',
    generate: () => genWithRetry(() => {
      const a = randInt(100, 888);
      const b = randInt(100, 888);
      const u = (a % 10) + (b % 10);
      const t = (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) + (u >= 10 ? 1 : 0);
      const h = Math.floor(a / 100) + Math.floor(b / 100) + (t >= 10 ? 1 : 0);
      if (u >= 10 && t >= 10 && h <= 9 && a + b <= 999)
        return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 31, name: 'Сложение через тысячу', example: '654 + 473', group: 'three_three',
    generate: () => genWithRetry(() => {
      const a = randInt(500, 999);
      const b = randInt(100, 999);
      if (a + b >= 1000 && a + b <= 1998)
        return { a, op: '+', b, answer: a + b };
      return null;
    })
  },
  {
    id: 32, name: 'Вычитание без займа', example: '876 − 234', group: 'three_three',
    generate: () => genWithRetry(() => {
      const a = randInt(111, 999);
      const b = randInt(100, a - 1);
      if ((a % 10) >= (b % 10) && (Math.floor(a / 10) % 10) >= (Math.floor(b / 10) % 10) && Math.floor(a / 100) >= Math.floor(b / 100) && a - b >= 100)
        return { a, op: '−', b, answer: a - b };
      return null;
    })
  },
  {
    id: 33, name: 'Вычитание с займом из десятков', example: '852 − 237', group: 'three_three',
    generate: () => genWithRetry(() => {
      const a = randInt(200, 999);
      const b = randInt(100, a - 1);
      const au = a % 10, bu = b % 10;
      const at = Math.floor(a / 10) % 10, bt = Math.floor(b / 10) % 10;
      if (au < bu && (at - 1) >= bt && a - b >= 100)
        return { a, op: '−', b, answer: a - b };
      return null;
    })
  },
  {
    id: 34, name: 'Вычитание с займом из сотен', example: '823 − 254', group: 'three_three',
    generate: () => genWithRetry(() => {
      const a = randInt(200, 999);
      const b = randInt(100, a - 1);
      const au = a % 10, bu = b % 10;
      const at = Math.floor(a / 10) % 10, bt = Math.floor(b / 10) % 10;
      const ah = Math.floor(a / 100), bh = Math.floor(b / 100);
      if (au >= bu && at < bt && (ah - 1) >= bh && a - b >= 100)
        return { a, op: '−', b, answer: a - b };
      return null;
    })
  },
  {
    id: 35, name: 'Вычитание с двойным займом', example: '812 − 257', group: 'three_three',
    generate: () => genWithRetry(() => {
      const a = randInt(200, 999);
      const b = randInt(100, a - 1);
      const au = a % 10, bu = b % 10;
      const at = Math.floor(a / 10) % 10, bt = Math.floor(b / 10) % 10;
      if (au < bu && at <= bt && a - b >= 100)
        return { a, op: '−', b, answer: a - b };
      return null;
    })
  },
  {
    id: 36, name: 'Вычитание из круглой сотни', example: '800 − 347', group: 'three_three',
    generate: () => {
      const a = randInt(1, 9) * 100;
      const b = randInt(101, a - 1);
      return { a, op: '−', b, answer: a - b };
    }
  },
  {
    id: 37, name: 'Вычитание из круглой тысячи', example: '1000 − 347', group: 'three_three',
    generate: () => {
      const b = randInt(101, 999);
      return { a: 1000, op: '−', b, answer: 1000 - b };
    }
  },
  {
    id: 38, name: 'Умножение на 2', example: '4 × 2', group: 'multiply',
    generate: () => {
      const a = randInt(1, 9);
      const b = 2;
      if (Math.random() < 0.5) return { a, op: '×', b, answer: a * b };
      return { a: b, op: '×', b: a, answer: a * b };
    }
  },
  {
    id: 39, name: 'Умножение на 3', example: '6 × 3', group: 'multiply',
    generate: () => {
      const a = randInt(1, 9);
      const b = 3;
      if (Math.random() < 0.5) return { a, op: '×', b, answer: a * b };
      return { a: b, op: '×', b: a, answer: a * b };
    }
  },
  {
    id: 40, name: 'Умножение на 4', example: '8 × 4', group: 'multiply',
    generate: () => {
      const a = randInt(1, 9);
      const b = 4;
      if (Math.random() < 0.5) return { a, op: '×', b, answer: a * b };
      return { a: b, op: '×', b: a, answer: a * b };
    }
  },
  {
    id: 41, name: 'Умножение на 5', example: '7 × 5', group: 'multiply',
    generate: () => {
      const a = randInt(1, 9);
      const b = 5;
      if (Math.random() < 0.5) return { a, op: '×', b, answer: a * b };
      return { a: b, op: '×', b: a, answer: a * b };
    }
  },
  {
    id: 42, name: 'Умножение на 6', example: '9 × 6', group: 'multiply',
    generate: () => {
      const a = randInt(1, 9);
      const b = 6;
      if (Math.random() < 0.5) return { a, op: '×', b, answer: a * b };
      return { a: b, op: '×', b: a, answer: a * b };
    }
  },
  {
    id: 43, name: 'Умножение на 7', example: '5 × 7', group: 'multiply',
    generate: () => {
      const a = randInt(1, 9);
      const b = 7;
      if (Math.random() < 0.5) return { a, op: '×', b, answer: a * b };
      return { a: b, op: '×', b: a, answer: a * b };
    }
  },
  {
    id: 44, name: 'Умножение на 8', example: '6 × 8', group: 'multiply',
    generate: () => {
      const a = randInt(1, 9);
      const b = 8;
      if (Math.random() < 0.5) return { a, op: '×', b, answer: a * b };
      return { a: b, op: '×', b: a, answer: a * b };
    }
  },
  {
    id: 45, name: 'Умножение на 9', example: '3 × 9', group: 'multiply',
    generate: () => {
      const a = randInt(1, 9);
      const b = 9;
      if (Math.random() < 0.5) return { a, op: '×', b, answer: a * b };
      return { a: b, op: '×', b: a, answer: a * b };
    }
  },
  {
    id: 46, name: 'Умножение смешанное', example: '7 × 8', group: 'multiply',
    generate: () => {
      const a = randInt(1, 9);
      const b = randInt(1, 9);
      return { a, op: '×', b, answer: a * b };
    }
  },
  {
    id: 47, name: 'Деление на 2', example: '14 ÷ 2', group: 'multiply',
    generate: () => genWithRetry(() => {
      const quotient = randInt(2, 9);
      const a = 2 * quotient;
      if (a <= 81) return { a, op: '÷', b: 2, answer: quotient };
      return null;
    })
  },
  {
    id: 48, name: 'Деление на 3', example: '18 ÷ 3', group: 'multiply',
    generate: () => genWithRetry(() => {
      const quotient = randInt(2, 9);
      const a = 3 * quotient;
      if (a <= 81) return { a, op: '÷', b: 3, answer: quotient };
      return null;
    })
  },
  {
    id: 49, name: 'Деление на 4', example: '24 ÷ 4', group: 'multiply',
    generate: () => genWithRetry(() => {
      const quotient = randInt(2, 9);
      const a = 4 * quotient;
      if (a <= 81) return { a, op: '÷', b: 4, answer: quotient };
      return null;
    })
  },
  {
    id: 50, name: 'Деление на 5', example: '30 ÷ 5', group: 'multiply',
    generate: () => genWithRetry(() => {
      const quotient = randInt(2, 9);
      const a = 5 * quotient;
      if (a <= 81) return { a, op: '÷', b: 5, answer: quotient };
      return null;
    })
  },
  {
    id: 51, name: 'Деление на 6', example: '36 ÷ 6', group: 'multiply',
    generate: () => genWithRetry(() => {
      const quotient = randInt(2, 9);
      const a = 6 * quotient;
      if (a <= 81) return { a, op: '÷', b: 6, answer: quotient };
      return null;
    })
  },
  {
    id: 52, name: 'Деление на 7', example: '42 ÷ 7', group: 'multiply',
    generate: () => genWithRetry(() => {
      const quotient = randInt(2, 9);
      const a = 7 * quotient;
      if (a <= 81) return { a, op: '÷', b: 7, answer: quotient };
      return null;
    })
  },
  {
    id: 53, name: 'Деление на 8', example: '48 ÷ 8', group: 'multiply',
    generate: () => genWithRetry(() => {
      const quotient = randInt(2, 9);
      const a = 8 * quotient;
      if (a <= 81) return { a, op: '÷', b: 8, answer: quotient };
      return null;
    })
  },
  {
    id: 54, name: 'Деление на 9', example: '54 ÷ 9', group: 'multiply',
    generate: () => genWithRetry(() => {
      const quotient = randInt(2, 9);
      const a = 9 * quotient;
      if (a <= 81) return { a, op: '÷', b: 9, answer: quotient };
      return null;
    })
  },
  {
    id: 55, name: 'Деление смешанное', example: '56 ÷ 8', group: 'multiply',
    generate: () => genWithRetry(() => {
      const divisor = randInt(2, 9);
      const quotient = randInt(2, 9);
      const a = divisor * quotient;
      if (a <= 81) return { a, op: '÷', b: divisor, answer: quotient };
      return null;
    })
  },
];

export function getTaskById(id: number): TaskDef | undefined {
  return TASKS.find(t => t.id === id);
}

export function getTasksByGroup(groupId: string): TaskDef[] {
  return TASKS.filter(t => t.group === groupId);
}
