const callBp = 70;

export function parseExpression(p, rbp, forbidCalls) {
  let t = p.advance();

  const end = t => p.isDelimiter(t) || rbp >= getLbp(p, t);
  const endOfArgs = () => p.isDelimiter(p.current) || p.current.type === "NEWLINE";

  const nud = p.nuds.get(t.type);
  if (!nud) {
    throw p.syntaxError(t, `Expression cannot begin with ${t.type}`);
  }

  let left = nud(p, t);

  while (true) {
    t = p.current;
    if (p.isDelimiter(t)) { break; }

    // Is this a valid function call head?
    if (!forbidCalls && (left.type == "identifier" || left.type === "member access" || left.grouped)) {
      if (p.current.type === "()") {
        p.advance();
        left = p.makeNode("call", { head: left, args: [] });
      } else {
        const args = [];
        let pos = 0;

        while (!endOfArgs() && p.current.type != "FLAG") {
          if (!p.nuds.get(p.current.type)) { break; }
          const arg = p.current;
          args.push(p.makeNode("positional", { pos, value: parseExpression(p, callBp, true) }, arg));
          ++pos;
        }

        while (!endOfArgs() && p.current.type === "FLAG") {
          const name = p.advance();
          if (endOfArgs() || p.current.type === "FLAG") {
            // switch
            args.push(p.makeNode("switch", { name: name.value }, name));
          } else if (p.current.type === ":") {
            // enum
            p.advance();
            if (p.current.type != "IDENT") {
              // TODO: can check against the signature for valid value too
              throw p.syntaxError(p.current, "Enum expected");
            }
            args.push(p.makeNode("enum", { name: name.value, value: p.current.value }, name));
            p.advance();
          } else {
            // normal named argument
            args.push(p.makeNode(
              "named",
              { name: name.value, value: parseExpression(p, callBp, true)},
              name));
          }
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
