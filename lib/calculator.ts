import { create, all } from 'mathjs';

// Isolated mathjs scope — no access to Node globals
const math = create(all);

interface CalcResult {
  expression: string;
  result: string;
  unit?: string;
}

export function calculate(expression: string): CalcResult {
  if (!expression.trim()) throw new Error('Empty expression');
  if (expression.length > 500) throw new Error('Expression too long (max 500 characters)');

  let result;
  try {
    result = math.evaluate(expression.trim());
  } catch {
    throw new Error(
      `Cannot evaluate "${expression}". ` +
      'Supported: arithmetic (2+2), functions (sqrt, sin, log), ' +
      'unit conversions (5 km to mi, 100 kg to lbs, 37 degC to degF), ' +
      'percentages (15% * 42).'
    );
  }

  // mathjs returns a Unit object for conversions, a number/BigNumber for plain math
  if (typeof result === 'object' && result !== null && typeof result.toString === 'function') {
    const str = result.toString();
    // Format nicely: "1.2345678 mile" → round to 6 sig figs
    if ('value' in result && 'units' in result) {
      const val = math.round(result.value as number, 6);
      const unitStr = (result as { units: Array<{ unit: { name: string }; power: number }> })
        .units.map((u) => u.unit.name + (u.power !== 1 ? `^${u.power}` : ''))
        .join(' ');
      return { expression, result: `${val} ${unitStr}`.trim(), unit: unitStr || undefined };
    }
    return { expression, result: str };
  }

  if (typeof result === 'number') {
    // Avoid floating-point noise: round to 10 sig figs, strip trailing zeros
    const rounded = parseFloat(result.toPrecision(10));
    return { expression, result: String(rounded) };
  }

  return { expression, result: String(result) };
}
