# Spoon Language Syntax and Parsing

## The Parser
The language will be parsed by Pratt parser that will be extensible, including being extensible from the language itself, using parselets.

The primary form of extension will be the adding of new keywords that can be placed at the head of a statement. Everything that follows the keyword will be parsed by a custom parser.

If the user defines a symbol whose name clashes with a keyword, the keyword is disabled in the scope of that symbol. This prevents extensions from breaking existing code.

## Logical Lines
The language consists of physical lines, each ending with a newline character (one will be inserted after the last line if it's missing in the file). These physical lines are grouped into logical lines according to the following rule: a logical line continues so long as subsequent lines are more indented than the first physical line of the logical line, or there are open parentheses that have not yet been closed. Blank lines (i.e. lines with only whitespace) are ignored.

```
if x then # logical line 1
  y       # continuation of logical line 1 (indented)
z         # logical line 2

if (x <   # logical line 1
y) then z # continuation of logical line 1 (open parens)

if (x <   # logical line 1
  y) then z # continuation of logical line 1 (open parens AND indent)
```

The indent level of a logical line is equal to the number of spaces used to indent the first physical line of the logical line. Tabs are forbidden. A logical line mut have the same indent as the preceeding logical line. Line continuations must be more indented (unless there are open parens), but they can individually be freely indented to any level beyond that. Unlike python, there is no stack of indents that lines must conform too.

Logical lines can be nested by introducing a statement block. Statement blocks are valid in some statements (e.g. the consequent of an IF expression). A statement block is introduced by terminating a physical line with a colon. The following physical line must be more indented than logical line that contains it. It begins a new logical line nested withing the outer logical line. The statement block continues until a physical line is encountered with less indent that the logical lines of the statement block. This subsequent line may still be part of the outer logical line if the conditions still hold.

```
if x then: # logical line 1, introducing a statement block
  foo      # nested logical line 1
  bar      # nested logical line 2
    baz    # nested logical line 2 continuation (last in block)
 quux      # logical line 1 continuation
barney     # logical line 2
```

Statement blocks (and logical lines) can be nested to any level.

A hash introduces a line comment, which lasts until the end of the physical line.

## Statements
Each logical line contains exactly one statement, although that statement may be made up of many sub-statements and statement blocks.

Statements either begin with a keyword (which invokes the relevant statement parselet) or they are an expression.

Expressions consist of numbers, strings, variables, operators, member access, function calls, symbol bindings and expression keywords (e.g. IF is a keyword introducing a conditional expression). Statement blocks may also form parts of expressions if the syntax allows (e.g. an IF expression can contain a statement block). The usual arithmetic, comparison and logical operators are supported. Equality is represented by single equals (there is no double equals). Keywords "and", "or" and "not" are used as logical operators. Member access uses an infix dot between an expression and a member name (an identifier).

A symbol binding consists of an identifier, followed by a colon, and then an expression for the value. Then optionally there may be a comma followed by another binding, recursively. The interpretation of a symbol binding nested in an expression is that the binding returns the value but also binds it to a symbol as a side-effect. The scope of the binding is from the point immediately following the symbol binding expression (including the remainder of any containing expression) until the end of the containing statement block or program. Example:

```
x + z: (y * x) + z # the value of (y * x) is bound to z and used later in the same expression.
```

Everywhere a statement block may occur, it's valid to use a single statement instead. This is indicated by not putting a colon and placing the statement on the same logical line. The following are equivalent:

```
if x then:
  y

if x then y
```

Note that some keywords may wish to parse the contents of the statement block differently. An example keyword:

```
match e:
  Lit x -> x
  Add x y -> x + y
  Mul x y -> x * y
```

In this case the keyword is "match" and the statement block consists of three lines that will be parsed by the match keyword's parselet.

Any statement or expression (including sub-statements and sub-expressions) may be surrounded by parentheses for the purpose of grouping and formatting.

## Function Calls

Function calls are a kind of expression. Each function has one or more signatures, but the parser may not necessarily know them at parse time. Signatures may be registered with the parser by some statements (such as those defining functions).

A function call consists of a head followed by an argument section. The head is either a symbol (naming a function value), a member access or an expression in parentheses that evaluates to a function.

Function calls are denoted by the juxtaposition of a head with arguments, all separated by whitespace. Example function calls:

```
foo 1 5 x -verbose true # a call with 4 arguments, 3 positional and one named
x.foo blah              # call of a member function
(foo x) y               # the parenthesised expression (foo x) evaluates to a function that is called on x
```
 
If a function takes no arguments, the "()" zero-argument function call suffix may be used to call it.

```
foo ()
```

Member access binds more tightly than any other operator, followed by the () operator and then function application to arguments. Everything else is lower. So "foo 5 + 3" is interpreted as "(foo 5) + 3". To nest function calls, parens must be used, except in the zero-argument case:

```
foo bar x     # bar and x are arguments to foo
foo (bar x)   # nested call to bar
foo bar ()    # nested call to bar
```

Function call arguments may be positional or named. Positional arguments must preceed named arguments. Named arguments use a name preceeded by a dash (called a flag), followed by the value. For boolean arguments, the value may be omitted, which is equivalent to passing true (this is called a switch argument). For enum arguments, the syntax "-argname:enumval" may be used to pass an enum literal whose enum type can be inferred from the signature. The enum syntax is not valid if there is no known signature for the function.

```
foo x -verbose true -unsafe -loglevel:warn # a function call with a positional, named, switch and enum args
```

More examples:

```
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
x.foo y # a function call using a member function and one argument
(foo x) y # evaluate foo x first, then call the result with argument y
(foo ()) y # evaluate foo () first, then call the result with argument y
foo -verbose true x # invalid, positional arguments must precede named arguments
() # invalid, () must follow a head
foo () x # invalid, () cannot be mixed with arguments
foo x () # valid, x () is a nested function call and foo takes the result as a parameter
foo -verbose bar () # valid, the () groups with bar to make a nested function call
foo -verbose bar () -switch:on # valid, the () groups with bar and -switch:on groups with foo
foo -verbose bar -switch:on # valid, bar is used as a value not a function call
foo -verbose bar x -switch:on # invalid, "bar x" is not in parens so it isn't a function call, so bar and x must be passed to foo, but x is passed as a positional argument following a named argument which is invalid
foo -verbose (bar x) -switch:on # valid, with a nested function call to bar
foo () () # invalid, foo () is not a symbol or member access and therefore should be in parens
(foo ()) () # valid, call foo with no arguments then call the result with no arguments
```

## Signatures
Signatures contain the list of valid parameters and the parser must validate them if it knows a signature for the function at parse time. There is no requirement for the parser to validate the arguments in cases where it doesn't know any signature.

Parameters may be optional or required according to the signature. They may also be positional or named. Optional positional parameters may not preceed required positional parameters. It is valid to pass a positional parameter as if it were a named parameter, but not vice versa. Named arguments are bound first and then remaining positional parameters are filled from left to right using the unnamed arguments.

The signature may specify that a parameter only accepts a specified list of values. This defines an anonymous enum and the value may be passed using the enum argument syntax.

## Extension
As parselets can be used to add everything else (including functions and signature definitions) this is enough for now.

## Type Annotations
A type annotation consists of a type identifier surrounded by curly brackets. Type annotations can be placed after the LHS of a symbol binding or after a parameter name in a function declaration. Examples:

```
x {number}: 5
y {string}: "hello"
def foo x {number}, y {number} => x + y
x {expr number}: sum(5, 6) # an example of a polymorphic type with a type parameter
```

Type annotations are generally optional, although they may be necessary to disambiguate the different instances of a generic function.
