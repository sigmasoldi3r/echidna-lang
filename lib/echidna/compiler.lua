-- EXPORTED
local __exported__ = {};
local re;
do
  local __target__ = require("lulpeg");
  re = __target__.re;
end
local echidna = re.compile("\r\n  records <- {| {:record: record+ :} |}\r\n  record <- {| field (',' field)* |} (%nl / !.)\r\n  field <- escaped / nonescaped\r\n  nonescaped <- { [^,\"%nl]* }\r\n  escaped <- '\"' {~ ([^\"] / '\"\"' -> '\"')* ~} '\"'\r\n");
local i = echidna:match("a,b,c\r\n1,2,3\r\n4,5,6");
for k, v in pairs(i) do
  print(tostring(k) .. " = " .. tostring(v));
end
return __exported__;
