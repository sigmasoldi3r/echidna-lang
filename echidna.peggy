/**
 * Echidna language project grammar definition.
 */
{
  function L(tag, o = {}) {
    return {tag, ...o, location: location()}
  }
  const UNARY_OPERATORS = {
    '~': '__add',
    'not': '__add',
    'new': '__add',
    '!': '__add',
    '-': '__unm',
    '%': '__mod',
    '+': '__unp',
    '¬': '__unhook',
    '$': '__undollar',
    '#': '__len',
  }
  const BINARY_OPERATORS = {
    // Canon operators
    '+': '__add',
    '-': '__sub',
    '%': '__mod',
    '*': '__mul',
    '/': '__div',
    '..': '__concat',
    '==': '__eq',
    '<=': '__le',
    '<': '__lt',
    // Extended operator set
    '+++': '__tripleadd',
    '++': '__doubleadd',
    '***': '__triplemul',
    '**': '__pow',
    '///': '__tripleslash',
    '>>>': '__triplershift',
    '>>': '__rshift',
    '<<<': '__triplelshift',
    '<<': '__lshift',
    '<|>': '__disjoin',
    '<=>': '__spaceship',
    '=>>': '__farrow',
    '<<=': '__barrow',
    '>=>': '__fdarrow',
    '<=<': '__bdarrow',
    '===': '__tripleeq',
    '!==': '__tripleneq',
    '~==': '__doublecandle',
    '~=': '__candle',
    '~~=': '__litcandle',
    '~~==': '__litdoublecandle',
    'is': '__is',
    '->': '__toleft',
    '~>': '__wavyleft',
    '-->': '__longleft',
    '~~>': '__wavylongleft',
    '<~~': '__wavylongright',
    '<~': '__wavyright',
    '<--': '__longright',
    '<-': '__toright',
    '.-': '__pin',
    '~-': '__righthook',
    '-~': '__lefthook',
    '::': '__append',
  }
}

script =
  statements:(_ @statement)* _
  { return L('script', {statements}) }

// TOP LEVEL //
statement
  = exportStatement
  / returnStatement
  / classStatement
  / tryStatement
  / ifStatement
  / matchStatement
  / forStatement
  / forEachStatement
  / whileStatement
  / variableStatement
  / functionStatement
  / expressionStatement
  / decoratedStatement

// STATEMENTS //
decoratedStatement
  = decorators:(@decorator _)+ statement:declaration
  { return L('decoratedStatement', {decorators, statement}) }

declaration
  = classStatement
  / variableStatement
  / functionStatement
  / exportStatement

exportStatement
  = EXPORT defaults:(__ @DEFAULT)? __ statement:declaration
  { return L('export', {defaults, statement}) }

expressionStatement
  = expr:expression (EOL / &(_ '}'))
  { return L('expressionStatement', {expr}) }

returnStatement
  = RETURN _ expr:expression
  { return L('return', {expr}) }

classStatement
  = def:classExpression
  { return L('classStatement', {def}) }

operatorDef
  = OPERATOR _ op:(
    ADDITIVE_OPERATOR
    / PRODUCT_OPERATOR
    / COMPARISON_OPERATOR
    / LOGIC_OPERATOR
    / SPECIAL_OPERATOR
  ) { return L('operator', {op}) }

functionStatement
  = DEF
  pure:(__ @PURE)?
  stat:(__ @STATIC)?
  extension:(__ EXTEND '[' _ @expression _ ']')?
  __ nameDef:(@operatorDef / @name)
  _ args:('(' @argumentList ')')+
  _ body:(('{' @script '}') / ('=' _ @expression))
  {
    let name = nameDef
    if (nameDef.tag === 'operator') {
      const value = BINARY_OPERATORS[nameDef.op]
      if (value == null) {
        throw new Error(`Not a valid operator: ${nameDef.op ?? '<ERROR>'}`)
      }
      name = { ...nameDef, tag: 'name', value }
    }
    return L('def', {pure, stat, extension, name, args, body})
  }

codeBlock
  = '{' @script '}'
  / @expressionStatement

variableStatement
  = LET mut:(__ @MUT)? __ name:(name / objectDestructure / arrayDestructure)
  init:(_ EQ _ @expression)?
  { return L('let', {mut, init, name}) }

tryStatement
  = TRY _ body:expression
  catchBody:(_ CATCH __ t:name _ b:codeBlock { return {target: t, body: b} })?
  finallyBody:(_ FINALLY _ @codeBlock)?
  { return L('tryStatement', { body, catchBody, finallyBody }) }

ifStatement
  = IF _ '(' _ test:expression _ ')' _ body:codeBlock
  elseIf:(_ ELSE __ IF _ '(' _ t:expression _ ')' _ b:codeBlock { return {test: t, body: b} })*
  elseBody:(_ ELSE _ @codeBlock)?
  { return L('ifStatement', {test, body, elseIf, elseBody}) }

matchStatement
  = MATCH _ '(' _ match:expression _ ')'
  _ '{'
  cases:(_ test:expression _ '=>' _ body:(('{' @script '}') / (@expression)) { return {test, body} })*
  '}'
  { return L('matchStatement', {match, cases}) }

forEachStatement
  = FOR _ '(' _ targets:nameList _ '<-' _ expr:expression _ ')' _ body:codeBlock
  { return L('forEachStatement', {targets, expr, body}) }

forStatement
  = FOR _ '(' _ init:statement? test:(';' @(_ @expression)? _)? increment:(';' @(_ @expression) _)? _ ')'
  _ body:codeBlock
  { return L('forStatement', {init, test, increment, body}) }

whileStatement
  = WHILE _ '(' _ test:expression _ ')' _ body:codeBlock
  { return L('whileStatement', {test, body}) }

// EXPRESSIONS //
expression "Expression"
  = lambdaExpression
  / assignExpression

assignExpression
  = left:additiveExpression _ elvis:elvis? op:ASSIGN_OPERATOR? EQ _ right:additiveExpression
  { return L('assign', {left, op, elvis, right}) }
  / additiveExpression

additiveExpression
  = left:productExpression _ elvis:elvis? op:ADDITIVE_OPERATOR _ right:additiveExpression
  { return L('binary', {left, op, elvis, right}) }
  / productExpression

productExpression
  = left:comparisonExpression _ elvis:elvis? op:PRODUCT_OPERATOR _ right:productExpression
  { return L('binary', {left, op, elvis, right}) }
  / comparisonExpression

comparisonExpression
  = left:logicExpression _ elvis:elvis? op:COMPARISON_OPERATOR _ right:comparisonExpression
  { return L('binary', {left, op, elvis, right}) }
  / logicExpression

logicExpression
  = left:specialExpression _ elvis:elvis? op:LOGIC_OPERATOR _ right:logicExpression
  { return L('binary', {left, op, elvis, right}) }
  / specialExpression

specialExpression
  = left:unaryExpression _ elvis:elvis? op:SPECIAL_OPERATOR _ right:specialExpression
  { return L('binary', {left, op, elvis, right}) }
  / unaryExpression

unaryExpression
  = op:UNARY_OPERATOR _ elvis:elvis? expr:unaryExpression
  { return L('unary', {op, elvis, expr}) }
  / pipeExpression

pipeExpression
  = left:accessExpression _ elvis:elvis? op:PIPELINE_OPERATORS _ right:pipeExpression
  { return L('pipe', {left, op, elvis, right}) }
  / accessExpression

callExpression
  = target:term
  elvis:(_ @elvis)?
  args:(_ '(' @expressionList? _ ')')
  last:(_ @bracketedLambdaExpression)?
  {
    if (last != null) {
      args.push(last)
    }
    return L('call', {args, elvis, target})
  }
  / target:term
  elvis:(_ @elvis)?
  last:(_ @bracketedLambdaExpression)
  { return L('call', {args: [last], elvis, target}) }
  / term

accessExpression
  = left:arrayAccessExpression _ op:(':'/'.') _ right:accessExpression
  { return L('access', {left, op, right}) }
  / arrayAccessExpression

arrayAccessExpression
  = head:callExpression _ '[' _ term:expression _ ']'
  { return L('arrayAccess', {head, term}) }
  / callExpression

objectExpression
  = NEW _ '{' pairs:pairs _ '}'
  { return L('object', {pairs}) }

arrayExpression
  = '[' elements:expressionList _ ']'
  { return L('array', {elements}) }

spreadExpression
  = '...'
  { return L('spreadExpression', {}) }

term
  = spreadExpression
  / numberLiteral
  / objectExpression
  / arrayExpression
  / notImplementedExpression
  / throwExpression
  / stringLiteral
  / classExpression
  / name
  / '(' _ expr:expression _ ')' { return L('expressionBraces', {expr}) }

// EXPRESSION TYPES & literals //
nameList
  = names:(_ h:name t:(',' _ @name)* { return [h, ...t] })?
  { return names ?? [] }

objectDestructure
  = '{' names:nameList _ '}'
  { return L('objectDestructure', {names}) }

arrayDestructure
  = '[' names:nameList _ ']'
  { return L('arrayDestructure', {names}) }

classExpression "Class expression"
  = CLASS name:(__ @name)?
  primary:(_ @classConstructor)?
  parent:(_ ':' _ @expression)?
  body:(_ @classBody)?
  { return L('class', {name, primary, body, parent}) }

bracketedLambdaExpression
  = '{' args:(@argumentList _ '=>')? body:script '}'
  { return L('lambda', {args, body}) }

arrowLambdaExpression
  = args:(@('(' @argumentList _ ')') / @name) _ '=>' _ body:(('{' @script '}') / expression)
  { return L('lambda', {args, body}) }

lambdaExpression "Lambda expression"
  = bracketedLambdaExpression
  / arrowLambdaExpression

numberLiteral "Number literal"
  =
  value:
    ( $([0-9]* '.' [0-9]+ ('e' '-'? [0-9]+)?)
    / $([0-9]+)
    / head:[0-9]+ tail:('_' @[0-9]+)
    { return [head, ...tail].join('') }
  ) { return L('number', {value}) }

notImplementedExpression
  = '???'
  { return L('notImplementedExpression', {}) }

throwExpression
  = THROW __ expr:expression
  { return L('throw', {expr}) }

unescapedText
  = value:$('\\"' / (![\"$] .))+
  { return L('text', {value}) }

interpolated
  = '$' @name
  / '${' @expression '}'

stringLiteral "String literal"
  = '"' segments:(interpolated / unescapedText)*  '"'
  { return L('string', {segments}) }

name "Identifier"
  = value:$([_A-Za-z][_0-9A-Za-z]*)
  { return L('name', {value}) }

decorator "Decorator"
  = '@' expr:expression
  { return L('decorator', {expr}) }

// EXPRESSION PARTS //
constructorParam
  = field:LET? _ name:name init:(_ EQ _ @expression)?
  { return L('param', {field, name, init}) }

classConstructor "Class constructor"
  = '('
  _ terms:(
    head:constructorParam tail:(_ ',' _ @constructorParam)*
    { return [head, ...tail] }
   )?
  ')'
  { return terms ?? [] }

functionParam
  = name
  / spreadExpression

argumentList
  = terms:(
    _ head:functionParam tail:(_ ',' _ @functionParam)*
    { return [head, ...tail] }
  )?
  { return terms ?? [] }

objectKey
  = name
  / stringLiteral
  / '[' _ expr:expression _ ']'
  { return L('keyEscape', {expr}) }

pair = _ k:objectKey _ ':' _ v:expression { return {k, v} }
pairs
  = pairs:(h:pair t:(',' @pair)* { return [h, ...t] })?
  { return pairs ?? [] }

expressionList
  = list:(
    _ head:expression tail:(_ ',' _ @expression)*
    { return [head, ...tail] }
  )?
  { return list ?? [] }

classField "Class field"
  = classStatement
  / variableStatement
  / functionStatement
  / decoratedStatement

classBody
  = '{'
  expr:(_ @classField)* _
  '}'
  { return expr ?? [] }

elvis = ('?:' / '??' / '?')

// KEYWORDS //
LET = 'let'
MUT = 'mut'
CLASS = 'class'
DEF = 'def'
IMPORT = 'import'
EXPORT = 'export'
DEFAULT = 'default'
NEW = 'new'
FOR = 'for'
WHILE = 'while'
DO = 'do'
TRY = 'try'
TRYING = 'trying'
FINALLY = 'finally'
WITH = 'with'
CATCH = 'catch'
THROW = 'throw'
IF = 'if'
ELSE = 'else'
THEN = 'then'
MATCH = 'match'
OPERATOR = 'operator'
PURE = 'pure'
RETURN = 'return'
STATIC = 'static'
EXTEND = 'extend'

// OPERATORS (?) //
EQ = '='
SEMI = ';'

UNARY_OPERATOR
  = '~'
  / 'not'
  / 'new'
  / '!'
  / '-'
  / '+'
  / '¬'
  / '$'
  / '#'
ADDITIVE_OPERATOR
  = '+++'
  / '++'
  / '+'
  / '-'
PRODUCT_OPERATOR
  = '***'
  / '**'
  / '*'
  / '///'
  / '//'
  / '/'
  / '>>>'
  / '>>'
  / '<<<'
  / '<<'
  / '<|>'
  / '<=>'
  / '=>>'
  / '<<='
  / '>=>'
  / '<=<'
COMPARISON_OPERATOR
  = '==='
  / '=='
  / '!=='
  / '!='
  / '~=='
  / '~='
  / '~~='
  / '~~=='
  / '>='
  / '<='
  / '>'
  / '<'
  / 'is'
LOGIC_OPERATOR
  = 'and'
  / 'or'
SPECIAL_OPERATOR
  = '->'
  / '~>'
  / '-->'
  / '~~>'
  / '<~~'
  / '<~'
  / '<--'
  / '<-'
  / '.-'
  / '~-'
  / '-~'
  / '..'
  / '::'
  / '??'
PIPELINE_OPERATORS
  = '|>'
  / '<|'
ASSIGN_OPERATOR
  = '+'
  / '..'
  / '**'
  / '*'
  / '-'
  / '//'
  / '/'
  / 'and'
  / 'or'
  / '¬'
  / '%'
  / '|'
  / '&'
  / '::'
  / '?'
  / '$'
  / '#'

// OTHER //
_ = WS*
__ = WS+
BLANK "White space" = [\r\n\t ]
WS = BLANK / COMMENT
EOL "End of statement" = [\t ]* (SEMI / [\r\n])+
COMMENT "Comment" = BLOCK_COMMENT / LINE_COMMENT
LINE_COMMENT = '--' (![\r\n]+ .)* [\r\n]+
BLOCK_COMMENT = '--[[' (!']]' .)* ']]'
