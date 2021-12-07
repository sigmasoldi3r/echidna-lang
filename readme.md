# ![Echidna Logo](echidna.png) Echidna Lang

A flexible programming language for the 21st century, targetting the Lua virtual
machine.

This is a work in progress, not even close to a release candidate yet, but you
can check out the `/examples` folder in the mean time.

## Examples

Simple variable assigment in Echidna

```
let a = 5
let s = a += 1
print("s = $s")
```

Builtin class code generation (Without runtime dependencies)

```
-- Practical example of class:
class Foo(let bar = "No name") {
  def shout() {
    let { bar } = self
    print("Hello $bar!")
  }
}

let foo = new Foo("World")
foo:shout()
let unnamed = new Foo()
unnamed:shout()
-- Output:
-- Hello World!
-- Hello No name!
```

Class body and parameters are both optionals in Echidna:

```
class NoBody(let name, let age)
class NoArgs {
  def g() = 2 + 2
}
```

Echidna supports translation of more operators, which expand like macros, and
exported values

```
-- Example of advanced operators
let div = 10 // 3 + 1

export def test() {
  print("Test function! 10 // 3 + 1 = $div")
}
```

Also supports optional expressions, such as optional binary operators, null
coalescence operators, elvis and null-safe-call operators

```
let elvis = may ?? "be with us"
let maybeSum = 1 ?+ mabeTwo
let maybeResult = maybeFunction?()
```

Full support for two different lambda syntaxes: Arrow & Block like lambdas

```
export let implicit = { it // 2 }
let lmbd = { x => return x - 1 }
let lmbd2 = x => x + 1
let lmbd3 = (x, y) => x + y
export let lmbd4 = x => y => x + y -- Curried
```

**Note:** The block syntax will define one parameter called `it`, if no
parameters are specified (Eg: `{}`). If what you want is a true 0-arity
function, you must write `{=>}`, otherwise you'll have an equivalent to
`(it) => {}` in javascript.

This enables the programmer to use implicit parameter constructs, for builder
types, like `some { it:doMore("things") }`.

The block-like lambdas brings us a speciall syntax for calls, where they can
be passed as the last item in the call.

Like `my("target", func) { a => a + 1 } `, this syntax is inspired by _Kotlin_.

This enables the language to support constructs like the ones that `Sphinx`
HTML document builder uses.

_`Sphinx` is a library for HTML rendering that is being built in Echidna_

```
render {
  it:div(new { class: "top-bar" }) {
    it:div(new { class: "top-bar-left" }) {
      it:ul(new { class: "dropdown menu" }) {
        it:li(new { class: "menu-text" }) { "$title" }
        for (_, v <- items |> pairs) {
          let { label, link } = v
          it:li() {
            it:a(new { href: link }) { "$label" }
          }
        }
      }
    }
  }
} |> print
```

Functions are defined with `def`, the body can be either an expression denoted
by `=`, or a block. The parameters can be splitted into multiple braces,
what makes the function partially-applicalbe (Each one makes the function
return another function)

```
-- Normal function definition
def myFunc() {
  print("Hello")
}

-- Expression
def sum(a, b) = a + b

-- Partially applicable
def sum(a)(b) = a + b

-- Example use of partially applicable function
let plusOne = sum(1)
let two = plusOne(1)

-- Also extension functions! (They patch the object)
def extend[string] hello() = "Hello $self!"

let str = "World"
let helloWorld = str:hello()
```

Echidna will come with an optional standard library, which may, or may not be
included with your programs, depending on the needs and requirements of your
environment.

This makes echidna free of any mandatory runtime, enabling your scripts to be
light as pure Lua scripts.

## Future plans

Aside from making a fresh 1.0 release with full functionality, Echidna compiler
is planned to have an abstracted code emitter, so we will be able to plug-in
other backends in the future (Enabling us to create Javascript targets, for
example).
