# Spoon Semantics
Spoon is an attempt to integrate the features of imperative, functional, rewrite and object-oriented languages.

## Modules
Every file defines a module. Modules may export and import symbols. There is not such thing as code outside a module.

## Functions
All functions in Spoon are open generic functions. Multiple definitions of a function may be given under the same name and they are all considered cases of the same generic function. If the definition doesn't specify parameter types then it's considered the most generic case (i.e. its parameters are typed as "any").

```
def print x string:
  write x

def print x number:
  # blah blah code

def print x:
  write "[Unknown]"
```

Note that generic functions are considered to exist per module. So adding a new definition extends the generic function in the module where it's defined and in any module that explicitly imports the module. A module may choose to import the same symbol from multiple modules, plus adding its own definitions, in which case the generic function visible in that module is a combination of all of those sources.

Evaluation of arguments is eager left-to-right.

Anonymous functions are created with the expression keyword "fn":

```
fn x: 
  x + 1
```

There are also arrow functions, which provide a one-line syntax:

```
def foo x => x + 1
fn x => x + 1
```

## Objects
OOP is classless. Objects are created similarly to closures: they close over their containing state. They must specify the implementations for the operations they support. Invoking a method is identical to invoking a generic function, as if the method had been automatically added globally as a new case to the generic function.

```
fn makeTriangle x1, y1, x2, y2, x3, y3:
  object
    rotate number angle:
      # blah blah
    transpose number x, number y:
      # blah blah

triange: makeTriangle 1.0, 2.4, 60.3, 2.5, 10.0, 23.4

rotate triange 90 # the generic function "rotate" has had the triangle case added automatically, thanks to the declaration above.
```

Closures and functions can be considered to be objects with a single anonymous method. (It's equally valid to consider object as a kind of closure and closures as a kind of object, as there's no distinction between them other than what methods they support).

## Rewriting
TBD
