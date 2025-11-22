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

Function calls are a kind of expression. Each function has a signature, but the parser may not necessarily know it. Signatures may be registered with the parser by some statements (such as those defining functions).

Function calls consist of a head (either a symbol naming the function, a member access, or an expression that evaluates to a function) followed by arguments, all separated by spaces. The signature contains the list of valid parameters and the parser must validate them if it knows the signature of the function at parse time (there is no requirement for the parser to validate the arguments in cases where it doesn't know the signature).

A member access uses the standard object oriented notation: obj.membername

If the head of a function call is an expression then the head must be delimited by parentheses.

Arguments are passed by keyword in a syntax similar to Powershell: "-argname val". The function's signature lists all such arguments. The signature may say some arguments are flags, in which case no value need be passed: "-flagname". The signature may specify that some arguments are positional, in which case they may be optionally passed as positional arguments, but it's still valid to pass them as keyword arguments. Positional arguments must always come before all other arguments.

Parameters may be optional or required according to the signature. By default they are optional.

Function calls may be nested. The parser will use the signatures of the functions to determine which arguments belong to which function call. If this is impossible due to ambiguity or lack of signatures then the user must disambiguate the function call using one of the following methods:
 - Surrounding the function call sub-expression with parentheses.
 - Separating arguments with commas. This is only valid for the top-level function call or a function call sub-expression delimited by parentheses.

The signature may specify that a parameter only accepts a specified list of values (an anonymous enum). In this case, a special syntax can be used to pass the value "-argname:enum-value", where enum-value will be interpreted as being from the enum, rather than being interpreted as a normal expression. It is still possible to use the syntax "-argname value" as with an ordinary argument, in which case value is an expression that will be evaluated normally.

Numbers, double-quoted strings, arithmetic operators and comparison operators are also expressions as in normal programming languages. They follow the usual precedence rules and may use parentheses in the usual way.

Equality is denoted with a single equals sign, not a double one.

Logical operators can also be used to form expressions. They use names rather than symbols: not, and, or.

As parselets can be used to add everything else (including funcions and signature definitions) this is enough for now.

The presence of tabs is a syntax error.
