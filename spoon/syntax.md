# Language Syntax and Parsing
The language will be parsed by Pratt parser that will be extensible, including being extensible from the language itself, using parselets.

The primary form of extension will be the adding of new keywords that can be placed at the head of a statement. Everything that follows the keyword will be parsed by a custom parser.

If the user defines a symbol whose name clashes with a keyword, the keyword is disabled in the scope of that symbol.

The language consists of statements delimited by newlines. A block of statements is introduced by ending the previous line with a colon and then using the offside rule to determine where it ends. An example:

```
if x > y then:
  do-something
  do-something-else
this-always runs
```

The first three lines form a single statement that includes a statement block of two lines. The last line is the next statement.

A single statement can be used in place of a statement block.

```
if x > y then do-something
```

Note that some keywords may wish to parse the contents of the statement block differently. An example keyword:

```
match e:
  Lit x -> x
  Add x y -> x + y
  Mul x y -> x * y
```

In this case the keyword is "match" and the statement block consists of three lines that will be parsed by the match keyword's parselet. This is considered a single statement as before.

Expressions are a subset of statements.

Function calls are a kind of expression. Each function has one or more signatures, but the parser may not necessarily know them at parse time. Signatures may be registered with the parser by some statements (such as those defining functions).

A function call consists of a head followed an argument section. The head is either a symbol (naming a function value), a member access or an expression that evaluates to a function. The arguments section consists either:

1. Arguments separated by spaces
2. Arguments separated by commas (with optional whitespace)
3. The () operator, which is a postfix operator indicating a function call with zero arguments. Whitespace in the () is acceptable.

If a function has a single argument then consider that case 1 (separated by spaces). Only assume case 2 when there is an actual comma present.

Function calls can be optionally delimited by parentheses.

It is not valid to use comma separated arguments in a nested function call unless the nested call is delimited by parentheses. Always assume commas are associated with the outermost possible function call, stopping the search at parentheses. If this means the outermost function call has a mix of whitespace and comma separation then that's a syntax error.

Signatures contain the list of valid parameters and the parser must validate them if it knows a signature for the function at parse time (there is no requirement for the parser to validate the arguments in cases where it doesn't know any signature).

A member access is a kind of expression. It uses the standard object oriented notation: obj.membername.

A symbol is a kind of expression.

If the head of a function call is an expression other than a symbol or a member access then the head must be delimited by parentheses.

If a function call is nested in another function call then the expression may be ambiguous, as we don't know whether it's a nested function call or we are passing all the parts as arguments to the outer function. In order to denote a valid nested function call, one of the following conditions must be met:

1. The call is a valid head followed by the () operator (this is always unambiguously a function call because () is a function call operator).
2. The call is delimited by parentheses.
3. The call is nested in an expression that uses comma separated arguments, but the nested call does not use comma separated arguments.

If it's not a valid nested function call then the items are just arguments to the parent call.

Arguments are passed by name in a syntax similar to Powershell: "-argname val". The function's signature lists all such arguments. The signature may say some arguments are flags, in which case no value need be passed: "-flagname". The signature may specify that some arguments are positional, in which case they may be optionally passed as positional arguments, but it's still valid to pass them as named arguments. Positional arguments must always come before all other arguments.

Parameters may be optional or required according to the signature.

The signature may specify that a parameter only accepts a specified list of values (an anonymous enum). In this case, a special syntax can be used to pass the value "-argname:enum-value", where enum-value will be interpreted as being from the enum, rather than being interpreted as a normal expression. It is still possible to use the syntax "-argname value" as with an ordinary argument, in which case value is an expression that will be evaluated normally.

Examples:

foo # not a function call, just a variable access
(foo) # not a function call, just a variable access (parens are just for grouping, only empty parens have a special meaning)
((foo)) # again, just a variable access as above
x.foo # not a function call, just a member access
foo () # call a zero-argument function called foo
foo() # identical to previous, the space is optional
x.foo () # call a zero-argument member called foo
foo x # a function call with a positional argument
foo x -verbose true # a function call with a positional and a named argument
(foo x -verbose true) # same as above
x.foo y # a function call using a member function
(foo x) y # evaluate foo x first, then call the result with argument y
(foo ()) y # evaluate foo () first, then call the result with argument y
foo -verbose true x # invalid, positional arguments must precede named arguments
() # invalid, () must follow a head
foo () x # invalid, () cannot be mixed with arguments
foo x () # valid, x () is a nested function call and foo takes the result as a parameter
foo -verbose bar () # valid, the () groups with bar to make a nested function call
foo -verbose bar () -switch:on # valid, the () groups with bar and -switch:on groups with foo
foo -verbose bar -switch:on # valid, bar is used a value not a function call
foo -verbose bar x -switch:on # invalid, "bar x" is not in parens so it isn't a function call, so bar and x must be passed to foo, but x is passed as a positional argument following a named argument which is invalid
foo -verbose (bar x) -switch:on # valid, with a nested function call to bar
foo -verbose bar x, -switch:on # valid, the parameters to foo are comma-separated (commas are always associated with the outermost function call)
foo -verbose (bar x, baz y, z) -switch:on # valid, bar can use comma separation because it is in parens. The commas are not associated with baz because it isn't the outermost function call within the parens.
foo -verbose bar x, y, -switch:on # invalid, nested function calls can't use commas unless they are parens delimited
foo -verbose (bar x, y), -switch:on # valid, the nested call is parens delimited so it may use commas
foo () () # invalid, foo () is not a symbol or member access and therefore should be in parens
(foo ()) () # valid, call foo with no arguments then call the result with no arguments

Numbers, double-quoted strings, arithmetic operators and comparison operators are also expressions as in normal programming languages. They follow the usual precedence rules and may use parentheses in the usual way.

Equality is denoted with a single equals sign, not a double one.

Logical operators can also be used to form expressions. They use these keywords: not, and, or.

As parselets can be used to add everything else (including functions and signature definitions) this is enough for now.

The presence of tabs is a syntax error.
