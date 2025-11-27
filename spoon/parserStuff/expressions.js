export function parseExpression(p, rbp) {
  let t = p.advance();

  const nud = p.nuds.get(t.type);
  if (!nud) {
    throw p.syntaxError(t, `Expression cannot begin with ${t.type}`);
  }

  let left = nud(p, t);

  while (true) {
    t = p.current;
    if (p.isDelimiter(t) || rbp >= getLbp(p, t)) {
      break;
    }
    t = p.advance();

    // Is this a valid function call head?
    if (left.type == "identifier" || left.type === "member access" || left.grouped) {
      if (t.type === "()") {
        // TODO: need to check for further arguments (invalid in this case)
        return p.makeNode("call", { head: left, args: [] });
      }
    }

    const led = p.leds.get(t.type);
    if (!led) {
      throw p.syntaxError(t, "Unrecognised operator");
    }
    left = led.led(p, left, t, led.rbp);
  }
  
  return left;
}

function getLbp(p, t) {
  return p.leds.get(t.type)?.lbp ?? 0;
}
