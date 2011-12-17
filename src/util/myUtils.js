String.prototype.Format = function(format /*,obj1,obj2...*/)
{
    var args = arguments;
    return format.replace(/\{(\d)\}/g, function(m, c) { return args[parseInt(c) + 1] });
};