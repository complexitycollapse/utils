export function parseExpression(p, rbp) {
  let t = p.advance();

  const nud = p.nuds.get(t.type);
  if (!nud) {
    throw p.syntaxError(t, `Expression cannot begin with ${t.type}`);
  }

  let left = nud(p, t);

  while (true) {
    t = p.current;
    if (p.isDelimiter(t) || rbp >= getRbp(p, t)) {
      break;
    }
    t = p.advance();

    const led = p.leds.get(t.type);
    if (!led) {
      throw p.syntaxError(t, "Unrecognised operator");
    }
    left = led.led(p, left, t, led.rbp);
  }

  return left;
}

function getRbp(p, t) {
  return p.leds.get(t.type)?.rbp ?? 0;
}
