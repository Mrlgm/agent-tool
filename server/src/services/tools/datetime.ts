export const datetimeTool = {
  name: 'calculate_datetime',
  description: '计算日期和时间。用于回答"三天后是几号"、"距离春节还有多少天"等日期计算问题。',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'difference', 'current'],
        description: '操作类型：add（加日期）、subtract（减日期）、difference（日期间差）、current（当前时间）',
      },
      value: {
        type: 'number',
        description: '要加减的天数（正数为加，负数为减）',
      },
      targetDate: {
        type: 'string',
        description: '目标日期，格式：YYYY-MM-DD（用于差值计算）',
      },
    },
    required: ['operation'],
  },
};

export async function datetimeExecutor(args: {
  operation: string;
  value?: number;
  targetDate?: string;
}): Promise<unknown> {
  console.log(`\n   [DateTimeExecutor] 📅 Executing datetime tool`);
  console.log(`   [DateTimeExecutor] Args: ${JSON.stringify(args)}`);

  const now = new Date();
  let result: unknown;

  console.log(`   [DateTimeExecutor] Current time: ${now.toISOString()}`);

  switch (args.operation) {
    case 'current': {
      console.log(`   [DateTimeExecutor] Operation: get current time`);
      result = {
        current: now.toISOString(),
        formatted: now.toLocaleString('zh-CN'),
        weekday: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()],
      };
      break;
    }

    case 'add': {
      console.log(`   [DateTimeExecutor] Operation: add ${args.value} days`);
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + (args.value || 0));
      result = {
        result: targetDate.toISOString().split('T')[0],
        formatted: targetDate.toLocaleDateString('zh-CN'),
        weekday: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][targetDate.getDay()],
      };
      console.log(`   [DateTimeExecutor] Result: ${JSON.stringify(result)}`);
      break;
    }

    case 'subtract': {
      console.log(`   [DateTimeExecutor] Operation: subtract ${args.value} days`);
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - (args.value || 0));
      result = {
        result: targetDate.toISOString().split('T')[0],
        formatted: targetDate.toLocaleDateString('zh-CN'),
        weekday: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][targetDate.getDay()],
      };
      console.log(`   [DateTimeExecutor] Result: ${JSON.stringify(result)}`);
      break;
    }

    case 'difference': {
      console.log(`   [DateTimeExecutor] Operation: calculate difference to ${args.targetDate}`);
      const target = new Date(args.targetDate || now);
      const diff = target.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      const absDays = Math.abs(days);
      result = {
        days,
        description: days === 0 ? '就是今天' : days > 0 ? `还有 ${absDays} 天` : `已经过去 ${absDays} 天`,
        targetDate: target.toISOString().split('T')[0],
        today: now.toISOString().split('T')[0],
      };
      console.log(`   [DateTimeExecutor] Result: ${JSON.stringify(result)}`);
      break;
    }

    default:
      console.error(`   [DateTimeExecutor] ❌ Unknown operation: ${args.operation}`);
      throw new Error(`Unknown operation: ${args.operation}`);
  }

  console.log(`   [DateTimeExecutor] ✅ datetime calculation completed`);
  return result;
}
