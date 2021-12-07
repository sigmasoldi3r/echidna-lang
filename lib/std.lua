-- EXPORTED
local __exported__ = {};
local function using(what, target)
  target(what);
  return what;
end
__exported__.using = using;
local function map(mapper)
  return function(iterable)
    local output = { };
    for k, v in pairs(iterable) do
      output[k] = mapper(v, k);
    end
    return output;
  end
end
__exported__.map = map;
local function join(joining)
  return function(iterable)
    return table.concat(iterable, joining);
  end
end
__exported__.join = join;
return __exported__;
