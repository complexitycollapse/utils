export function parseExpression(p, rbp, forbidCalls) {
  let t = p.advance();

  const end = t => p.isDelimiter(t) || rbp >= getLbp(p, t);

  const nud = p.nuds.get(t.type);
  if (!nud) {
    throw p.syntaxError(t, `Expression cannot begin with ${t.type}`);
  }

  let left = nud(p, t);

  while (true) {
    t = p.current;
    if (p.isDelimiter(t)) {
      break;
    }

    // Is this a valid function call head?
    if (!forbidCalls && (left.type == "identifier" || left.type === "member access" || left.grouped)) {
      if (p.current.type === "()") {
        p.advance();
        left = p.makeNode("call", { head: left, args: [] });
      } else {
        const args = [];
        while (!p.isDelimiter(t) && p.current.type != "NEWLINE") {
          if (!p.nuds.get(p.current.type)) { break; }
          args.push(parseExpression(p, 70, true));
        }
        if (args.length > 0) {
          left = p.makeNode("call", { head: left, args });
          continue;
        }
      }
    }

    if (end(p.current)) { break; }
    t = p.advance();

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
