function $defProp(obj, prop, value) {
  Object.defineProperty(obj, prop,
      {value: value, enumerable: false, writable: true, configurable: true});
}
Function.prototype.bind = Function.prototype.bind ||
  function(thisObj) {
    var func = this;
    var funcLength = func.$length || func.length;
    var argsLength = arguments.length;
    if (argsLength > 1) {
      var boundArgs = Array.prototype.slice.call(arguments, 1);
      var bound = function() {
        // Prepend the bound arguments to the current arguments.
        var newArgs = Array.prototype.slice.call(arguments);
        Array.prototype.unshift.apply(newArgs, boundArgs);
        return func.apply(thisObj, newArgs);
      };
      bound.$length = Math.max(0, funcLength - (argsLength - 1));
      return bound;
    } else {
      var bound = function() {
        return func.apply(thisObj, arguments);
      };
      bound.$length = funcLength;
      return bound;
    }
  };
function $throw(e) {
  // If e is not a value, we can use V8's captureStackTrace utility method.
  // TODO(jmesserly): capture the stack trace on other JS engines.
  if (e && (typeof e == 'object') && Error.captureStackTrace) {
    // TODO(jmesserly): this will clobber the e.stack property
    Error.captureStackTrace(e, $throw);
  }
  throw e;
}
$defProp(Object.prototype, '$index', function(i) {
  $throw(new NoSuchMethodException(this, "operator []", [i]));
});
$defProp(Array.prototype, '$index', function(index) {
  var i = index | 0;
  if (i !== index) {
    throw new IllegalArgumentException('index is not int');
  } else if (i < 0 || i >= this.length) {
    throw new IndexOutOfRangeException(index);
  }
  return this[i];
});
$defProp(String.prototype, '$index', function(i) {
  return this[i];
});
$defProp(Object.prototype, '$setindex', function(i, value) {
  $throw(new NoSuchMethodException(this, "operator []=", [i, value]));
});
$defProp(Array.prototype, '$setindex', function(index, value) {
  var i = index | 0;
  if (i !== index) {
    throw new IllegalArgumentException('index is not int');
  } else if (i < 0 || i >= this.length) {
    throw new IndexOutOfRangeException(index);
  }
  return this[i] = value;
});
function $add$complex$(x, y) {
  if (typeof(x) == 'number') {
    $throw(new IllegalArgumentException(y));
  } else if (typeof(x) == 'string') {
    var str = (y == null) ? 'null' : y.toString();
    if (typeof(str) != 'string') {
      throw new Error("calling toString() on right hand operand of operator " +
      "+ did not return a String");
    }
    return x + str;
  } else if (typeof(x) == 'object') {
    return x.$add(y);
  } else {
    $throw(new NoSuchMethodException(x, "operator +", [y]));
  }
}

function $add$(x, y) {
  if (typeof(x) == 'number' && typeof(y) == 'number') return x + y;
  return $add$complex$(x, y);
}
function $eq$(x, y) {
  if (x == null) return y == null;
  return (typeof(x) != 'object') ? x === y : x.$eq(y);
}
// TODO(jimhug): Should this or should it not match equals?
$defProp(Object.prototype, '$eq', function(other) {
  return this === other;
});
function $mod$(x, y) {
  if (typeof(x) == 'number') {
    if (typeof(y) == 'number') {
      var result = x % y;
      if (result == 0) {
        return 0;  // Make sure we don't return -0.0.
      } else if (result < 0) {
        if (y < 0) {
          return result - y;
        } else {
          return result + y;
        }
      }
      return result;
    } else {
      $throw(new IllegalArgumentException(y));
    }
  } else if (typeof(x) == 'object') {
    return x.$mod(y);
  } else {
    $throw(new NoSuchMethodException(x, "operator %", [y]));
  }
}
function $ne$(x, y) {
  if (x == null) return y != null;
  return (typeof(x) != 'object') ? x !== y : !x.$eq(y);
}
function $sub$complex$(x, y) {
  if (typeof(x) == 'number') {
    $throw(new IllegalArgumentException(y));
  } else if (typeof(x) == 'object') {
    return x.$sub(y);
  } else {
    $throw(new NoSuchMethodException(x, "operator -", [y]));
  }
}
function $sub$(x, y) {
  if (typeof(x) == 'number' && typeof(y) == 'number') return x - y;
  return $sub$complex$(x, y);
}
function $truncdiv$(x, y) {
  if (typeof(x) == 'number') {
    if (typeof(y) == 'number') {
      if (y == 0) $throw(new IntegerDivisionByZeroException());
      var tmp = x / y;
      return (tmp < 0) ? Math.ceil(tmp) : Math.floor(tmp);
    } else {
      $throw(new IllegalArgumentException(y));
    }
  } else if (typeof(x) == 'object') {
    return x.$truncdiv(y);
  } else {
    $throw(new NoSuchMethodException(x, "operator ~/", [y]));
  }
}
$defProp(Object.prototype, '$typeNameOf', (function() {
  function constructorNameWithFallback(obj) {
    var constructor = obj.constructor;
    if (typeof(constructor) == 'function') {
      // The constructor isn't null or undefined at this point. Try
      // to grab hold of its name.
      var name = constructor.name;
      // If the name is a non-empty string, we use that as the type
      // name of this object. On Firefox, we often get 'Object' as
      // the constructor name even for more specialized objects so
      // we have to fall through to the toString() based implementation
      // below in that case.
      if (typeof(name) == 'string' && name && name != 'Object') return name;
    }
    var string = Object.prototype.toString.call(obj);
    return string.substring(8, string.length - 1);
  }

  function chrome$typeNameOf() {
    var name = this.constructor.name;
    if (name == 'Window') return 'DOMWindow';
    if (name == 'CanvasPixelArray') return 'Uint8ClampedArray';
    return name;
  }

  function firefox$typeNameOf() {
    var name = constructorNameWithFallback(this);
    if (name == 'Window') return 'DOMWindow';
    if (name == 'Document') return 'HTMLDocument';
    if (name == 'XMLDocument') return 'Document';
    if (name == 'WorkerMessageEvent') return 'MessageEvent';
    return name;
  }

  function ie$typeNameOf() {
    var name = constructorNameWithFallback(this);
    if (name == 'Window') return 'DOMWindow';
    // IE calls both HTML and XML documents 'Document', so we check for the
    // xmlVersion property, which is the empty string on HTML documents.
    if (name == 'Document' && this.xmlVersion) return 'Document';
    if (name == 'Document') return 'HTMLDocument';
    if (name == 'HTMLTableDataCellElement') return 'HTMLTableCellElement';
    if (name == 'HTMLTableHeaderCellElement') return 'HTMLTableCellElement';
    if (name == 'MSStyleCSSProperties') return 'CSSStyleDeclaration';
    return name;
  }

  // If we're not in the browser, we're almost certainly running on v8.
  if (typeof(navigator) != 'object') return chrome$typeNameOf;

  var userAgent = navigator.userAgent;
  if (/Chrome|DumpRenderTree/.test(userAgent)) return chrome$typeNameOf;
  if (/Firefox/.test(userAgent)) return firefox$typeNameOf;
  if (/MSIE/.test(userAgent)) return ie$typeNameOf;
  return function() { return constructorNameWithFallback(this); };
})());
$defProp(Object.prototype, "get$typeName", Object.prototype.$typeNameOf);
/** Implements extends for Dart classes on JavaScript prototypes. */
function $inherits(child, parent) {
  if (child.prototype.__proto__) {
    child.prototype.__proto__ = parent.prototype;
  } else {
    function tmp() {};
    tmp.prototype = parent.prototype;
    child.prototype = new tmp();
    child.prototype.constructor = child;
  }
}
function $dynamic(name) {
  var f = Object.prototype[name];
  if (f && f.methods) return f.methods;

  var methods = {};
  if (f) methods.Object = f;
  function $dynamicBind() {
    // Find the target method
    var obj = this;
    var tag = obj.$typeNameOf();
    var method = methods[tag];
    if (!method) {
      var table = $dynamicMetadata;
      for (var i = 0; i < table.length; i++) {
        var entry = table[i];
        if (entry.map.hasOwnProperty(tag)) {
          method = methods[entry.tag];
          if (method) break;
        }
      }
    }
    method = method || methods.Object;

    var proto = Object.getPrototypeOf(obj);

    if (method == null) {
      // Trampoline to throw NoSuchMethodException (TODO: call noSuchMethod).
      method = function(){
        // Exact type check to prevent this code shadowing the dispatcher from a
        // subclass.
        if (Object.getPrototypeOf(this) === proto) {
          // TODO(sra): 'name' is the jsname, should be the Dart name.
          $throw(new NoSuchMethodException(
              obj, name, Array.prototype.slice.call(arguments)));
        }
        return Object.prototype[name].apply(this, arguments);
      };
    }

    if (!proto.hasOwnProperty(name)) {
      $defProp(proto, name, method);
    }

    return method.apply(this, Array.prototype.slice.call(arguments));
  };
  $dynamicBind.methods = methods;
  $defProp(Object.prototype, name, $dynamicBind);
  return methods;
}
if (typeof $dynamicMetadata == 'undefined') $dynamicMetadata = [];
function $dynamicSetMetadata(inputTable) {
  // TODO: Deal with light isolates.
  var table = [];
  for (var i = 0; i < inputTable.length; i++) {
    var tag = inputTable[i][0];
    var tags = inputTable[i][1];
    var map = {};
    var tagNames = tags.split('|');
    for (var j = 0; j < tagNames.length; j++) {
      map[tagNames[j]] = true;
    }
    table.push({tag: tag, tags: tags, map: map});
  }
  $dynamicMetadata = table;
}
$defProp(Object.prototype, "get$dynamic", function() {
  "use strict"; return this;
});
$defProp(Object.prototype, "noSuchMethod", function(name, args) {
  $throw(new NoSuchMethodException(this, name, args));
});
$defProp(Object.prototype, "$dom_addEventListener$3", function($0, $1, $2) {
  return this.noSuchMethod("$dom_addEventListener", [$0, $1, $2]);
});
$defProp(Object.prototype, "$dom_removeEventListener$3", function($0, $1, $2) {
  return this.noSuchMethod("$dom_removeEventListener", [$0, $1, $2]);
});
$defProp(Object.prototype, "add$1", function($0) {
  return this.noSuchMethod("add", [$0]);
});
$defProp(Object.prototype, "clear$0", function() {
  return this.noSuchMethod("clear", []);
});
$defProp(Object.prototype, "close$0", function() {
  return this.noSuchMethod("close", []);
});
$defProp(Object.prototype, "contains$1", function($0) {
  return this.noSuchMethod("contains", [$0]);
});
$defProp(Object.prototype, "end$0", function() {
  return this.noSuchMethod("end", []);
});
$defProp(Object.prototype, "error$2", function($0, $1) {
  return this.noSuchMethod("error", [$0, $1]);
});
$defProp(Object.prototype, "filter$1", function($0) {
  return this.noSuchMethod("filter", [$0]);
});
$defProp(Object.prototype, "forEach$1", function($0) {
  return this.noSuchMethod("forEach", [$0]);
});
$defProp(Object.prototype, "is$Collection", function() {
  return false;
});
$defProp(Object.prototype, "is$List", function() {
  return false;
});
$defProp(Object.prototype, "is$Map", function() {
  return false;
});
$defProp(Object.prototype, "is$RegExp", function() {
  return false;
});
$defProp(Object.prototype, "is$html_Element", function() {
  return false;
});
$defProp(Object.prototype, "postMessage$1", function($0) {
  return this.noSuchMethod("postMessage", [$0]);
});
$defProp(Object.prototype, "query$1", function($0) {
  return this.noSuchMethod("query", [$0]);
});
$defProp(Object.prototype, "remove$0", function() {
  return this.noSuchMethod("remove", []);
});
$defProp(Object.prototype, "send$2", function($0, $1) {
  return this.noSuchMethod("send", [$0, $1]);
});
$defProp(Object.prototype, "sort$1", function($0) {
  return this.noSuchMethod("sort", [$0]);
});
$defProp(Object.prototype, "start$0", function() {
  return this.noSuchMethod("start", []);
});
$defProp(Object.prototype, "test$0", function() {
  return this.noSuchMethod("test", []);
});
function IndexOutOfRangeException(_index) {
  this._index = _index;
}
IndexOutOfRangeException.prototype.is$IndexOutOfRangeException = function(){return true};
IndexOutOfRangeException.prototype.toString = function() {
  return ("IndexOutOfRangeException: " + this._index);
}
function IllegalAccessException() {

}
IllegalAccessException.prototype.toString = function() {
  return "Attempt to modify an immutable object";
}
function NoSuchMethodException(_receiver, _functionName, _arguments, _existingArgumentNames) {
  this._receiver = _receiver;
  this._functionName = _functionName;
  this._arguments = _arguments;
  this._existingArgumentNames = _existingArgumentNames;
}
NoSuchMethodException.prototype.is$NoSuchMethodException = function(){return true};
NoSuchMethodException.prototype.toString = function() {
  var sb = new StringBufferImpl("");
  for (var i = (0);
   i < this._arguments.get$length(); i++) {
    if (i > (0)) {
      sb.add(", ");
    }
    sb.add(this._arguments.$index(i));
  }
  if (null == this._existingArgumentNames) {
    return (("NoSuchMethodException : method not found: '" + this._functionName + "'\n") + ("Receiver: " + this._receiver + "\n") + ("Arguments: [" + sb + "]"));
  }
  else {
    var actualParameters = sb.toString();
    sb = new StringBufferImpl("");
    for (var i = (0);
     i < this._existingArgumentNames.get$length(); i++) {
      if (i > (0)) {
        sb.add(", ");
      }
      sb.add(this._existingArgumentNames.$index(i));
    }
    var formalParameters = sb.toString();
    return ("NoSuchMethodException: incorrect number of arguments passed to " + ("method named '" + this._functionName + "'\nReceiver: " + this._receiver + "\n") + ("Tried calling: " + this._functionName + "(" + actualParameters + ")\n") + ("Found: " + this._functionName + "(" + formalParameters + ")"));
  }
}
function ClosureArgumentMismatchException() {

}
ClosureArgumentMismatchException.prototype.toString = function() {
  return "Closure argument mismatch";
}
function ObjectNotClosureException() {

}
ObjectNotClosureException.prototype.toString = function() {
  return "Object is not closure";
}
function IllegalArgumentException(arg) {
  this._arg = arg;
}
IllegalArgumentException.prototype.is$IllegalArgumentException = function(){return true};
IllegalArgumentException.prototype.toString = function() {
  return ("Illegal argument(s): " + this._arg);
}
function StackOverflowException() {

}
StackOverflowException.prototype.toString = function() {
  return "Stack Overflow";
}
function BadNumberFormatException(_s) {
  this._s = _s;
}
BadNumberFormatException.prototype.toString = function() {
  return ("BadNumberFormatException: '" + this._s + "'");
}
function NullPointerException(functionName, arguments) {
  this.functionName = functionName;
  this.arguments = arguments;
}
NullPointerException.prototype.toString = function() {
  if (this.functionName == null) {
    return this.get$exceptionName();
  }
  else {
    return (("" + this.get$exceptionName() + " : method: '" + this.functionName + "'\n") + "Receiver: null\n" + ("Arguments: " + this.arguments));
  }
}
NullPointerException.prototype.get$exceptionName = function() {
  return "NullPointerException";
}
function NoMoreElementsException() {

}
NoMoreElementsException.prototype.toString = function() {
  return "NoMoreElementsException";
}
function EmptyQueueException() {

}
EmptyQueueException.prototype.toString = function() {
  return "EmptyQueueException";
}
function UnsupportedOperationException(_message) {
  this._message = _message;
}
UnsupportedOperationException.prototype.toString = function() {
  return ("UnsupportedOperationException: " + this._message);
}
function NotImplementedException() {

}
NotImplementedException.prototype.toString = function() {
  return "NotImplementedException";
}
function IntegerDivisionByZeroException() {

}
IntegerDivisionByZeroException.prototype.is$IntegerDivisionByZeroException = function(){return true};
IntegerDivisionByZeroException.prototype.toString = function() {
  return "IntegerDivisionByZeroException";
}
function Expect() {}
Expect.equals = function(expected, actual, reason) {
  if ($eq$(expected, actual)) return;
  var msg = Expect._getMessage(reason);
  Expect._fail(("Expect.equals(expected: <" + expected + ">, actual: <" + actual + ">" + msg + ") fails."));
}
Expect.isTrue = function(actual, reason) {
  if ((null == actual ? null == (true) : actual === true)) return;
  var msg = Expect._getMessage(reason);
  Expect._fail(("Expect.isTrue(" + actual + msg + ") fails."));
}
Expect.isFalse = function(actual, reason) {
  if ((null == actual ? null == (false) : actual === false)) return;
  var msg = Expect._getMessage(reason);
  Expect._fail(("Expect.isFalse(" + actual + msg + ") fails."));
}
Expect._getMessage = function(reason) {
  return (null == reason) ? "" : (", '" + reason + "'");
}
Expect._fail = function(message) {
  $throw(new ExpectException(message));
}
function ExpectException(message) {
  this.message = message;
}
ExpectException.prototype.toString = function() {
  return this.message;
}
ExpectException.prototype.get$message = function() { return this.message; };
Function.prototype.to$call$0 = function() {
  this.call$0 = this._genStub(0);
  this.to$call$0 = function() { return this.call$0; };
  return this.call$0;
};
Function.prototype.call$0 = function() {
  return this.to$call$0()();
};
function to$call$0(f) { return f && f.to$call$0(); }
Function.prototype.to$call$1 = function() {
  this.call$1 = this._genStub(1);
  this.to$call$1 = function() { return this.call$1; };
  return this.call$1;
};
Function.prototype.call$1 = function($0) {
  return this.to$call$1()($0);
};
function to$call$1(f) { return f && f.to$call$1(); }
Function.prototype.to$call$2 = function() {
  this.call$2 = this._genStub(2);
  this.to$call$2 = function() { return this.call$2; };
  return this.call$2;
};
Function.prototype.call$2 = function($0, $1) {
  return this.to$call$2()($0, $1);
};
function to$call$2(f) { return f && f.to$call$2(); }
function FutureNotCompleteException() {

}
FutureNotCompleteException.prototype.toString = function() {
  return "Exception: future has not been completed";
}
function FutureAlreadyCompleteException() {

}
FutureAlreadyCompleteException.prototype.toString = function() {
  return "Exception: future already completed";
}
function Futures() {}
Futures.wait = function(futures) {
  if (futures.isEmpty()) {
    return FutureImpl.FutureImpl$immediate$factory(const$0019);
  }
  var completer = new CompleterImpl_List();
  var result = completer.get$future();
  var remaining = futures.get$length();
  var values = new Array(futures.get$length());
  for (var i = (0);
   i < futures.get$length(); i++) {
    var pos = i;
    var future = futures.$index(pos);
    future.then((function (pos, value) {
      values.$setindex(pos, value);
      if (--remaining == (0) && !result.get$isComplete()) {
        completer.complete(values);
      }
    }).bind(null, pos)
    );
    future.handleException((function (exception) {
      if (!result.get$isComplete()) completer.completeException(exception);
      return true;
    })
    );
  }
  return result;
}
Math.parseInt = function(str) {
    var match = /^\s*[+-]?(?:(0[xX][abcdefABCDEF0-9]+)|\d+)\s*$/.exec(str);
    if (!match) $throw(new BadNumberFormatException(str));
    var isHex = !!match[1];
    var ret = parseInt(str, isHex ? 16 : 10);
    if (isNaN(ret)) $throw(new BadNumberFormatException(str));
    return ret;
}
function Strings() {}
Strings.join = function(strings, separator) {
  return StringBase.join(strings, separator);
}
function print$(obj) {
  return _print(obj);
}
function _print(obj) {
  if (typeof console == 'object') {
    if (obj) obj = obj.toString();
    console.log(obj);
  } else if (typeof write === 'function') {
    write(obj);
    write('\n');
  }
}
function _toDartException(e) {
  function attachStack(dartEx) {
    // TODO(jmesserly): setting the stack property is not a long term solution.
    var stack = e.stack;
    // The stack contains the error message, and the stack is all that is
    // printed (the exception's toString() is never called).  Make the Dart
    // exception's toString() be the dominant message.
    if (typeof stack == 'string') {
      var message = dartEx.toString();
      if (/^(Type|Range)Error:/.test(stack)) {
        // Indent JS message (it can be helpful) so new message stands out.
        stack = '    (' + stack.substring(0, stack.indexOf('\n')) + ')\n' +
                stack.substring(stack.indexOf('\n') + 1);
      }
      stack = message + '\n' + stack;
    }
    dartEx.stack = stack;
    return dartEx;
  }

  if (e instanceof TypeError) {
    switch(e.type) {
      case 'property_not_function':
      case 'called_non_callable':
        if (e.arguments[0] == null) {
          return attachStack(new NullPointerException(null, []));
        } else {
          return attachStack(new ObjectNotClosureException());
        }
        break;
      case 'non_object_property_call':
      case 'non_object_property_load':
        return attachStack(new NullPointerException(null, []));
        break;
      case 'undefined_method':
        var mname = e.arguments[0];
        if (typeof(mname) == 'string' && (mname.indexOf('call$') == 0
            || mname == 'call' || mname == 'apply')) {
          return attachStack(new ObjectNotClosureException());
        } else {
          // TODO(jmesserly): fix noSuchMethod on operators so we don't hit this
          return attachStack(new NoSuchMethodException('', e.arguments[0], []));
        }
        break;
    }
  } else if (e instanceof RangeError) {
    if (e.message.indexOf('call stack') >= 0) {
      return attachStack(new StackOverflowException());
    }
  }
  return e;
}
function _stackTraceOf(e) {
  return  (e && e.stack) ? e.stack : null;
}
var ListFactory = Array;
$defProp(ListFactory.prototype, "is$List", function(){return true});
$defProp(ListFactory.prototype, "is$Collection", function(){return true});
ListFactory.ListFactory$from$factory = function(other) {
  var list = [];
  for (var $$i = other.iterator(); $$i.hasNext(); ) {
    var e = $$i.next();
    list.add$1(e);
  }
  return list;
}
$defProp(ListFactory.prototype, "get$length", function() { return this.length; });
$defProp(ListFactory.prototype, "set$length", function(value) { return this.length = value; });
$defProp(ListFactory.prototype, "add", function(value) {
  this.push(value);
});
$defProp(ListFactory.prototype, "addAll", function(collection) {
  for (var $$i = collection.iterator(); $$i.hasNext(); ) {
    var item = $$i.next();
    this.add(item);
  }
});
$defProp(ListFactory.prototype, "clear$_", function() {
  this.set$length((0));
});
$defProp(ListFactory.prototype, "removeLast", function() {
  return this.pop();
});
$defProp(ListFactory.prototype, "last", function() {
  return this.$index(this.get$length() - (1));
});
$defProp(ListFactory.prototype, "isEmpty", function() {
  return this.get$length() == (0);
});
$defProp(ListFactory.prototype, "iterator", function() {
  return new ListIterator(this);
});
$defProp(ListFactory.prototype, "toString", function() {
  return Collections.collectionToString(this);
});
$defProp(ListFactory.prototype, "add$1", ListFactory.prototype.add);
$defProp(ListFactory.prototype, "clear$0", ListFactory.prototype.clear$_);
$defProp(ListFactory.prototype, "filter$1", function($0) {
  return this.filter(to$call$1($0));
});
$defProp(ListFactory.prototype, "forEach$1", function($0) {
  return this.forEach(to$call$1($0));
});
$defProp(ListFactory.prototype, "sort$1", function($0) {
  return this.sort(to$call$2($0));
});
function ListIterator(array) {
  this._array = array;
  this._pos = (0);
}
ListIterator.prototype.hasNext = function() {
  return this._array.get$length() > this._pos;
}
ListIterator.prototype.next = function() {
  if (!this.hasNext()) {
    $throw(const$0001);
  }
  return this._array.$index(this._pos++);
}
$inherits(ImmutableList, ListFactory);
function ImmutableList(length) {
  Array.call(this, length);
}
ImmutableList.ImmutableList$from$factory = function(other) {
  return _constList(other);
}
ImmutableList.prototype.get$length = function() {
  return this.length;
}
ImmutableList.prototype.set$length = function(length) {
  $throw(const$0011);
}
ImmutableList.prototype.$setindex = function(index, value) {
  $throw(const$0011);
}
ImmutableList.prototype.sort = function(compare) {
  $throw(const$0011);
}
ImmutableList.prototype.add = function(element) {
  $throw(const$0011);
}
ImmutableList.prototype.addAll = function(elements) {
  $throw(const$0011);
}
ImmutableList.prototype.clear$_ = function() {
  $throw(const$0011);
}
ImmutableList.prototype.removeLast = function() {
  $throw(const$0011);
}
ImmutableList.prototype.toString = function() {
  return Collections.collectionToString(this);
}
ImmutableList.prototype.add$1 = ImmutableList.prototype.add;
ImmutableList.prototype.clear$0 = ImmutableList.prototype.clear$_;
ImmutableList.prototype.sort$1 = function($0) {
  return this.sort(to$call$2($0));
};
function ImmutableMap(keyValuePairs) {
  this._internal = _map(keyValuePairs);
}
ImmutableMap.prototype.is$Map = function(){return true};
ImmutableMap.prototype.$index = function(key) {
  return this._internal.$index(key);
}
ImmutableMap.prototype.isEmpty = function() {
  return this._internal.isEmpty();
}
ImmutableMap.prototype.get$length = function() {
  return this._internal.get$length();
}
ImmutableMap.prototype.forEach = function(f) {
  this._internal.forEach$1(f);
}
ImmutableMap.prototype.getKeys = function() {
  return this._internal.getKeys();
}
ImmutableMap.prototype.getValues = function() {
  return this._internal.getValues();
}
ImmutableMap.prototype.containsKey = function(key) {
  return this._internal.containsKey(key);
}
ImmutableMap.prototype.$setindex = function(key, value) {
  $throw(const$0011);
}
ImmutableMap.prototype.clear$_ = function() {
  $throw(const$0011);
}
ImmutableMap.prototype.remove = function(key) {
  $throw(const$0011);
}
ImmutableMap.prototype.toString = function() {
  return Maps.mapToString(this);
}
ImmutableMap.prototype.clear$0 = ImmutableMap.prototype.clear$_;
ImmutableMap.prototype.forEach$1 = function($0) {
  return this.forEach(to$call$2($0));
};
function JSSyntaxRegExp(pattern, multiLine, ignoreCase) {
  JSSyntaxRegExp._create$ctor.call(this, pattern, $add$(($eq$(multiLine, true) ? "m" : ""), ($eq$(ignoreCase, true) ? "i" : "")));
}
JSSyntaxRegExp._create$ctor = function(pattern, flags) {
  this.re = new RegExp(pattern, flags);
      this.pattern = pattern;
      this.multiLine = this.re.multiline;
      this.ignoreCase = this.re.ignoreCase;
}
JSSyntaxRegExp._create$ctor.prototype = JSSyntaxRegExp.prototype;
JSSyntaxRegExp.prototype.is$RegExp = function(){return true};
JSSyntaxRegExp.prototype.firstMatch = function(str) {
  var m = this._exec(str);
  return m == null ? null : new MatchImplementation(this.pattern, str, this._matchStart(m), this.get$_lastIndex(), m);
}
JSSyntaxRegExp.prototype._exec = function(str) {
  return this.re.exec(str);
}
JSSyntaxRegExp.prototype._matchStart = function(m) {
  return m.index;
}
JSSyntaxRegExp.prototype.get$_lastIndex = function() {
  return this.re.lastIndex;
}
JSSyntaxRegExp.prototype.hasMatch = function(str) {
  return this.re.test(str);
}
JSSyntaxRegExp.prototype.allMatches = function(str) {
  return new _AllMatchesIterable(this, str);
}
JSSyntaxRegExp.prototype.get$_global = function() {
  return new JSSyntaxRegExp._create$ctor(this.pattern, $add$($add$("g", (this.multiLine ? "m" : "")), (this.ignoreCase ? "i" : "")));
}
function MatchImplementation(pattern, str, _start, _end, _groups) {
  this.pattern = pattern;
  this.str = str;
  this._start = _start;
  this._end = _end;
  this._groups = _groups;
}
MatchImplementation.prototype.start = function() {
  return this._start;
}
MatchImplementation.prototype.end = function() {
  return this._end;
}
MatchImplementation.prototype.group = function(groupIndex) {
  return this._groups.$index(groupIndex);
}
MatchImplementation.prototype.$index = function(groupIndex) {
  return this._groups.$index(groupIndex);
}
MatchImplementation.prototype.end$0 = MatchImplementation.prototype.end;
MatchImplementation.prototype.start$0 = MatchImplementation.prototype.start;
function _AllMatchesIterable(_re, _str) {
  this._re = _re;
  this._str = _str;
}
_AllMatchesIterable.prototype.iterator = function() {
  return new _AllMatchesIterator(this._re, this._str);
}
function _AllMatchesIterator(re, _str) {
  this._str = _str;
  this._done = false;
  this._re = re.get$_global();
}
_AllMatchesIterator.prototype.next = function() {
  if (!this.hasNext()) {
    $throw(const$0001);
  }
  var result = this._next;
  this._next = null;
  return result;
}
_AllMatchesIterator.prototype.hasNext = function() {
  if (this._done) {
    return false;
  }
  else if (this._next != null) {
    return true;
  }
  this._next = this._re.firstMatch(this._str);
  if (this._next == null) {
    this._done = true;
    return false;
  }
  else {
    return true;
  }
}
var NumImplementation = Number;
NumImplementation.prototype.hashCode = function() {
  'use strict'; return this & 0x1FFFFFFF;
}
function ExceptionImplementation(msg) {
  this._msg = msg;
}
ExceptionImplementation.prototype.toString = function() {
  return (null == this._msg) ? "Exception" : ("Exception: " + this._msg);
}
function Collections() {}
Collections.collectionToString = function(c) {
  var result = new StringBufferImpl("");
  Collections._emitCollection(c, result, new Array());
  return result.toString();
}
Collections._emitCollection = function(c, result, visiting) {
  visiting.add(c);
  var isList = !!(c && c.is$List());
  result.add(isList ? "[" : "{");
  var first = true;
  for (var $$i = c.iterator(); $$i.hasNext(); ) {
    var e = $$i.next();
    if (!first) {
      result.add(", ");
    }
    first = false;
    Collections._emitObject(e, result, visiting);
  }
  result.add(isList ? "]" : "}");
  visiting.removeLast();
}
Collections._emitObject = function(o, result, visiting) {
  if (!!(o && o.is$Collection())) {
    if (Collections._containsRef(visiting, o)) {
      result.add(!!(o && o.is$List()) ? "[...]" : "{...}");
    }
    else {
      Collections._emitCollection(o, result, visiting);
    }
  }
  else if (!!(o && o.is$Map())) {
    if (Collections._containsRef(visiting, o)) {
      result.add("{...}");
    }
    else {
      Maps._emitMap(o, result, visiting);
    }
  }
  else {
    result.add($eq$(o) ? "null" : o);
  }
}
Collections._containsRef = function(c, ref) {
  for (var $$i = c.iterator(); $$i.hasNext(); ) {
    var e = $$i.next();
    if ((null == e ? null == (ref) : e === ref)) return true;
  }
  return false;
}
function FutureImpl() {
  this._isComplete = false;
  this._exceptionHandled = false;
  this._listeners = [];
  this._exceptionHandlers = [];
}
FutureImpl.FutureImpl$immediate$factory = function(value) {
  var res = new FutureImpl();
  res._setValue(value);
  return res;
}
FutureImpl.prototype.get$value = function() {
  if (!this.get$isComplete()) {
    $throw(new FutureNotCompleteException());
  }
  if (null != this._exception) {
    $throw(this._exception);
  }
  return this._value;
}
FutureImpl.prototype.get$isComplete = function() {
  return this._isComplete;
}
FutureImpl.prototype.get$hasValue = function() {
  return this.get$isComplete() && null == this._exception;
}
FutureImpl.prototype.then = function(onComplete) {
  if (this.get$hasValue()) {
    onComplete(this.get$value());
  }
  else if (!this.get$isComplete()) {
    this._listeners.add(onComplete);
  }
  else if (!this._exceptionHandled) {
    $throw(this._exception);
  }
}
FutureImpl.prototype.handleException = function(onException) {
  if (this._exceptionHandled) return;
  if (this._isComplete) {
    if (this._exception != null) {
      this._exceptionHandled = onException(this._exception);
    }
  }
  else {
    this._exceptionHandlers.add(onException);
  }
}
FutureImpl.prototype._complete = function() {
  this._isComplete = true;
  if (null != this._exception) {
    var $$list = this._exceptionHandlers;
    for (var $$i = $$list.iterator(); $$i.hasNext(); ) {
      var handler = $$i.next();
      if ($eq$(handler.call$1(this._exception), true)) {
        this._exceptionHandled = true;
        break;
      }
    }
  }
  if (this.get$hasValue()) {
    var $$list = this._listeners;
    for (var $$i = $$list.iterator(); $$i.hasNext(); ) {
      var listener = $$i.next();
      listener.call$1(this.get$value());
    }
  }
  else {
    if (!this._exceptionHandled && this._listeners.get$length() > (0)) {
      $throw(this._exception);
    }
  }
}
FutureImpl.prototype._setValue = function(value) {
  if (this._isComplete) {
    $throw(new FutureAlreadyCompleteException());
  }
  this._value = value;
  this._complete();
}
FutureImpl.prototype._setException = function(exception) {
  if (null == exception) {
    $throw(new IllegalArgumentException(null));
  }
  if (this._isComplete) {
    $throw(new FutureAlreadyCompleteException());
  }
  this._exception = exception;
  this._complete();
}
$inherits(FutureImpl_List, FutureImpl);
function FutureImpl_List() {}
function CompleterImpl() {
  this._futureImpl = new FutureImpl();
}
CompleterImpl.prototype.get$future = function() {
  return this._futureImpl;
}
CompleterImpl.prototype.complete = function(value) {
  this._futureImpl._setValue(value);
}
CompleterImpl.prototype.completeException = function(exception) {
  this._futureImpl._setException(exception);
}
$inherits(CompleterImpl_List, CompleterImpl);
function CompleterImpl_List() {
  this._futureImpl = new FutureImpl();
}
function HashMapImplementation() {
  this._numberOfEntries = (0);
  this._numberOfDeleted = (0);
  this._loadLimit = HashMapImplementation._computeLoadLimit((8));
  this._keys = new Array((8));
  this._values = new Array((8));
}
HashMapImplementation.prototype.is$Map = function(){return true};
HashMapImplementation._computeLoadLimit = function(capacity) {
  return $truncdiv$((capacity * (3)), (4));
}
HashMapImplementation._firstProbe = function(hashCode, length) {
  return hashCode & (length - (1));
}
HashMapImplementation._nextProbe = function(currentProbe, numberOfProbes, length) {
  return (currentProbe + numberOfProbes) & (length - (1));
}
HashMapImplementation.prototype._probeForAdding = function(key) {
  var hash = HashMapImplementation._firstProbe(key.hashCode(), this._keys.get$length());
  var numberOfProbes = (1);
  var initialHash = hash;
  var insertionIndex = (-1);
  while (true) {
    var existingKey = this._keys.$index(hash);
    if (null == existingKey) {
      if (insertionIndex < (0)) return hash;
      return insertionIndex;
    }
    else if ($eq$(existingKey, key)) {
      return hash;
    }
    else if ((insertionIndex < (0)) && ((null == const$0000 ? null == (existingKey) : const$0000 === existingKey))) {
      insertionIndex = hash;
    }
    hash = HashMapImplementation._nextProbe(hash, numberOfProbes++, this._keys.get$length());
  }
}
HashMapImplementation.prototype._probeForLookup = function(key) {
  var hash = HashMapImplementation._firstProbe(key.hashCode(), this._keys.get$length());
  var numberOfProbes = (1);
  var initialHash = hash;
  while (true) {
    var existingKey = this._keys.$index(hash);
    if (null == existingKey) return (-1);
    if ($eq$(existingKey, key)) return hash;
    hash = HashMapImplementation._nextProbe(hash, numberOfProbes++, this._keys.get$length());
  }
}
HashMapImplementation.prototype._ensureCapacity = function() {
  var newNumberOfEntries = this._numberOfEntries + (1);
  if (newNumberOfEntries >= this._loadLimit) {
    this._grow(this._keys.get$length() * (2));
    return;
  }
  var capacity = this._keys.get$length();
  var numberOfFreeOrDeleted = capacity - newNumberOfEntries;
  var numberOfFree = numberOfFreeOrDeleted - this._numberOfDeleted;
  if (this._numberOfDeleted > numberOfFree) {
    this._grow(this._keys.get$length());
  }
}
HashMapImplementation._isPowerOfTwo = function(x) {
  return ((x & (x - (1))) == (0));
}
HashMapImplementation.prototype._grow = function(newCapacity) {
  var capacity = this._keys.get$length();
  this._loadLimit = HashMapImplementation._computeLoadLimit(newCapacity);
  var oldKeys = this._keys;
  var oldValues = this._values;
  this._keys = new Array(newCapacity);
  this._values = new Array(newCapacity);
  for (var i = (0);
   i < capacity; i++) {
    var key = oldKeys.$index(i);
    if (null == key || (null == key ? null == (const$0000) : key === const$0000)) {
      continue;
    }
    var value = oldValues.$index(i);
    var newIndex = this._probeForAdding(key);
    this._keys.$setindex(newIndex, key);
    this._values.$setindex(newIndex, value);
  }
  this._numberOfDeleted = (0);
}
HashMapImplementation.prototype.clear$_ = function() {
  this._numberOfEntries = (0);
  this._numberOfDeleted = (0);
  var length = this._keys.get$length();
  for (var i = (0);
   i < length; i++) {
    this._keys.$setindex(i);
    this._values.$setindex(i);
  }
}
HashMapImplementation.prototype.$setindex = function(key, value) {
  var $0;
  this._ensureCapacity();
  var index = this._probeForAdding(key);
  if ((null == this._keys.$index(index)) || ((($0 = this._keys.$index(index)) == null ? null == (const$0000) : $0 === const$0000))) {
    this._numberOfEntries++;
  }
  this._keys.$setindex(index, key);
  this._values.$setindex(index, value);
}
HashMapImplementation.prototype.$index = function(key) {
  var index = this._probeForLookup(key);
  if (index < (0)) return null;
  return this._values.$index(index);
}
HashMapImplementation.prototype.remove = function(key) {
  var index = this._probeForLookup(key);
  if (index >= (0)) {
    this._numberOfEntries--;
    var value = this._values.$index(index);
    this._values.$setindex(index);
    this._keys.$setindex(index, const$0000);
    this._numberOfDeleted++;
    return value;
  }
  return null;
}
HashMapImplementation.prototype.isEmpty = function() {
  return this._numberOfEntries == (0);
}
HashMapImplementation.prototype.get$length = function() {
  return this._numberOfEntries;
}
HashMapImplementation.prototype.forEach = function(f) {
  var length = this._keys.get$length();
  for (var i = (0);
   i < length; i++) {
    var key = this._keys.$index(i);
    if ((null != key) && ((null == key ? null != (const$0000) : key !== const$0000))) {
      f(key, this._values.$index(i));
    }
  }
}
HashMapImplementation.prototype.getKeys = function() {
  var list = new Array(this.get$length());
  var i = (0);
  this.forEach(function _(key, value) {
    list.$setindex(i++, key);
  }
  );
  return list;
}
HashMapImplementation.prototype.getValues = function() {
  var list = new Array(this.get$length());
  var i = (0);
  this.forEach(function _(key, value) {
    list.$setindex(i++, value);
  }
  );
  return list;
}
HashMapImplementation.prototype.containsKey = function(key) {
  return (this._probeForLookup(key) != (-1));
}
HashMapImplementation.prototype.toString = function() {
  return Maps.mapToString(this);
}
HashMapImplementation.prototype.clear$0 = HashMapImplementation.prototype.clear$_;
HashMapImplementation.prototype.forEach$1 = function($0) {
  return this.forEach(to$call$2($0));
};
$inherits(HashMapImplementation_Dynamic$DoubleLinkedQueueEntry_KeyValuePair, HashMapImplementation);
function HashMapImplementation_Dynamic$DoubleLinkedQueueEntry_KeyValuePair() {
  this._numberOfEntries = (0);
  this._numberOfDeleted = (0);
  this._loadLimit = HashMapImplementation._computeLoadLimit((8));
  this._keys = new Array((8));
  this._values = new Array((8));
}
HashMapImplementation_Dynamic$DoubleLinkedQueueEntry_KeyValuePair.prototype.forEach$1 = function($0) {
  return this.forEach(to$call$2($0));
};
$inherits(HashMapImplementation_dart_core_String$dart_core_String, HashMapImplementation);
function HashMapImplementation_dart_core_String$dart_core_String() {
  this._numberOfEntries = (0);
  this._numberOfDeleted = (0);
  this._loadLimit = HashMapImplementation._computeLoadLimit((8));
  this._keys = new Array((8));
  this._values = new Array((8));
}
HashMapImplementation_dart_core_String$dart_core_String.prototype.forEach$1 = function($0) {
  return this.forEach(to$call$2($0));
};
$inherits(HashMapImplementation_dart_core_String$DoubleLinkedQueueEntry_KeyValuePair_dart_core_String$List_TestCase, HashMapImplementation);
function HashMapImplementation_dart_core_String$DoubleLinkedQueueEntry_KeyValuePair_dart_core_String$List_TestCase() {
  this._numberOfEntries = (0);
  this._numberOfDeleted = (0);
  this._loadLimit = HashMapImplementation._computeLoadLimit((8));
  this._keys = new Array((8));
  this._values = new Array((8));
}
$inherits(HashMapImplementation_int$ReceivePort, HashMapImplementation);
function HashMapImplementation_int$ReceivePort() {
  this._numberOfEntries = (0);
  this._numberOfDeleted = (0);
  this._loadLimit = HashMapImplementation._computeLoadLimit((8));
  this._keys = new Array((8));
  this._values = new Array((8));
}
HashMapImplementation_int$ReceivePort.prototype.forEach$1 = function($0) {
  return this.forEach(to$call$2($0));
};
$inherits(HashMapImplementation_int$_IsolateContext, HashMapImplementation);
function HashMapImplementation_int$_IsolateContext() {
  this._numberOfEntries = (0);
  this._numberOfDeleted = (0);
  this._loadLimit = HashMapImplementation._computeLoadLimit((8));
  this._keys = new Array((8));
  this._values = new Array((8));
}
HashMapImplementation_int$_IsolateContext.prototype.forEach$1 = function($0) {
  return this.forEach(to$call$2($0));
};
$inherits(HashMapImplementation_int$_ManagerStub, HashMapImplementation);
function HashMapImplementation_int$_ManagerStub() {
  this._numberOfEntries = (0);
  this._numberOfDeleted = (0);
  this._loadLimit = HashMapImplementation._computeLoadLimit((8));
  this._keys = new Array((8));
  this._values = new Array((8));
}
HashMapImplementation_int$_ManagerStub.prototype.forEach$1 = function($0) {
  return this.forEach(to$call$2($0));
};
function HashSetImplementation() {
  this._backingMap = new HashMapImplementation();
}
HashSetImplementation.prototype.is$Collection = function(){return true};
HashSetImplementation.prototype.clear$_ = function() {
  this._backingMap.clear$_();
}
HashSetImplementation.prototype.add = function(value) {
  this._backingMap.$setindex(value, value);
}
HashSetImplementation.prototype.contains = function(value) {
  return this._backingMap.containsKey(value);
}
HashSetImplementation.prototype.addAll = function(collection) {
  var $this = this;
  collection.forEach$1(function _(value) {
    $this.add(value);
  }
  );
}
HashSetImplementation.prototype.forEach = function(f) {
  this._backingMap.forEach(function _(key, value) {
    f(key);
  }
  );
}
HashSetImplementation.prototype.filter = function(f) {
  var result = new HashSetImplementation();
  this._backingMap.forEach(function _(key, value) {
    if (f(key)) result.add(key);
  }
  );
  return result;
}
HashSetImplementation.prototype.isEmpty = function() {
  return this._backingMap.isEmpty();
}
HashSetImplementation.prototype.get$length = function() {
  return this._backingMap.get$length();
}
HashSetImplementation.prototype.iterator = function() {
  return new HashSetIterator(this);
}
HashSetImplementation.prototype.toString = function() {
  return Collections.collectionToString(this);
}
HashSetImplementation.prototype.add$1 = HashSetImplementation.prototype.add;
HashSetImplementation.prototype.clear$0 = HashSetImplementation.prototype.clear$_;
HashSetImplementation.prototype.contains$1 = HashSetImplementation.prototype.contains;
HashSetImplementation.prototype.filter$1 = function($0) {
  return this.filter(to$call$1($0));
};
HashSetImplementation.prototype.forEach$1 = function($0) {
  return this.forEach(to$call$1($0));
};
$inherits(HashSetImplementation_dart_core_String, HashSetImplementation);
function HashSetImplementation_dart_core_String() {
  this._backingMap = new HashMapImplementation_dart_core_String$dart_core_String();
}
HashSetImplementation_dart_core_String.prototype.add$1 = HashSetImplementation_dart_core_String.prototype.add;
HashSetImplementation_dart_core_String.prototype.contains$1 = HashSetImplementation_dart_core_String.prototype.contains;
function HashSetIterator(set_) {
  this._nextValidIndex = (-1);
  this._entries = set_._backingMap._keys;
  this._advance();
}
HashSetIterator.prototype.hasNext = function() {
  var $0;
  if (this._nextValidIndex >= this._entries.get$length()) return false;
  if ((($0 = this._entries.$index(this._nextValidIndex)) == null ? null == (const$0000) : $0 === const$0000)) {
    this._advance();
  }
  return this._nextValidIndex < this._entries.get$length();
}
HashSetIterator.prototype.next = function() {
  if (!this.hasNext()) {
    $throw(const$0001);
  }
  var res = this._entries.$index(this._nextValidIndex);
  this._advance();
  return res;
}
HashSetIterator.prototype._advance = function() {
  var length = this._entries.get$length();
  var entry;
  var deletedKey = const$0000;
  do {
    if (++this._nextValidIndex >= length) break;
    entry = this._entries.$index(this._nextValidIndex);
  }
  while ((null == entry) || ((null == entry ? null == (deletedKey) : entry === deletedKey)))
}
function _DeletedKeySentinel() {

}
function KeyValuePair(key, value) {
  this.key$_ = key;
  this.value = value;
}
KeyValuePair.prototype.get$value = function() { return this.value; };
KeyValuePair.prototype.set$value = function(value) { return this.value = value; };
function LinkedHashMapImplementation() {
  this._map = new HashMapImplementation_Dynamic$DoubleLinkedQueueEntry_KeyValuePair();
  this._list = new DoubleLinkedQueue_KeyValuePair();
}
LinkedHashMapImplementation.prototype.is$Map = function(){return true};
LinkedHashMapImplementation.prototype.$setindex = function(key, value) {
  if (this._map.containsKey(key)) {
    this._map.$index(key).get$element().set$value(value);
  }
  else {
    this._list.addLast(new KeyValuePair(key, value));
    this._map.$setindex(key, this._list.lastEntry());
  }
}
LinkedHashMapImplementation.prototype.$index = function(key) {
  var entry = this._map.$index(key);
  if (null == entry) return null;
  return entry.get$element().get$value();
}
LinkedHashMapImplementation.prototype.remove = function(key) {
  var entry = this._map.remove(key);
  if (null == entry) return null;
  entry.remove();
  return entry.get$element().get$value();
}
LinkedHashMapImplementation.prototype.getKeys = function() {
  var list = new Array(this.get$length());
  var index = (0);
  this._list.forEach(function _(entry) {
    list.$setindex(index++, entry.key$_);
  }
  );
  return list;
}
LinkedHashMapImplementation.prototype.getValues = function() {
  var list = new Array(this.get$length());
  var index = (0);
  this._list.forEach(function _(entry) {
    list.$setindex(index++, entry.value);
  }
  );
  return list;
}
LinkedHashMapImplementation.prototype.forEach = function(f) {
  this._list.forEach(function _(entry) {
    f(entry.key$_, entry.value);
  }
  );
}
LinkedHashMapImplementation.prototype.containsKey = function(key) {
  return this._map.containsKey(key);
}
LinkedHashMapImplementation.prototype.get$length = function() {
  return this._map.get$length();
}
LinkedHashMapImplementation.prototype.isEmpty = function() {
  return this.get$length() == (0);
}
LinkedHashMapImplementation.prototype.clear$_ = function() {
  this._map.clear$_();
  this._list.clear$_();
}
LinkedHashMapImplementation.prototype.toString = function() {
  return Maps.mapToString(this);
}
LinkedHashMapImplementation.prototype.clear$0 = LinkedHashMapImplementation.prototype.clear$_;
LinkedHashMapImplementation.prototype.forEach$1 = function($0) {
  return this.forEach(to$call$2($0));
};
$inherits(LinkedHashMapImplementation_dart_core_String$List_TestCase, LinkedHashMapImplementation);
function LinkedHashMapImplementation_dart_core_String$List_TestCase() {
  this._map = new HashMapImplementation_dart_core_String$DoubleLinkedQueueEntry_KeyValuePair_dart_core_String$List_TestCase();
  this._list = new DoubleLinkedQueue_KeyValuePair_dart_core_String$List_TestCase();
}
function Maps() {}
Maps.mapToString = function(m) {
  var result = new StringBufferImpl("");
  Maps._emitMap(m, result, new Array());
  return result.toString();
}
Maps._emitMap = function(m, result, visiting) {
  visiting.add(m);
  result.add("{");
  var first = true;
  m.forEach$1((function (k, v) {
    if (!first) {
      result.add(", ");
    }
    first = false;
    Collections._emitObject(k, result, visiting);
    result.add(": ");
    Collections._emitObject(v, result, visiting);
  })
  );
  result.add("}");
  visiting.removeLast();
}
function DoubleLinkedQueueEntry(e) {
  this._element = e;
}
DoubleLinkedQueueEntry.prototype._link = function(p, n) {
  this._next = n;
  this._previous = p;
  p._next = this;
  n._previous = this;
}
DoubleLinkedQueueEntry.prototype.prepend = function(e) {
  new DoubleLinkedQueueEntry(e)._link(this._previous, this);
}
DoubleLinkedQueueEntry.prototype.remove = function() {
  this._previous._next = this._next;
  this._next._previous = this._previous;
  this._next = null;
  this._previous = null;
  return this._element;
}
DoubleLinkedQueueEntry.prototype._asNonSentinelEntry = function() {
  return this;
}
DoubleLinkedQueueEntry.prototype.previousEntry = function() {
  return this._previous._asNonSentinelEntry();
}
DoubleLinkedQueueEntry.prototype.get$element = function() {
  return this._element;
}
DoubleLinkedQueueEntry.prototype.remove$0 = DoubleLinkedQueueEntry.prototype.remove;
$inherits(DoubleLinkedQueueEntry_KeyValuePair_dart_core_String$List_TestCase, DoubleLinkedQueueEntry);
function DoubleLinkedQueueEntry_KeyValuePair_dart_core_String$List_TestCase(e) {
  this._element = e;
}
$inherits(DoubleLinkedQueueEntry_KeyValuePair, DoubleLinkedQueueEntry);
function DoubleLinkedQueueEntry_KeyValuePair(e) {
  this._element = e;
}
DoubleLinkedQueueEntry_KeyValuePair.prototype.remove$0 = DoubleLinkedQueueEntry_KeyValuePair.prototype.remove;
$inherits(DoubleLinkedQueueEntry__IsolateEvent, DoubleLinkedQueueEntry);
function DoubleLinkedQueueEntry__IsolateEvent(e) {
  this._element = e;
}
$inherits(_DoubleLinkedQueueEntrySentinel, DoubleLinkedQueueEntry);
function _DoubleLinkedQueueEntrySentinel() {
  DoubleLinkedQueueEntry.call(this, null);
  this._link(this, this);
}
_DoubleLinkedQueueEntrySentinel.prototype.remove = function() {
  $throw(const$0002);
}
_DoubleLinkedQueueEntrySentinel.prototype._asNonSentinelEntry = function() {
  return null;
}
_DoubleLinkedQueueEntrySentinel.prototype.get$element = function() {
  $throw(const$0002);
}
_DoubleLinkedQueueEntrySentinel.prototype.remove$0 = _DoubleLinkedQueueEntrySentinel.prototype.remove;
$inherits(_DoubleLinkedQueueEntrySentinel_KeyValuePair_dart_core_String$List_TestCase, _DoubleLinkedQueueEntrySentinel);
function _DoubleLinkedQueueEntrySentinel_KeyValuePair_dart_core_String$List_TestCase() {
  DoubleLinkedQueueEntry_KeyValuePair_dart_core_String$List_TestCase.call(this, null);
  this._link(this, this);
}
$inherits(_DoubleLinkedQueueEntrySentinel_KeyValuePair, _DoubleLinkedQueueEntrySentinel);
function _DoubleLinkedQueueEntrySentinel_KeyValuePair() {
  DoubleLinkedQueueEntry_KeyValuePair.call(this, null);
  this._link(this, this);
}
$inherits(_DoubleLinkedQueueEntrySentinel__IsolateEvent, _DoubleLinkedQueueEntrySentinel);
function _DoubleLinkedQueueEntrySentinel__IsolateEvent() {
  DoubleLinkedQueueEntry__IsolateEvent.call(this, null);
  this._link(this, this);
}
function DoubleLinkedQueue() {
  this._sentinel = new _DoubleLinkedQueueEntrySentinel();
}
DoubleLinkedQueue.prototype.is$Collection = function(){return true};
DoubleLinkedQueue.prototype.addLast = function(value) {
  this._sentinel.prepend(value);
}
DoubleLinkedQueue.prototype.add = function(value) {
  this.addLast(value);
}
DoubleLinkedQueue.prototype.addAll = function(collection) {
  for (var $$i = collection.iterator(); $$i.hasNext(); ) {
    var e = $$i.next();
    this.add(e);
  }
}
DoubleLinkedQueue.prototype.removeFirst = function() {
  return this._sentinel._next.remove();
}
DoubleLinkedQueue.prototype.lastEntry = function() {
  return this._sentinel.previousEntry();
}
DoubleLinkedQueue.prototype.get$length = function() {
  var counter = (0);
  this.forEach(function _(element) {
    counter++;
  }
  );
  return counter;
}
DoubleLinkedQueue.prototype.isEmpty = function() {
  var $0;
  return ((($0 = this._sentinel._next) == null ? null == (this._sentinel) : $0 === this._sentinel));
}
DoubleLinkedQueue.prototype.clear$_ = function() {
  this._sentinel._next = this._sentinel;
  this._sentinel._previous = this._sentinel;
}
DoubleLinkedQueue.prototype.forEach = function(f) {
  var entry = this._sentinel._next;
  while ((null == entry ? null != (this._sentinel) : entry !== this._sentinel)) {
    var nextEntry = entry._next;
    f(entry._element);
    entry = nextEntry;
  }
}
DoubleLinkedQueue.prototype.filter = function(f) {
  var other = new DoubleLinkedQueue();
  var entry = this._sentinel._next;
  while ((null == entry ? null != (this._sentinel) : entry !== this._sentinel)) {
    var nextEntry = entry._next;
    if (f(entry._element)) other.addLast(entry._element);
    entry = nextEntry;
  }
  return other;
}
DoubleLinkedQueue.prototype.iterator = function() {
  return new _DoubleLinkedQueueIterator(this._sentinel);
}
DoubleLinkedQueue.prototype.toString = function() {
  return Collections.collectionToString(this);
}
DoubleLinkedQueue.prototype.add$1 = DoubleLinkedQueue.prototype.add;
DoubleLinkedQueue.prototype.clear$0 = DoubleLinkedQueue.prototype.clear$_;
DoubleLinkedQueue.prototype.filter$1 = function($0) {
  return this.filter(to$call$1($0));
};
DoubleLinkedQueue.prototype.forEach$1 = function($0) {
  return this.forEach(to$call$1($0));
};
$inherits(DoubleLinkedQueue_KeyValuePair_dart_core_String$List_TestCase, DoubleLinkedQueue);
function DoubleLinkedQueue_KeyValuePair_dart_core_String$List_TestCase() {
  this._sentinel = new _DoubleLinkedQueueEntrySentinel_KeyValuePair_dart_core_String$List_TestCase();
}
$inherits(DoubleLinkedQueue_KeyValuePair, DoubleLinkedQueue);
function DoubleLinkedQueue_KeyValuePair() {
  this._sentinel = new _DoubleLinkedQueueEntrySentinel_KeyValuePair();
}
DoubleLinkedQueue_KeyValuePair.prototype.clear$0 = DoubleLinkedQueue_KeyValuePair.prototype.clear$_;
$inherits(DoubleLinkedQueue__IsolateEvent, DoubleLinkedQueue);
function DoubleLinkedQueue__IsolateEvent() {
  this._sentinel = new _DoubleLinkedQueueEntrySentinel__IsolateEvent();
}
function _DoubleLinkedQueueIterator(_sentinel) {
  this._sentinel = _sentinel;
  this._currentEntry = this._sentinel;
}
_DoubleLinkedQueueIterator.prototype.hasNext = function() {
  var $0;
  return (($0 = this._currentEntry._next) == null ? null != (this._sentinel) : $0 !== this._sentinel);
}
_DoubleLinkedQueueIterator.prototype.next = function() {
  if (!this.hasNext()) {
    $throw(const$0001);
  }
  this._currentEntry = this._currentEntry._next;
  return this._currentEntry.get$element();
}
function StringBufferImpl(content) {
  this.clear$_();
  this.add(content);
}
StringBufferImpl.prototype.get$length = function() {
  return this._length;
}
StringBufferImpl.prototype.add = function(obj) {
  var str = obj.toString();
  if (null == str || str.isEmpty()) return this;
  this._buffer.add(str);
  this._length = this._length + str.length;
  return this;
}
StringBufferImpl.prototype.addAll = function(objects) {
  for (var $$i = objects.iterator(); $$i.hasNext(); ) {
    var obj = $$i.next();
    this.add(obj);
  }
  return this;
}
StringBufferImpl.prototype.clear$_ = function() {
  this._buffer = new Array();
  this._length = (0);
  return this;
}
StringBufferImpl.prototype.toString = function() {
  if (this._buffer.get$length() == (0)) return "";
  if (this._buffer.get$length() == (1)) return this._buffer.$index((0));
  var result = StringBase.concatAll(this._buffer);
  this._buffer.clear$_();
  this._buffer.add(result);
  return result;
}
StringBufferImpl.prototype.add$1 = StringBufferImpl.prototype.add;
StringBufferImpl.prototype.clear$0 = StringBufferImpl.prototype.clear$_;
function StringBase() {}
StringBase.join = function(strings, separator) {
  if (strings.get$length() == (0)) return "";
  var s = strings.$index((0));
  for (var i = (1);
   i < strings.get$length(); i++) {
    s = $add$($add$(s, separator), strings.$index(i));
  }
  return s;
}
StringBase.concatAll = function(strings) {
  return StringBase.join(strings, "");
}
var StringImplementation = String;
StringImplementation.prototype.get$length = function() { return this.length; };
StringImplementation.prototype.startsWith = function(other) {
    'use strict';
    if (other.length > this.length) return false;
    return other == this.substring(0, other.length);
}
StringImplementation.prototype.isEmpty = function() {
  return this.length == (0);
}
StringImplementation.prototype.contains = function(pattern, startIndex) {
  'use strict'; return this.indexOf(pattern, startIndex) >= 0;
}
StringImplementation.prototype._replaceRegExp = function(from, to) {
  'use strict';return this.replace(from.re, to);
}
StringImplementation.prototype._replaceAll = function(from, to) {
  'use strict';
  from = new RegExp(from.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'g');
  to = to.replace(/\$/g, '$$$$'); // Escape sequences are fun!
  return this.replace(from, to);
}
StringImplementation.prototype.replaceAll = function(from, to) {
  if ((typeof(from) == 'string')) return this._replaceAll(from, to);
  if (!!(from && from.is$RegExp())) return this._replaceRegExp(from.get$dynamic().get$_global(), to);
  var buffer = new StringBufferImpl("");
  var lastMatchEnd = (0);
  var $$list = from.allMatches(this);
  for (var $$i = $$list.iterator(); $$i.hasNext(); ) {
    var match = $$i.next();
    buffer.add$1(this.substring(lastMatchEnd, match.start$0()));
    buffer.add$1(to);
    lastMatchEnd = match.end$0();
  }
  buffer.add$1(this.substring(lastMatchEnd));
}
StringImplementation.prototype.split$_ = function(pattern) {
  if ((typeof(pattern) == 'string')) return this._split(pattern);
  if (!!(pattern && pattern.is$RegExp())) return this._splitRegExp(pattern);
  $throw("String.split(Pattern) unimplemented.");
}
StringImplementation.prototype._split = function(pattern) {
  'use strict'; return this.split(pattern);
}
StringImplementation.prototype._splitRegExp = function(pattern) {
  'use strict'; return this.split(pattern.re);
}
StringImplementation.prototype.allMatches = function(str) {
  $throw("String.allMatches(String str) unimplemented.");
}
StringImplementation.prototype.hashCode = function() {
      'use strict';
      var hash = 0;
      for (var i = 0; i < this.length; i++) {
        hash = 0x1fffffff & (hash + this.charCodeAt(i));
        hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
        hash ^= hash >> 6;
      }

      hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
      hash ^= hash >> 11;
      return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
}
StringImplementation.prototype.contains$1 = StringImplementation.prototype.contains;
$inherits(_ArgumentMismatchException, ClosureArgumentMismatchException);
function _ArgumentMismatchException(_message) {
  this._dart_coreimpl_message = _message;
  ClosureArgumentMismatchException.call(this);
}
_ArgumentMismatchException.prototype.toString = function() {
  return ("Closure argument mismatch: " + this._dart_coreimpl_message);
}
var _FunctionImplementation = Function;
_FunctionImplementation.prototype._genStub = function(argsLength, names) {
      // Fast path #1: if no named arguments and arg count matches.
      var thisLength = this.$length || this.length;
      if (thisLength == argsLength && !names) {
        return this;
      }

      var paramsNamed = this.$optional ? (this.$optional.length / 2) : 0;
      var paramsBare = thisLength - paramsNamed;
      var argsNamed = names ? names.length : 0;
      var argsBare = argsLength - argsNamed;

      // Check we got the right number of arguments
      if (argsBare < paramsBare || argsLength > thisLength ||
          argsNamed > paramsNamed) {
        return function() {
          $throw(new _ArgumentMismatchException(
            'Wrong number of arguments to function. Expected ' + paramsBare +
            ' positional arguments and at most ' + paramsNamed +
            ' named arguments, but got ' + argsBare +
            ' positional arguments and ' + argsNamed + ' named arguments.'));
        };
      }

      // First, fill in all of the default values
      var p = new Array(paramsBare);
      if (paramsNamed) {
        p = p.concat(this.$optional.slice(paramsNamed));
      }
      // Fill in positional args
      var a = new Array(argsLength);
      for (var i = 0; i < argsBare; i++) {
        p[i] = a[i] = '$' + i;
      }
      // Then overwrite with supplied values for optional args
      var lastParameterIndex;
      var namesInOrder = true;
      for (var i = 0; i < argsNamed; i++) {
        var name = names[i];
        a[i + argsBare] = name;
        var j = this.$optional.indexOf(name);
        if (j < 0 || j >= paramsNamed) {
          return function() {
            $throw(new _ArgumentMismatchException(
              'Named argument "' + name + '" was not expected by function.' +
              ' Did you forget to mark the function parameter [optional]?'));
          };
        } else if (lastParameterIndex && lastParameterIndex > j) {
          namesInOrder = false;
        }
        p[j + paramsBare] = name;
        lastParameterIndex = j;
      }

      if (thisLength == argsLength && namesInOrder) {
        // Fast path #2: named arguments, but they're in order and all supplied.
        return this;
      }

      // Note: using Function instead of 'eval' to get a clean scope.
      // TODO(jmesserly): evaluate the performance of these stubs.
      var f = 'function(' + a.join(',') + '){return $f(' + p.join(',') + ');}';
      return new Function('$f', 'return ' + f + '').call(null, this);
    
}
function _constList(other) {
    other.__proto__ = ImmutableList.prototype;
    return other;
}
function _map(itemsAndKeys) {
  var ret = new LinkedHashMapImplementation();
  for (var i = (0);
   i < itemsAndKeys.get$length(); ) {
    ret.$setindex(itemsAndKeys.$index(i++), itemsAndKeys.$index(i++));
  }
  return ret;
}
function _constMap(itemsAndKeys) {
  return new ImmutableMap(itemsAndKeys);
}
$dynamic("get$on").EventTarget = function() {
  return new _EventsImpl(this);
}
$dynamic("$dom_addEventListener$3").EventTarget = function($0, $1, $2) {
  if (Object.getPrototypeOf(this).hasOwnProperty("$dom_addEventListener$3")) {
    return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
  }
  return Object.prototype.$dom_addEventListener$3.call(this, $0, $1, $2);
};
$dynamic("$dom_removeEventListener$3").EventTarget = function($0, $1, $2) {
  if (Object.getPrototypeOf(this).hasOwnProperty("$dom_removeEventListener$3")) {
    return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
  }
  return Object.prototype.$dom_removeEventListener$3.call(this, $0, $1, $2);
};
$dynamic("get$nodes").Node = function() {
  return new _ChildNodeListLazy(this);
}
$dynamic("remove").Node = function() {
  if ($ne$(this.get$parent())) {
    var parent = this.get$parent();
    parent.removeChild(this);
  }
  return this;
}
$dynamic("replaceWith").Node = function(otherNode) {
  try {
    var parent = this.get$parent();
    parent.replaceChild(otherNode, this);
  } catch (e) {
    e = _toDartException(e);
  }
  ;
  return this;
}
$dynamic("get$$$dom_attributes").Node = function() {
  return this.attributes;
}
$dynamic("get$$$dom_childNodes").Node = function() {
  return this.childNodes;
}
$dynamic("get$parent").Node = function() {
  return this.parentNode;
}
$dynamic("set$text").Node = function(value) {
  this.textContent = value;
}
$dynamic("contains$1").Node = function($0) {
  return this.contains($0);
};
$dynamic("remove$0").Node = function() {
  return this.remove();
};
$dynamic("is$html_Element").Element = function(){return true};
$dynamic("get$attributes").Element = function() {
  return new _ElementAttributeMap(this);
}
$dynamic("get$elements").Element = function() {
  return new _ChildrenElementList._wrap$ctor(this);
}
$dynamic("queryAll").Element = function(selectors) {
  return new _FrozenElementList._wrap$ctor(this.querySelectorAll(selectors));
}
$dynamic("get$on").Element = function() {
  return new _ElementEventsImpl(this);
}
$dynamic("get$$$dom_children").Element = function() {
  return this.children;
}
$dynamic("get$$$dom_className").Element = function() {
  return this.className;
}
$dynamic("set$$$dom_className").Element = function(value) {
  this.className = value;
}
$dynamic("get$$$dom_firstElementChild").Element = function() {
  return this.firstElementChild;
}
$dynamic("get$id").Element = function() { return this.id; };
$dynamic("set$id").Element = function(value) { return this.id = value; };
$dynamic("set$innerHTML").Element = function(value) { return this.innerHTML = value; };
$dynamic("get$$$dom_lastElementChild").Element = function() {
  return this.lastElementChild;
}
$dynamic("get$click").Element = function() {
  return this.click.bind(this);
}
$dynamic("query$1").Element = function($0) {
  return this.querySelector($0);
};
$dynamic("get$on").AbstractWorker = function() {
  return new _AbstractWorkerEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").AbstractWorker = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").AbstractWorker = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
function _EventsImpl(_ptr) {
  this._ptr = _ptr;
}
_EventsImpl.prototype.$index = function(type) {
  return this._get(type.toLowerCase());
}
_EventsImpl.prototype._get = function(type) {
  return new _EventListenerListImpl(this._ptr, type);
}
$inherits(_AbstractWorkerEventsImpl, _EventsImpl);
function _AbstractWorkerEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$name").HTMLAnchorElement = function() { return this.name; };
$dynamic("get$name").WebKitAnimation = function() { return this.name; };
$dynamic("get$length").WebKitAnimationList = function() { return this.length; };
$dynamic("get$name").HTMLAppletElement = function() { return this.name; };
$dynamic("get$name").Attr = function() { return this.name; };
$dynamic("get$value").Attr = function() { return this.value; };
$dynamic("set$value").Attr = function(value) { return this.value = value; };
$dynamic("get$length").AudioBuffer = function() { return this.length; };
$dynamic("get$on").AudioContext = function() {
  return new _AudioContextEventsImpl(this);
}
$inherits(_AudioContextEventsImpl, _EventsImpl);
function _AudioContextEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$on").HTMLMediaElement = function() {
  return new _MediaElementEventsImpl(this);
}
$dynamic("get$name").AudioParam = function() { return this.name; };
$dynamic("get$value").AudioParam = function() { return this.value; };
$dynamic("set$value").AudioParam = function(value) { return this.value = value; };
$dynamic("get$on").BatteryManager = function() {
  return new _BatteryManagerEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").BatteryManager = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").BatteryManager = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_BatteryManagerEventsImpl, _EventsImpl);
function _BatteryManagerEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$on").HTMLBodyElement = function() {
  return new _BodyElementEventsImpl(this);
}
$inherits(_ElementEventsImpl, _EventsImpl);
function _ElementEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
_ElementEventsImpl.prototype.get$click = function() {
  return this._get("click");
}
$inherits(_BodyElementEventsImpl, _ElementEventsImpl);
function _BodyElementEventsImpl(_ptr) {
  _ElementEventsImpl.call(this, _ptr);
}
_BodyElementEventsImpl.prototype.get$message = function() {
  return this._get("message");
}
$dynamic("get$name").HTMLButtonElement = function() { return this.name; };
$dynamic("get$value").HTMLButtonElement = function() { return this.value; };
$dynamic("set$value").HTMLButtonElement = function(value) { return this.value = value; };
$dynamic("get$length").CharacterData = function() { return this.length; };
$dynamic("get$name").WebKitCSSKeyframesRule = function() { return this.name; };
$dynamic("get$length").CSSRuleList = function() { return this.length; };
$dynamic("get$length").CSSStyleDeclaration = function() { return this.length; };
$dynamic("get$length").CSSValueList = function() { return this.length; };
$dynamic("get$length").ClientRectList = function() { return this.length; };
var _ConsoleImpl = (typeof console == 'undefined' ? {} : console);
$dynamic("get$on").DOMApplicationCache = function() {
  return new _DOMApplicationCacheEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").DOMApplicationCache = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").DOMApplicationCache = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_DOMApplicationCacheEventsImpl, _EventsImpl);
function _DOMApplicationCacheEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$message").DOMException = function() { return this.message; };
$dynamic("get$name").DOMException = function() { return this.name; };
$dynamic("get$name").DOMFileSystem = function() { return this.name; };
$dynamic("get$name").DOMFileSystemSync = function() { return this.name; };
$dynamic("get$description").DOMMimeType = function() { return this.description; };
$dynamic("get$length").DOMMimeTypeArray = function() { return this.length; };
$dynamic("get$description").DOMPlugin = function() { return this.description; };
$dynamic("get$length").DOMPlugin = function() { return this.length; };
$dynamic("get$name").DOMPlugin = function() { return this.name; };
$dynamic("get$length").DOMPluginArray = function() { return this.length; };
$dynamic("get$length").DOMTokenList = function() { return this.length; };
$dynamic("add$1").DOMTokenList = function($0) {
  return this.add($0);
};
$dynamic("contains$1").DOMTokenList = function($0) {
  return this.contains($0);
};
$dynamic("get$value").DOMSettableTokenList = function() { return this.value; };
$dynamic("set$value").DOMSettableTokenList = function(value) { return this.value = value; };
$dynamic("is$List").DOMStringList = function(){return true};
$dynamic("is$Collection").DOMStringList = function(){return true};
$dynamic("get$length").DOMStringList = function() { return this.length; };
$dynamic("$index").DOMStringList = function(index) {
  return this[index];
}
$dynamic("$setindex").DOMStringList = function(index, value) {
  $throw(new UnsupportedOperationException("Cannot assign element of immutable List."));
}
$dynamic("iterator").DOMStringList = function() {
  return new _FixedSizeListIterator_dart_core_String(this);
}
$dynamic("add").DOMStringList = function(value) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("addAll").DOMStringList = function(collection) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("forEach").DOMStringList = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").DOMStringList = function(f) {
  return _Collections.filter(this, [], f);
}
$dynamic("isEmpty").DOMStringList = function() {
  return this.length == (0);
}
$dynamic("sort").DOMStringList = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
$dynamic("last").DOMStringList = function() {
  return this.$index(this.length - (1));
}
$dynamic("removeLast").DOMStringList = function() {
  $throw(new UnsupportedOperationException("Cannot removeLast on immutable List."));
}
$dynamic("add$1").DOMStringList = function($0) {
  return this.add($0);
};
$dynamic("contains$1").DOMStringList = function($0) {
  return this.contains($0);
};
$dynamic("filter$1").DOMStringList = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").DOMStringList = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("sort$1").DOMStringList = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$dynamic("get$length").DataTransferItemList = function() { return this.length; };
$dynamic("add$1").DataTransferItemList = function($0) {
  return this.add($0);
};
$dynamic("clear$0").DataTransferItemList = function() {
  return this.clear();
};
$dynamic("get$on").WorkerContext = function() {
  return new _WorkerContextEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").WorkerContext = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").WorkerContext = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("close$0").WorkerContext = function() {
  return this.close();
};
$dynamic("get$on").DedicatedWorkerContext = function() {
  return new _DedicatedWorkerContextEventsImpl(this);
}
$dynamic("postMessage$1").DedicatedWorkerContext = function($0) {
  return this.postMessage($0);
};
$inherits(_WorkerContextEventsImpl, _EventsImpl);
function _WorkerContextEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$inherits(_DedicatedWorkerContextEventsImpl, _WorkerContextEventsImpl);
function _DedicatedWorkerContextEventsImpl(_ptr) {
  _WorkerContextEventsImpl.call(this, _ptr);
}
_DedicatedWorkerContextEventsImpl.prototype.get$message = function() {
  return this._get("message");
}
$dynamic("get$on").DeprecatedPeerConnection = function() {
  return new _DeprecatedPeerConnectionEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").DeprecatedPeerConnection = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").DeprecatedPeerConnection = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("close$0").DeprecatedPeerConnection = function() {
  return this.close();
};
$inherits(_DeprecatedPeerConnectionEventsImpl, _EventsImpl);
function _DeprecatedPeerConnectionEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
_DeprecatedPeerConnectionEventsImpl.prototype.get$message = function() {
  return this._get("message");
}
$dynamic("get$name").Entry = function() { return this.name; };
$dynamic("get$name").EntrySync = function() { return this.name; };
$dynamic("remove$0").EntrySync = function() {
  return this.remove();
};
$dynamic("is$html_Element").HTMLDocument = function(){return true};
$dynamic("get$on").HTMLDocument = function() {
  return new _DocumentEventsImpl(this);
}
$dynamic("get$window").HTMLDocument = function() {
  return this.defaultView;
}
$dynamic("query").HTMLDocument = function(selectors) {
  if (const$0013.hasMatch(selectors)) {
    return this.getElementById(selectors.substring((1)));
  }
  return this.$dom_querySelector(selectors);
}
$dynamic("$dom_querySelector").HTMLDocument = function(selectors) {
  return this.querySelector(selectors);
}
$dynamic("queryAll").HTMLDocument = function(selectors) {
  if (const$0014.hasMatch(selectors)) {
    var mutableMatches = this.getElementsByName(selectors.substring((7), selectors.length - (2)));
    var len = mutableMatches.get$length();
    var copyOfMatches = new Array(len);
    for (var i = (0);
     i < len; ++i) {
      copyOfMatches.$setindex(i, mutableMatches.$index(i));
    }
    return new _FrozenElementList._wrap$ctor(copyOfMatches);
  }
  else if (const$0015.hasMatch(selectors)) {
    var mutableMatches = this.getElementsByTagName(selectors);
    var len = mutableMatches.get$length();
    var copyOfMatches = new Array(len);
    for (var i = (0);
     i < len; ++i) {
      copyOfMatches.$setindex(i, mutableMatches.$index(i));
    }
    return new _FrozenElementList._wrap$ctor(copyOfMatches);
  }
  else {
    return new _FrozenElementList._wrap$ctor(this.querySelectorAll(selectors));
  }
}
$dynamic("query$1").HTMLDocument = function($0) {
  return this.query($0);
};
$inherits(_DocumentEventsImpl, _ElementEventsImpl);
function _DocumentEventsImpl(_ptr) {
  _ElementEventsImpl.call(this, _ptr);
}
_DocumentEventsImpl.prototype.get$click = function() {
  return this._get("click");
}
function FilteredElementList(node) {
  this._childNodes = node.get$nodes();
  this._node = node;
}
FilteredElementList.prototype.is$List = function(){return true};
FilteredElementList.prototype.is$Collection = function(){return true};
FilteredElementList.prototype.get$_filtered = function() {
  return ListFactory.ListFactory$from$factory(this._childNodes.filter$1((function (n) {
    return !!(n && n.is$html_Element());
  })
  ));
}
FilteredElementList.prototype.get$first = function() {
  var $$list = this._childNodes;
  for (var $$i = $$list.iterator(); $$i.hasNext(); ) {
    var node = $$i.next();
    if (!!(node && node.is$html_Element())) {
      return node;
    }
  }
  return null;
}
FilteredElementList.prototype.forEach = function(f) {
  this.get$_filtered().forEach$1(f);
}
FilteredElementList.prototype.$setindex = function(index, value) {
  this.$index(index).replaceWith(value);
}
FilteredElementList.prototype.add = function(value) {
  this._childNodes.add(value);
}
FilteredElementList.prototype.get$add = function() {
  return this.add.bind(this);
}
FilteredElementList.prototype.addAll = function(collection) {
  collection.forEach$1(this.get$add());
}
FilteredElementList.prototype.sort = function(compare) {
  $throw(const$0017);
}
FilteredElementList.prototype.clear$_ = function() {
  this._childNodes.clear$_();
}
FilteredElementList.prototype.removeLast = function() {
  var result = this.last();
  if ($ne$(result)) {
    result.remove$0();
  }
  return result;
}
FilteredElementList.prototype.filter = function(f) {
  return this.get$_filtered().filter$1(f);
}
FilteredElementList.prototype.isEmpty = function() {
  return this.get$_filtered().isEmpty();
}
FilteredElementList.prototype.get$length = function() {
  return this.get$_filtered().get$length();
}
FilteredElementList.prototype.$index = function(index) {
  return this.get$_filtered().$index(index);
}
FilteredElementList.prototype.iterator = function() {
  return this.get$_filtered().iterator();
}
FilteredElementList.prototype.last = function() {
  return this.get$_filtered().last();
}
FilteredElementList.prototype.add$1 = FilteredElementList.prototype.add;
FilteredElementList.prototype.clear$0 = FilteredElementList.prototype.clear$_;
FilteredElementList.prototype.filter$1 = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
FilteredElementList.prototype.forEach$1 = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
FilteredElementList.prototype.sort$1 = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
function EmptyElementRect() {}
$dynamic("is$html_Element").DocumentFragment = function(){return true};
$dynamic("get$elements").DocumentFragment = function() {
  if (this._elements == null) {
    this._elements = new FilteredElementList(this);
  }
  return this._elements;
}
$dynamic("queryAll").DocumentFragment = function(selectors) {
  return new _FrozenElementList._wrap$ctor(this.querySelectorAll(selectors));
}
$dynamic("set$innerHTML").DocumentFragment = function(value) {
  this.get$nodes().clear$_();
  var e = _ElementFactoryProvider.Element$tag$factory("div");
  e.set$innerHTML(value);
  var nodes = ListFactory.ListFactory$from$factory(e.get$nodes());
  this.get$nodes().addAll(nodes);
}
$dynamic("get$id").DocumentFragment = function() {
  return "";
}
$dynamic("set$id").DocumentFragment = function(value) {
  $throw(new UnsupportedOperationException("ID can't be set for document fragments."));
}
$dynamic("get$parent").DocumentFragment = function() {
  return null;
}
$dynamic("get$attributes").DocumentFragment = function() {
  return const$0016;
}
$dynamic("click").DocumentFragment = function() {

}
$dynamic("get$click").DocumentFragment = function() {
  return this.click.bind(this);
}
$dynamic("get$on").DocumentFragment = function() {
  return new _ElementEventsImpl(this);
}
$dynamic("query$1").DocumentFragment = function($0) {
  return this.querySelector($0);
};
$dynamic("get$name").DocumentType = function() { return this.name; };
_ChildrenElementList._wrap$ctor = function(element) {
  this._childElements = element.get$$$dom_children();
  this._html_element = element;
}
_ChildrenElementList._wrap$ctor.prototype = _ChildrenElementList.prototype;
function _ChildrenElementList() {}
_ChildrenElementList.prototype.is$List = function(){return true};
_ChildrenElementList.prototype.is$Collection = function(){return true};
_ChildrenElementList.prototype._toList = function() {
  var output = new Array(this._childElements.get$length());
  for (var i = (0), len = this._childElements.get$length();
   i < len; i++) {
    output.$setindex(i, this._childElements.$index(i));
  }
  return output;
}
_ChildrenElementList.prototype.get$first = function() {
  return this._html_element.get$$$dom_firstElementChild();
}
_ChildrenElementList.prototype.forEach = function(f) {
  var $$list = this._childElements;
  for (var $$i = $$list.iterator(); $$i.hasNext(); ) {
    var element = $$i.next();
    f(element);
  }
}
_ChildrenElementList.prototype.filter = function(f) {
  var output = [];
  this.forEach((function (element) {
    if (f(element)) {
      output.add$1(element);
    }
  })
  );
  return new _FrozenElementList._wrap$ctor(output);
}
_ChildrenElementList.prototype.isEmpty = function() {
  return this._html_element.get$$$dom_firstElementChild() == null;
}
_ChildrenElementList.prototype.get$length = function() {
  return this._childElements.get$length();
}
_ChildrenElementList.prototype.$index = function(index) {
  return this._childElements.$index(index);
}
_ChildrenElementList.prototype.$setindex = function(index, value) {
  this._html_element.replaceChild(value, this._childElements.$index(index));
}
_ChildrenElementList.prototype.add = function(value) {
  this._html_element.appendChild(value);
  return value;
}
_ChildrenElementList.prototype.iterator = function() {
  return this._toList().iterator();
}
_ChildrenElementList.prototype.addAll = function(collection) {
  for (var $$i = collection.iterator(); $$i.hasNext(); ) {
    var element = $$i.next();
    this._html_element.appendChild(element);
  }
}
_ChildrenElementList.prototype.sort = function(compare) {
  $throw(const$0017);
}
_ChildrenElementList.prototype.clear$_ = function() {
  this._html_element.set$text("");
}
_ChildrenElementList.prototype.removeLast = function() {
  var result = this.last();
  if ($ne$(result)) {
    this._html_element.removeChild(result);
  }
  return result;
}
_ChildrenElementList.prototype.last = function() {
  return this._html_element.get$$$dom_lastElementChild();
}
_ChildrenElementList.prototype.add$1 = _ChildrenElementList.prototype.add;
_ChildrenElementList.prototype.clear$0 = _ChildrenElementList.prototype.clear$_;
_ChildrenElementList.prototype.filter$1 = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
_ChildrenElementList.prototype.forEach$1 = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
_ChildrenElementList.prototype.sort$1 = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
_FrozenElementList._wrap$ctor = function(_nodeList) {
  this._nodeList = _nodeList;
}
_FrozenElementList._wrap$ctor.prototype = _FrozenElementList.prototype;
function _FrozenElementList() {}
_FrozenElementList.prototype.is$List = function(){return true};
_FrozenElementList.prototype.is$Collection = function(){return true};
_FrozenElementList.prototype.get$first = function() {
  return this._nodeList.$index((0));
}
_FrozenElementList.prototype.forEach = function(f) {
  for (var $$i = this.iterator(); $$i.hasNext(); ) {
    var el = $$i.next();
    f(el);
  }
}
_FrozenElementList.prototype.filter = function(f) {
  var out = new _ElementList([]);
  for (var $$i = this.iterator(); $$i.hasNext(); ) {
    var el = $$i.next();
    if (f(el)) out.add$1(el);
  }
  return out;
}
_FrozenElementList.prototype.isEmpty = function() {
  return this._nodeList.isEmpty();
}
_FrozenElementList.prototype.get$length = function() {
  return this._nodeList.get$length();
}
_FrozenElementList.prototype.$index = function(index) {
  return this._nodeList.$index(index);
}
_FrozenElementList.prototype.$setindex = function(index, value) {
  $throw(const$0003);
}
_FrozenElementList.prototype.add = function(value) {
  $throw(const$0003);
}
_FrozenElementList.prototype.iterator = function() {
  return new _FrozenElementListIterator(this);
}
_FrozenElementList.prototype.addAll = function(collection) {
  $throw(const$0003);
}
_FrozenElementList.prototype.sort = function(compare) {
  $throw(const$0003);
}
_FrozenElementList.prototype.clear$_ = function() {
  $throw(const$0003);
}
_FrozenElementList.prototype.removeLast = function() {
  $throw(const$0003);
}
_FrozenElementList.prototype.last = function() {
  return this._nodeList.last();
}
_FrozenElementList.prototype.add$1 = _FrozenElementList.prototype.add;
_FrozenElementList.prototype.clear$0 = _FrozenElementList.prototype.clear$_;
_FrozenElementList.prototype.filter$1 = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
_FrozenElementList.prototype.forEach$1 = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
_FrozenElementList.prototype.sort$1 = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
function _FrozenElementListIterator(_list) {
  this._html_index = (0);
  this._html_list = _list;
}
_FrozenElementListIterator.prototype.next = function() {
  if (!this.hasNext()) {
    $throw(const$0001);
  }
  return this._html_list.$index(this._html_index++);
}
_FrozenElementListIterator.prototype.hasNext = function() {
  return this._html_index < this._html_list.get$length();
}
function _ListWrapper() {}
_ListWrapper.prototype.is$List = function(){return true};
_ListWrapper.prototype.is$Collection = function(){return true};
_ListWrapper.prototype.iterator = function() {
  return this._html_list.iterator();
}
_ListWrapper.prototype.forEach = function(f) {
  return this._html_list.forEach$1(f);
}
_ListWrapper.prototype.filter = function(f) {
  return this._html_list.filter$1(f);
}
_ListWrapper.prototype.isEmpty = function() {
  return this._html_list.isEmpty();
}
_ListWrapper.prototype.get$length = function() {
  return this._html_list.get$length();
}
_ListWrapper.prototype.$index = function(index) {
  return this._html_list.$index(index);
}
_ListWrapper.prototype.$setindex = function(index, value) {
  this._html_list.$setindex(index, value);
}
_ListWrapper.prototype.add = function(value) {
  return this._html_list.add(value);
}
_ListWrapper.prototype.addAll = function(collection) {
  return this._html_list.addAll(collection);
}
_ListWrapper.prototype.sort = function(compare) {
  return this._html_list.sort$1(compare);
}
_ListWrapper.prototype.clear$_ = function() {
  return this._html_list.clear$_();
}
_ListWrapper.prototype.removeLast = function() {
  return this._html_list.removeLast();
}
_ListWrapper.prototype.last = function() {
  return this._html_list.last();
}
_ListWrapper.prototype.get$first = function() {
  return this._html_list.$index((0));
}
_ListWrapper.prototype.add$1 = _ListWrapper.prototype.add;
_ListWrapper.prototype.clear$0 = _ListWrapper.prototype.clear$_;
_ListWrapper.prototype.filter$1 = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
_ListWrapper.prototype.forEach$1 = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
_ListWrapper.prototype.sort$1 = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$inherits(_ListWrapper_Element, _ListWrapper);
function _ListWrapper_Element(_list) {
  this._html_list = _list;
}
_ListWrapper_Element.prototype.add$1 = _ListWrapper_Element.prototype.add;
_ListWrapper_Element.prototype.clear$0 = _ListWrapper_Element.prototype.clear$_;
_ListWrapper_Element.prototype.sort$1 = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$inherits(_ElementList, _ListWrapper_Element);
function _ElementList(list) {
  _ListWrapper_Element.call(this, list);
}
_ElementList.prototype.filter = function(f) {
  return new _ElementList(_ListWrapper_Element.prototype.filter.call(this, f));
}
_ElementList.prototype.filter$1 = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
function _ElementAttributeMap(_element) {
  this._html_element = _element;
}
_ElementAttributeMap.prototype.is$Map = function(){return true};
_ElementAttributeMap.prototype.containsKey = function(key) {
  return this._html_element.hasAttribute(key);
}
_ElementAttributeMap.prototype.$index = function(key) {
  return this._html_element.getAttribute(key);
}
_ElementAttributeMap.prototype.$setindex = function(key, value) {
  this._html_element.setAttribute(key, ("" + value));
}
_ElementAttributeMap.prototype.remove = function(key) {
  var value = this._html_element.getAttribute(key);
  this._html_element.removeAttribute(key);
  return value;
}
_ElementAttributeMap.prototype.clear$_ = function() {
  var attributes = this._html_element.get$$$dom_attributes();
  for (var i = attributes.get$length() - (1);
   i >= (0); i--) {
    this.remove(attributes.$index(i).get$name());
  }
}
_ElementAttributeMap.prototype.forEach = function(f) {
  var attributes = this._html_element.get$$$dom_attributes();
  for (var i = (0), len = attributes.get$length();
   i < len; i++) {
    var item = attributes.$index(i);
    f(item.get$name(), item.get$value());
  }
}
_ElementAttributeMap.prototype.getKeys = function() {
  var attributes = this._html_element.get$$$dom_attributes();
  var keys = new Array(attributes.get$length());
  for (var i = (0), len = attributes.get$length();
   i < len; i++) {
    keys.$setindex(i, attributes.$index(i).get$name());
  }
  return keys;
}
_ElementAttributeMap.prototype.getValues = function() {
  var attributes = this._html_element.get$$$dom_attributes();
  var values = new Array(attributes.get$length());
  for (var i = (0), len = attributes.get$length();
   i < len; i++) {
    values.$setindex(i, attributes.$index(i).get$value());
  }
  return values;
}
_ElementAttributeMap.prototype.get$length = function() {
  return this._html_element.get$$$dom_attributes().length;
}
_ElementAttributeMap.prototype.isEmpty = function() {
  return this.get$length() == (0);
}
_ElementAttributeMap.prototype.clear$0 = _ElementAttributeMap.prototype.clear$_;
_ElementAttributeMap.prototype.forEach$1 = function($0) {
  return this.forEach($wrap_call$2(to$call$2($0)));
};
function _DataAttributeMap() {}
_DataAttributeMap.prototype.is$Map = function(){return true};
_DataAttributeMap.prototype.containsKey = function(key) {
  return this.$$dom_attributes.containsKey(this._attr(key));
}
_DataAttributeMap.prototype.$index = function(key) {
  return this.$$dom_attributes.$index(this._attr(key));
}
_DataAttributeMap.prototype.$setindex = function(key, value) {
  this.$$dom_attributes.$setindex(this._attr(key), ("" + value));
}
_DataAttributeMap.prototype.remove = function(key) {
  return this.$$dom_attributes.remove(this._attr(key));
}
_DataAttributeMap.prototype.clear$_ = function() {
  var $$list = this.getKeys();
  for (var $$i = $$list.iterator(); $$i.hasNext(); ) {
    var key = $$i.next();
    this.remove(key);
  }
}
_DataAttributeMap.prototype.forEach = function(f) {
  var $this = this;
  this.$$dom_attributes.forEach$1((function (key, value) {
    if ($this._matches(key)) {
      f($this._strip(key), value);
    }
  })
  );
}
_DataAttributeMap.prototype.getKeys = function() {
  var $this = this;
  var keys = new Array();
  this.$$dom_attributes.forEach$1((function (key, value) {
    if ($this._matches(key)) {
      keys.add$1($this._strip(key));
    }
  })
  );
  return keys;
}
_DataAttributeMap.prototype.getValues = function() {
  var $this = this;
  var values = new Array();
  this.$$dom_attributes.forEach$1((function (key, value) {
    if ($this._matches(key)) {
      values.add$1(value);
    }
  })
  );
  return values;
}
_DataAttributeMap.prototype.get$length = function() {
  return this.getKeys().get$length();
}
_DataAttributeMap.prototype.isEmpty = function() {
  return this.get$length() == (0);
}
_DataAttributeMap.prototype._attr = function(key) {
  return ("data-" + key);
}
_DataAttributeMap.prototype._matches = function(key) {
  return key.startsWith("data-");
}
_DataAttributeMap.prototype._strip = function(key) {
  return key.substring((5));
}
_DataAttributeMap.prototype.clear$0 = _DataAttributeMap.prototype.clear$_;
_DataAttributeMap.prototype.forEach$1 = function($0) {
  return this.forEach($wrap_call$2(to$call$2($0)));
};
function _CssClassSet() {}
_CssClassSet.prototype.is$Collection = function(){return true};
_CssClassSet.prototype.toString = function() {
  return this._formatSet(this._read());
}
_CssClassSet.prototype.iterator = function() {
  return this._read().iterator();
}
_CssClassSet.prototype.forEach = function(f) {
  this._read().forEach$1(f);
}
_CssClassSet.prototype.filter = function(f) {
  return this._read().filter$1(f);
}
_CssClassSet.prototype.isEmpty = function() {
  return this._read().isEmpty();
}
_CssClassSet.prototype.get$length = function() {
  return this._read().get$length();
}
_CssClassSet.prototype.contains = function(value) {
  return this._read().contains(value);
}
_CssClassSet.prototype.add = function(value) {
  this._modify((function (s) {
    return s.add$1(value);
  })
  );
}
_CssClassSet.prototype.addAll = function(collection) {
  this._modify((function (s) {
    return s.addAll(collection);
  })
  );
}
_CssClassSet.prototype.clear$_ = function() {
  this._modify((function (s) {
    return s.clear$0();
  })
  );
}
_CssClassSet.prototype._modify = function(f) {
  var s = this._read();
  f(s);
  this._write(s);
}
_CssClassSet.prototype._read = function() {
  var s = new HashSetImplementation_dart_core_String();
  var $$list = this._classname().split$_(" ");
  for (var $$i = $$list.iterator(); $$i.hasNext(); ) {
    var name = $$i.next();
    var trimmed = name.trim();
    if (!trimmed.isEmpty()) {
      s.add(trimmed);
    }
  }
  return s;
}
_CssClassSet.prototype._classname = function() {
  return this._html_element.get$$$dom_className();
}
_CssClassSet.prototype._write = function(s) {
  this._html_element.set$$$dom_className(this._formatSet(s));
}
_CssClassSet.prototype._formatSet = function(s) {
  var list = ListFactory.ListFactory$from$factory(s);
  return Strings.join(list, " ");
}
_CssClassSet.prototype.add$1 = _CssClassSet.prototype.add;
_CssClassSet.prototype.clear$0 = _CssClassSet.prototype.clear$_;
_CssClassSet.prototype.contains$1 = _CssClassSet.prototype.contains;
_CssClassSet.prototype.filter$1 = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
_CssClassSet.prototype.forEach$1 = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
function _SimpleClientRect() {}
_SimpleClientRect.prototype.$eq = function(other) {
  return null != other && this.left == other.left && this.top == other.top && this.width == other.width && this.height == other.height;
}
_SimpleClientRect.prototype.toString = function() {
  return ("(" + this.left + ", " + this.top + ", " + this.width + ", " + this.height + ")");
}
function _ElementRectImpl() {}
function _ElementFactoryProvider() {}
_ElementFactoryProvider.Element$html$factory = function(html) {
  var parentTag = "div";
  var tag;
  var match = const$0010.firstMatch(html);
  if (null != match) {
    tag = match.group((1)).toLowerCase();
    if (const$0012.containsKey(tag)) {
      parentTag = const$0012.$index(tag);
    }
  }
  var temp = _ElementFactoryProvider.Element$tag$factory(parentTag);
  temp.set$innerHTML(html);
  var element;
  if (temp.get$elements().get$length() == (1)) {
    element = temp.get$elements().get$first();
  }
  else if (parentTag == "html" && temp.get$elements().get$length() == (2)) {
    element = temp.get$elements().$index(tag == "head" ? (0) : (1));
  }
  else {
    $throw(new IllegalArgumentException($add$(("HTML had " + temp.get$elements().get$length() + " "), "top level elements but 1 expected")));
  }
  element.remove();
  return element;
}
_ElementFactoryProvider.Element$tag$factory = function(tag) {
  return document.createElement(tag)
}
$dynamic("get$name").HTMLEmbedElement = function() { return this.name; };
$dynamic("get$length").EntryArray = function() { return this.length; };
$dynamic("get$length").EntryArraySync = function() { return this.length; };
$dynamic("get$message").ErrorEvent = function() { return this.message; };
$dynamic("get$message").EventException = function() { return this.message; };
$dynamic("get$name").EventException = function() { return this.name; };
$dynamic("get$on").EventSource = function() {
  return new _EventSourceEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").EventSource = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").EventSource = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("close$0").EventSource = function() {
  return this.close();
};
$inherits(_EventSourceEventsImpl, _EventsImpl);
function _EventSourceEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
_EventSourceEventsImpl.prototype.get$message = function() {
  return this._get("message");
}
function _EventListenerListImpl(_ptr, _type) {
  this._ptr = _ptr;
  this._type = _type;
}
_EventListenerListImpl.prototype.add = function(listener, useCapture) {
  this._add(listener, useCapture);
  return this;
}
_EventListenerListImpl.prototype.remove = function(listener, useCapture) {
  this._remove(listener, useCapture);
  return this;
}
_EventListenerListImpl.prototype._add = function(listener, useCapture) {
  this._ptr.$dom_addEventListener$3(this._type, listener, useCapture);
}
_EventListenerListImpl.prototype._remove = function(listener, useCapture) {
  this._ptr.$dom_removeEventListener$3(this._type, listener, useCapture);
}
_EventListenerListImpl.prototype.add$1 = function($0) {
  return this.add($wrap_call$1(to$call$1($0)), false);
};
$dynamic("get$name").HTMLFieldSetElement = function() { return this.name; };
$dynamic("get$name").File = function() { return this.name; };
$dynamic("get$message").FileException = function() { return this.message; };
$dynamic("get$name").FileException = function() { return this.name; };
$dynamic("get$length").FileList = function() { return this.length; };
$dynamic("get$on").FileReader = function() {
  return new _FileReaderEventsImpl(this);
}
$dynamic("get$result").FileReader = function() { return this.result; };
$dynamic("$dom_addEventListener$3").FileReader = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").FileReader = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_FileReaderEventsImpl, _EventsImpl);
function _FileReaderEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$on").FileWriter = function() {
  return new _FileWriterEventsImpl(this);
}
$dynamic("get$length").FileWriter = function() { return this.length; };
$dynamic("$dom_addEventListener$3").FileWriter = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").FileWriter = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_FileWriterEventsImpl, _EventsImpl);
function _FileWriterEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$length").FileWriterSync = function() { return this.length; };
$dynamic("is$List").Float32Array = function(){return true};
$dynamic("is$Collection").Float32Array = function(){return true};
$dynamic("get$length").Float32Array = function() { return this.length; };
$dynamic("$index").Float32Array = function(index) {
  return this[index];
}
$dynamic("$setindex").Float32Array = function(index, value) {
  this[index] = value
}
$dynamic("iterator").Float32Array = function() {
  return new _FixedSizeListIterator_num(this);
}
$dynamic("add").Float32Array = function(value) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("addAll").Float32Array = function(collection) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("forEach").Float32Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Float32Array = function(f) {
  return _Collections.filter(this, [], f);
}
$dynamic("isEmpty").Float32Array = function() {
  return this.length == (0);
}
$dynamic("sort").Float32Array = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
$dynamic("last").Float32Array = function() {
  return this.$index(this.length - (1));
}
$dynamic("removeLast").Float32Array = function() {
  $throw(new UnsupportedOperationException("Cannot removeLast on immutable List."));
}
$dynamic("add$1").Float32Array = function($0) {
  return this.add($0);
};
$dynamic("filter$1").Float32Array = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").Float32Array = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("sort$1").Float32Array = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$dynamic("is$List").Float64Array = function(){return true};
$dynamic("is$Collection").Float64Array = function(){return true};
$dynamic("get$length").Float64Array = function() { return this.length; };
$dynamic("$index").Float64Array = function(index) {
  return this[index];
}
$dynamic("$setindex").Float64Array = function(index, value) {
  this[index] = value
}
$dynamic("iterator").Float64Array = function() {
  return new _FixedSizeListIterator_num(this);
}
$dynamic("add").Float64Array = function(value) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("addAll").Float64Array = function(collection) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("forEach").Float64Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Float64Array = function(f) {
  return _Collections.filter(this, [], f);
}
$dynamic("isEmpty").Float64Array = function() {
  return this.length == (0);
}
$dynamic("sort").Float64Array = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
$dynamic("last").Float64Array = function() {
  return this.$index(this.length - (1));
}
$dynamic("removeLast").Float64Array = function() {
  $throw(new UnsupportedOperationException("Cannot removeLast on immutable List."));
}
$dynamic("add$1").Float64Array = function($0) {
  return this.add($0);
};
$dynamic("filter$1").Float64Array = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").Float64Array = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("sort$1").Float64Array = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$dynamic("get$length").HTMLFormElement = function() { return this.length; };
$dynamic("get$name").HTMLFormElement = function() { return this.name; };
$dynamic("get$name").HTMLFrameElement = function() { return this.name; };
$dynamic("get$on").HTMLFrameSetElement = function() {
  return new _FrameSetElementEventsImpl(this);
}
$inherits(_FrameSetElementEventsImpl, _ElementEventsImpl);
function _FrameSetElementEventsImpl(_ptr) {
  _ElementEventsImpl.call(this, _ptr);
}
_FrameSetElementEventsImpl.prototype.get$message = function() {
  return this._get("message");
}
$dynamic("get$length").HTMLAllCollection = function() { return this.length; };
$dynamic("is$List").HTMLCollection = function(){return true};
$dynamic("is$Collection").HTMLCollection = function(){return true};
$dynamic("get$length").HTMLCollection = function() { return this.length; };
$dynamic("$index").HTMLCollection = function(index) {
  return this[index];
}
$dynamic("$setindex").HTMLCollection = function(index, value) {
  $throw(new UnsupportedOperationException("Cannot assign element of immutable List."));
}
$dynamic("iterator").HTMLCollection = function() {
  return new _FixedSizeListIterator_html_Node(this);
}
$dynamic("add").HTMLCollection = function(value) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("addAll").HTMLCollection = function(collection) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("forEach").HTMLCollection = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").HTMLCollection = function(f) {
  return _Collections.filter(this, [], f);
}
$dynamic("isEmpty").HTMLCollection = function() {
  return this.get$length() == (0);
}
$dynamic("sort").HTMLCollection = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
$dynamic("last").HTMLCollection = function() {
  return this.$index(this.get$length() - (1));
}
$dynamic("removeLast").HTMLCollection = function() {
  $throw(new UnsupportedOperationException("Cannot removeLast on immutable List."));
}
$dynamic("add$1").HTMLCollection = function($0) {
  return this.add($0);
};
$dynamic("filter$1").HTMLCollection = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").HTMLCollection = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("sort$1").HTMLCollection = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$dynamic("get$length").HTMLOptionsCollection = function() {
  return this.length;
}
$dynamic("get$length").History = function() { return this.length; };
$dynamic("get$value").IDBCursorWithValue = function() { return this.value; };
$dynamic("get$on").IDBDatabase = function() {
  return new _IDBDatabaseEventsImpl(this);
}
$dynamic("get$name").IDBDatabase = function() { return this.name; };
$dynamic("$dom_addEventListener$3").IDBDatabase = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").IDBDatabase = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("close$0").IDBDatabase = function() {
  return this.close();
};
$inherits(_IDBDatabaseEventsImpl, _EventsImpl);
function _IDBDatabaseEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$message").IDBDatabaseException = function() { return this.message; };
$dynamic("get$name").IDBDatabaseException = function() { return this.name; };
$dynamic("get$name").IDBIndex = function() { return this.name; };
$dynamic("get$name").IDBObjectStore = function() { return this.name; };
$dynamic("add$1").IDBObjectStore = function($0) {
  return this.add($0);
};
$dynamic("clear$0").IDBObjectStore = function() {
  return this.clear();
};
$dynamic("get$on").IDBRequest = function() {
  return new _IDBRequestEventsImpl(this);
}
$dynamic("get$result").IDBRequest = function() { return this.result; };
$dynamic("$dom_addEventListener$3").IDBRequest = function($0, $1, $2) {
  if (Object.getPrototypeOf(this).hasOwnProperty("$dom_addEventListener$3")) {
    return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
  }
  return Object.prototype.$dom_addEventListener$3.call(this, $0, $1, $2);
};
$dynamic("$dom_removeEventListener$3").IDBRequest = function($0, $1, $2) {
  if (Object.getPrototypeOf(this).hasOwnProperty("$dom_removeEventListener$3")) {
    return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
  }
  return Object.prototype.$dom_removeEventListener$3.call(this, $0, $1, $2);
};
$inherits(_IDBRequestEventsImpl, _EventsImpl);
function _IDBRequestEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$on").IDBTransaction = function() {
  return new _IDBTransactionEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").IDBTransaction = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").IDBTransaction = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_IDBTransactionEventsImpl, _EventsImpl);
function _IDBTransactionEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$on").IDBVersionChangeRequest = function() {
  return new _IDBVersionChangeRequestEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").IDBVersionChangeRequest = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").IDBVersionChangeRequest = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_IDBVersionChangeRequestEventsImpl, _IDBRequestEventsImpl);
function _IDBVersionChangeRequestEventsImpl(_ptr) {
  _IDBRequestEventsImpl.call(this, _ptr);
}
$dynamic("get$name").HTMLIFrameElement = function() { return this.name; };
$dynamic("get$name").HTMLImageElement = function() { return this.name; };
$dynamic("get$on").HTMLInputElement = function() {
  return new _InputElementEventsImpl(this);
}
$dynamic("get$name").HTMLInputElement = function() { return this.name; };
$dynamic("get$value").HTMLInputElement = function() { return this.value; };
$dynamic("set$value").HTMLInputElement = function(value) { return this.value = value; };
$inherits(_InputElementEventsImpl, _ElementEventsImpl);
function _InputElementEventsImpl(_ptr) {
  _ElementEventsImpl.call(this, _ptr);
}
$dynamic("is$List").Int16Array = function(){return true};
$dynamic("is$Collection").Int16Array = function(){return true};
$dynamic("get$length").Int16Array = function() { return this.length; };
$dynamic("$index").Int16Array = function(index) {
  return this[index];
}
$dynamic("$setindex").Int16Array = function(index, value) {
  this[index] = value
}
$dynamic("iterator").Int16Array = function() {
  return new _FixedSizeListIterator_int(this);
}
$dynamic("add").Int16Array = function(value) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("addAll").Int16Array = function(collection) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("forEach").Int16Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Int16Array = function(f) {
  return _Collections.filter(this, [], f);
}
$dynamic("isEmpty").Int16Array = function() {
  return this.length == (0);
}
$dynamic("sort").Int16Array = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
$dynamic("last").Int16Array = function() {
  return this.$index(this.length - (1));
}
$dynamic("removeLast").Int16Array = function() {
  $throw(new UnsupportedOperationException("Cannot removeLast on immutable List."));
}
$dynamic("add$1").Int16Array = function($0) {
  return this.add($0);
};
$dynamic("filter$1").Int16Array = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").Int16Array = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("sort$1").Int16Array = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$dynamic("is$List").Int32Array = function(){return true};
$dynamic("is$Collection").Int32Array = function(){return true};
$dynamic("get$length").Int32Array = function() { return this.length; };
$dynamic("$index").Int32Array = function(index) {
  return this[index];
}
$dynamic("$setindex").Int32Array = function(index, value) {
  this[index] = value
}
$dynamic("iterator").Int32Array = function() {
  return new _FixedSizeListIterator_int(this);
}
$dynamic("add").Int32Array = function(value) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("addAll").Int32Array = function(collection) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("forEach").Int32Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Int32Array = function(f) {
  return _Collections.filter(this, [], f);
}
$dynamic("isEmpty").Int32Array = function() {
  return this.length == (0);
}
$dynamic("sort").Int32Array = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
$dynamic("last").Int32Array = function() {
  return this.$index(this.length - (1));
}
$dynamic("removeLast").Int32Array = function() {
  $throw(new UnsupportedOperationException("Cannot removeLast on immutable List."));
}
$dynamic("add$1").Int32Array = function($0) {
  return this.add($0);
};
$dynamic("filter$1").Int32Array = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").Int32Array = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("sort$1").Int32Array = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$dynamic("is$List").Int8Array = function(){return true};
$dynamic("is$Collection").Int8Array = function(){return true};
$dynamic("get$length").Int8Array = function() { return this.length; };
$dynamic("$index").Int8Array = function(index) {
  return this[index];
}
$dynamic("$setindex").Int8Array = function(index, value) {
  this[index] = value
}
$dynamic("iterator").Int8Array = function() {
  return new _FixedSizeListIterator_int(this);
}
$dynamic("add").Int8Array = function(value) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("addAll").Int8Array = function(collection) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("forEach").Int8Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Int8Array = function(f) {
  return _Collections.filter(this, [], f);
}
$dynamic("isEmpty").Int8Array = function() {
  return this.length == (0);
}
$dynamic("sort").Int8Array = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
$dynamic("last").Int8Array = function() {
  return this.$index(this.length - (1));
}
$dynamic("removeLast").Int8Array = function() {
  $throw(new UnsupportedOperationException("Cannot removeLast on immutable List."));
}
$dynamic("add$1").Int8Array = function($0) {
  return this.add($0);
};
$dynamic("filter$1").Int8Array = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").Int8Array = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("sort$1").Int8Array = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$dynamic("get$on").JavaScriptAudioNode = function() {
  return new _JavaScriptAudioNodeEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").JavaScriptAudioNode = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").JavaScriptAudioNode = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_JavaScriptAudioNodeEventsImpl, _EventsImpl);
function _JavaScriptAudioNodeEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$name").HTMLKeygenElement = function() { return this.name; };
$dynamic("get$value").HTMLLIElement = function() { return this.value; };
$dynamic("set$value").HTMLLIElement = function(value) { return this.value = value; };
$dynamic("get$on").MediaStream = function() {
  return new _MediaStreamEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").MediaStream = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").MediaStream = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("get$name").HTMLMapElement = function() { return this.name; };
$dynamic("start$0").HTMLMarqueeElement = function() {
  return this.start();
};
$dynamic("$dom_addEventListener$3").MediaController = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").MediaController = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_MediaElementEventsImpl, _ElementEventsImpl);
function _MediaElementEventsImpl(_ptr) {
  _ElementEventsImpl.call(this, _ptr);
}
$dynamic("get$message").MediaKeyEvent = function() { return this.message; };
$dynamic("is$List").MediaList = function(){return true};
$dynamic("is$Collection").MediaList = function(){return true};
$dynamic("get$length").MediaList = function() { return this.length; };
$dynamic("$index").MediaList = function(index) {
  return this[index];
}
$dynamic("$setindex").MediaList = function(index, value) {
  $throw(new UnsupportedOperationException("Cannot assign element of immutable List."));
}
$dynamic("iterator").MediaList = function() {
  return new _FixedSizeListIterator_dart_core_String(this);
}
$dynamic("add").MediaList = function(value) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("addAll").MediaList = function(collection) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("forEach").MediaList = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").MediaList = function(f) {
  return _Collections.filter(this, [], f);
}
$dynamic("isEmpty").MediaList = function() {
  return this.length == (0);
}
$dynamic("sort").MediaList = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
$dynamic("last").MediaList = function() {
  return this.$index(this.length - (1));
}
$dynamic("removeLast").MediaList = function() {
  $throw(new UnsupportedOperationException("Cannot removeLast on immutable List."));
}
$dynamic("add$1").MediaList = function($0) {
  return this.add($0);
};
$dynamic("filter$1").MediaList = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").MediaList = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("sort$1").MediaList = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$inherits(_MediaStreamEventsImpl, _EventsImpl);
function _MediaStreamEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$length").MediaStreamList = function() { return this.length; };
$dynamic("get$length").MediaStreamTrackList = function() { return this.length; };
$dynamic("get$ports").MessageEvent = function() { return this.ports; };
$dynamic("get$on").MessagePort = function() {
  return new _MessagePortEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").MessagePort = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").MessagePort = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("close$0").MessagePort = function() {
  return this.close();
};
$dynamic("postMessage$1").MessagePort = function($0) {
  return this.postMessage($0);
};
$dynamic("start$0").MessagePort = function() {
  return this.start();
};
$inherits(_MessagePortEventsImpl, _EventsImpl);
function _MessagePortEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
_MessagePortEventsImpl.prototype.get$message = function() {
  return this._get("message");
}
$dynamic("get$name").HTMLMetaElement = function() { return this.name; };
$dynamic("get$value").HTMLMeterElement = function() { return this.value; };
$dynamic("set$value").HTMLMeterElement = function(value) { return this.value = value; };
$dynamic("is$List").NamedNodeMap = function(){return true};
$dynamic("is$Collection").NamedNodeMap = function(){return true};
$dynamic("get$length").NamedNodeMap = function() { return this.length; };
$dynamic("$index").NamedNodeMap = function(index) {
  return this[index];
}
$dynamic("$setindex").NamedNodeMap = function(index, value) {
  $throw(new UnsupportedOperationException("Cannot assign element of immutable List."));
}
$dynamic("iterator").NamedNodeMap = function() {
  return new _FixedSizeListIterator_html_Node(this);
}
$dynamic("add").NamedNodeMap = function(value) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("addAll").NamedNodeMap = function(collection) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("forEach").NamedNodeMap = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").NamedNodeMap = function(f) {
  return _Collections.filter(this, [], f);
}
$dynamic("isEmpty").NamedNodeMap = function() {
  return this.length == (0);
}
$dynamic("sort").NamedNodeMap = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
$dynamic("last").NamedNodeMap = function() {
  return this.$index(this.length - (1));
}
$dynamic("removeLast").NamedNodeMap = function() {
  $throw(new UnsupportedOperationException("Cannot removeLast on immutable List."));
}
$dynamic("add$1").NamedNodeMap = function($0) {
  return this.add($0);
};
$dynamic("filter$1").NamedNodeMap = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").NamedNodeMap = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("sort$1").NamedNodeMap = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
function _ChildNodeListLazy(_this) {
  this._this = _this;
}
_ChildNodeListLazy.prototype.is$List = function(){return true};
_ChildNodeListLazy.prototype.is$Collection = function(){return true};
_ChildNodeListLazy.prototype.last = function() {
  return this._this.lastChild;
}
_ChildNodeListLazy.prototype.add = function(value) {
  this._this.appendChild(value);
}
_ChildNodeListLazy.prototype.addAll = function(collection) {
  for (var $$i = collection.iterator(); $$i.hasNext(); ) {
    var node = $$i.next();
    this._this.appendChild(node);
  }
}
_ChildNodeListLazy.prototype.removeLast = function() {
  var result = this.last();
  if ($ne$(result)) {
    this._this.removeChild(result);
  }
  return result;
}
_ChildNodeListLazy.prototype.clear$_ = function() {
  this._this.set$text("");
}
_ChildNodeListLazy.prototype.$setindex = function(index, value) {
  this._this.replaceChild(value, this.$index(index));
}
_ChildNodeListLazy.prototype.iterator = function() {
  return this._this.get$$$dom_childNodes().iterator();
}
_ChildNodeListLazy.prototype.forEach = function(f) {
  return _Collections.forEach(this, f);
}
_ChildNodeListLazy.prototype.filter = function(f) {
  return new _NodeListWrapper(_Collections.filter(this, [], f));
}
_ChildNodeListLazy.prototype.isEmpty = function() {
  return this.get$length() == (0);
}
_ChildNodeListLazy.prototype.sort = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
_ChildNodeListLazy.prototype.get$length = function() {
  return this._this.get$$$dom_childNodes().length;
}
_ChildNodeListLazy.prototype.$index = function(index) {
  return this._this.get$$$dom_childNodes().$index(index);
}
_ChildNodeListLazy.prototype.add$1 = _ChildNodeListLazy.prototype.add;
_ChildNodeListLazy.prototype.clear$0 = _ChildNodeListLazy.prototype.clear$_;
_ChildNodeListLazy.prototype.filter$1 = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
_ChildNodeListLazy.prototype.forEach$1 = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
_ChildNodeListLazy.prototype.sort$1 = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$inherits(_ListWrapper_Node, _ListWrapper);
function _ListWrapper_Node(_list) {
  this._html_list = _list;
}
_ListWrapper_Node.prototype.add$1 = _ListWrapper_Node.prototype.add;
_ListWrapper_Node.prototype.clear$0 = _ListWrapper_Node.prototype.clear$_;
_ListWrapper_Node.prototype.sort$1 = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$inherits(_NodeListWrapper, _ListWrapper_Node);
function _NodeListWrapper(list) {
  _ListWrapper_Node.call(this, list);
}
_NodeListWrapper.prototype.filter = function(f) {
  return new _NodeListWrapper(this._html_list.filter$1(f));
}
_NodeListWrapper.prototype.filter$1 = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("is$List").NodeList = function(){return true};
$dynamic("is$Collection").NodeList = function(){return true};
$dynamic("iterator").NodeList = function() {
  return new _FixedSizeListIterator_html_Node(this);
}
$dynamic("add").NodeList = function(value) {
  this._parent.appendChild(value);
}
$dynamic("addAll").NodeList = function(collection) {
  for (var $$i = collection.iterator(); $$i.hasNext(); ) {
    var node = $$i.next();
    this._parent.appendChild(node);
  }
}
$dynamic("removeLast").NodeList = function() {
  var result = this.last();
  if ($ne$(result)) {
    this._parent.removeChild(result);
  }
  return result;
}
$dynamic("clear$_").NodeList = function() {
  this._parent.set$text("");
}
$dynamic("$setindex").NodeList = function(index, value) {
  this._parent.replaceChild(value, this.$index(index));
}
$dynamic("forEach").NodeList = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").NodeList = function(f) {
  return new _NodeListWrapper(_Collections.filter(this, [], f));
}
$dynamic("isEmpty").NodeList = function() {
  return this.length == (0);
}
$dynamic("sort").NodeList = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
$dynamic("last").NodeList = function() {
  return this.$index(this.length - (1));
}
$dynamic("get$length").NodeList = function() { return this.length; };
$dynamic("$index").NodeList = function(index) {
  return this[index];
}
$dynamic("add$1").NodeList = function($0) {
  return this.add($0);
};
$dynamic("clear$0").NodeList = function() {
  return this.clear$_();
};
$dynamic("filter$1").NodeList = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").NodeList = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("sort$1").NodeList = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$dynamic("query$1").NodeSelector = function($0) {
  return this.querySelector($0);
};
$dynamic("get$on").Notification = function() {
  return new _NotificationEventsImpl(this);
}
$dynamic("close$0").Notification = function() {
  return this.close();
};
$inherits(_NotificationEventsImpl, _EventsImpl);
function _NotificationEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
_NotificationEventsImpl.prototype.get$click = function() {
  return this._get("click");
}
$dynamic("get$name").HTMLObjectElement = function() { return this.name; };
$dynamic("get$message").OperationNotAllowedException = function() { return this.message; };
$dynamic("get$name").OperationNotAllowedException = function() { return this.name; };
$dynamic("get$value").HTMLOptionElement = function() { return this.value; };
$dynamic("set$value").HTMLOptionElement = function(value) { return this.value = value; };
$dynamic("get$name").HTMLOutputElement = function() { return this.name; };
$dynamic("get$value").HTMLOutputElement = function() { return this.value; };
$dynamic("set$value").HTMLOutputElement = function(value) { return this.value = value; };
$dynamic("get$name").HTMLParamElement = function() { return this.name; };
$dynamic("get$value").HTMLParamElement = function() { return this.value; };
$dynamic("set$value").HTMLParamElement = function(value) { return this.value = value; };
$dynamic("get$on").PeerConnection00 = function() {
  return new _PeerConnection00EventsImpl(this);
}
$dynamic("$dom_addEventListener$3").PeerConnection00 = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").PeerConnection00 = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("close$0").PeerConnection00 = function() {
  return this.close();
};
$inherits(_PeerConnection00EventsImpl, _EventsImpl);
function _PeerConnection00EventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$message").PositionError = function() { return this.message; };
$dynamic("get$value").HTMLProgressElement = function() { return this.value; };
$dynamic("set$value").HTMLProgressElement = function(value) { return this.value = value; };
$dynamic("get$message").RangeException = function() { return this.message; };
$dynamic("get$name").RangeException = function() { return this.name; };
$dynamic("get$message").SQLError = function() { return this.message; };
$dynamic("get$message").SQLException = function() { return this.message; };
$dynamic("get$length").SQLResultSetRowList = function() { return this.length; };
$dynamic("get$elements").SVGElement = function() {
  return new FilteredElementList(this);
}
$dynamic("set$elements").SVGElement = function(value) {
  var elements = this.get$elements();
  elements.clear$0();
  elements.addAll(value);
}
$dynamic("set$innerHTML").SVGElement = function(svg) {
  var container = _ElementFactoryProvider.Element$tag$factory("div");
  container.set$innerHTML(("<svg version=\"1.1\">" + svg + "</svg>"));
  this.set$elements(container.get$elements().get$first().get$elements());
}
$dynamic("get$id").SVGElement = function() {
  return this.id;
}
$dynamic("set$id").SVGElement = function(value) {
  this.id = value;
}
$dynamic("get$value").SVGAngle = function() { return this.value; };
$dynamic("set$value").SVGAngle = function(value) { return this.value = value; };
$inherits(_AttributeClassSet, _CssClassSet);
function _AttributeClassSet() {}
_AttributeClassSet.prototype._write = function(s) {
  this._html_element.get$attributes().$setindex("class", this._formatSet(s));
}
$dynamic("get$on").SVGElementInstance = function() {
  return new _SVGElementInstanceEventsImpl(this);
}
$inherits(_SVGElementInstanceEventsImpl, _EventsImpl);
function _SVGElementInstanceEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
_SVGElementInstanceEventsImpl.prototype.get$click = function() {
  return this._get("click");
}
$dynamic("get$length").SVGElementInstanceList = function() { return this.length; };
$dynamic("get$message").SVGException = function() { return this.message; };
$dynamic("get$name").SVGException = function() { return this.name; };
$dynamic("get$result").SVGFEBlendElement = function() { return this.result; };
$dynamic("get$result").SVGFEColorMatrixElement = function() { return this.result; };
$dynamic("get$result").SVGFEComponentTransferElement = function() { return this.result; };
$dynamic("get$result").SVGFECompositeElement = function() { return this.result; };
$dynamic("get$result").SVGFEConvolveMatrixElement = function() { return this.result; };
$dynamic("get$result").SVGFEDiffuseLightingElement = function() { return this.result; };
$dynamic("get$result").SVGFEDisplacementMapElement = function() { return this.result; };
$dynamic("get$result").SVGFEDropShadowElement = function() { return this.result; };
$dynamic("get$result").SVGFEFloodElement = function() { return this.result; };
$dynamic("get$result").SVGFEGaussianBlurElement = function() { return this.result; };
$dynamic("get$result").SVGFEImageElement = function() { return this.result; };
$dynamic("get$result").SVGFEMergeElement = function() { return this.result; };
$dynamic("get$result").SVGFEMorphologyElement = function() { return this.result; };
$dynamic("get$result").SVGFEOffsetElement = function() { return this.result; };
$dynamic("get$result").SVGFESpecularLightingElement = function() { return this.result; };
$dynamic("get$result").SVGFETileElement = function() { return this.result; };
$dynamic("get$result").SVGFETurbulenceElement = function() { return this.result; };
$dynamic("get$result").SVGFilterPrimitiveStandardAttributes = function() { return this.result; };
$dynamic("get$value").SVGLength = function() { return this.value; };
$dynamic("set$value").SVGLength = function(value) { return this.value = value; };
$dynamic("clear$0").SVGLengthList = function() {
  return this.clear();
};
$dynamic("get$value").SVGNumber = function() { return this.value; };
$dynamic("set$value").SVGNumber = function(value) { return this.value = value; };
$dynamic("clear$0").SVGNumberList = function() {
  return this.clear();
};
$dynamic("clear$0").SVGPathSegList = function() {
  return this.clear();
};
$dynamic("clear$0").SVGPointList = function() {
  return this.clear();
};
$dynamic("clear$0").SVGStringList = function() {
  return this.clear();
};
$dynamic("clear$0").SVGTransformList = function() {
  return this.clear();
};
$dynamic("get$length").HTMLSelectElement = function() { return this.length; };
$dynamic("get$name").HTMLSelectElement = function() { return this.name; };
$dynamic("get$value").HTMLSelectElement = function() { return this.value; };
$dynamic("set$value").HTMLSelectElement = function(value) { return this.value = value; };
$dynamic("set$innerHTML").ShadowRoot = function(value) { return this.innerHTML = value; };
$dynamic("get$on").SharedWorkerContext = function() {
  return new _SharedWorkerContextEventsImpl(this);
}
$dynamic("get$name").SharedWorkerContext = function() { return this.name; };
$inherits(_SharedWorkerContextEventsImpl, _WorkerContextEventsImpl);
function _SharedWorkerContextEventsImpl(_ptr) {
  _WorkerContextEventsImpl.call(this, _ptr);
}
$dynamic("get$length").SpeechGrammarList = function() { return this.length; };
$dynamic("get$length").SpeechInputResultList = function() { return this.length; };
$dynamic("get$on").SpeechRecognition = function() {
  return new _SpeechRecognitionEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").SpeechRecognition = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").SpeechRecognition = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("start$0").SpeechRecognition = function() {
  return this.start();
};
$inherits(_SpeechRecognitionEventsImpl, _EventsImpl);
function _SpeechRecognitionEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
_SpeechRecognitionEventsImpl.prototype.get$result = function() {
  return this._get("result");
}
$dynamic("get$message").SpeechRecognitionError = function() { return this.message; };
$dynamic("get$result").SpeechRecognitionEvent = function() { return this.result; };
$dynamic("get$length").SpeechRecognitionResult = function() { return this.length; };
$dynamic("get$length").SpeechRecognitionResultList = function() { return this.length; };
$dynamic("is$Map").Storage = function(){return true};
$dynamic("containsKey").Storage = function(key) {
  return this.getItem(key) != null;
}
$dynamic("$index").Storage = function(key) {
  return this.getItem(key);
}
$dynamic("$setindex").Storage = function(key, value) {
  return this.setItem(key, value);
}
$dynamic("remove").Storage = function(key) {
  var value = this.$index(key);
  this.removeItem(key);
  return value;
}
$dynamic("clear$_").Storage = function() {
  return this.clear();
}
$dynamic("forEach").Storage = function(f) {
  for (var i = (0);
   true; i = $add$(i, (1))) {
    var key = this.key(i);
    if ($eq$(key)) return;
    f(key, this.$index(key));
  }
}
$dynamic("getKeys").Storage = function() {
  var keys = [];
  this.forEach((function (k, v) {
    return keys.add$1(k);
  })
  );
  return keys;
}
$dynamic("getValues").Storage = function() {
  var values = [];
  this.forEach((function (k, v) {
    return values.add$1(v);
  })
  );
  return values;
}
$dynamic("get$length").Storage = function() {
  return this.get$$$dom_length();
}
$dynamic("isEmpty").Storage = function() {
  return this.key((0)) == null;
}
$dynamic("get$$$dom_length").Storage = function() {
  return this.length;
}
$dynamic("clear$0").Storage = function() {
  return this.clear$_();
};
$dynamic("forEach$1").Storage = function($0) {
  return this.forEach($wrap_call$2(to$call$2($0)));
};
$dynamic("is$List").StyleSheetList = function(){return true};
$dynamic("is$Collection").StyleSheetList = function(){return true};
$dynamic("get$length").StyleSheetList = function() { return this.length; };
$dynamic("$index").StyleSheetList = function(index) {
  return this[index];
}
$dynamic("$setindex").StyleSheetList = function(index, value) {
  $throw(new UnsupportedOperationException("Cannot assign element of immutable List."));
}
$dynamic("iterator").StyleSheetList = function() {
  return new _FixedSizeListIterator_html_StyleSheet(this);
}
$dynamic("add").StyleSheetList = function(value) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("addAll").StyleSheetList = function(collection) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("forEach").StyleSheetList = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").StyleSheetList = function(f) {
  return _Collections.filter(this, [], f);
}
$dynamic("isEmpty").StyleSheetList = function() {
  return this.length == (0);
}
$dynamic("sort").StyleSheetList = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
$dynamic("last").StyleSheetList = function() {
  return this.$index(this.length - (1));
}
$dynamic("removeLast").StyleSheetList = function() {
  $throw(new UnsupportedOperationException("Cannot removeLast on immutable List."));
}
$dynamic("add$1").StyleSheetList = function($0) {
  return this.add($0);
};
$dynamic("filter$1").StyleSheetList = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").StyleSheetList = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("sort$1").StyleSheetList = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$dynamic("get$name").HTMLTextAreaElement = function() { return this.name; };
$dynamic("get$value").HTMLTextAreaElement = function() { return this.value; };
$dynamic("set$value").HTMLTextAreaElement = function(value) { return this.value = value; };
$dynamic("get$on").TextTrack = function() {
  return new _TextTrackEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").TextTrack = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").TextTrack = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_TextTrackEventsImpl, _EventsImpl);
function _TextTrackEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$on").TextTrackCue = function() {
  return new _TextTrackCueEventsImpl(this);
}
$dynamic("get$id").TextTrackCue = function() { return this.id; };
$dynamic("set$id").TextTrackCue = function(value) { return this.id = value; };
$dynamic("$dom_addEventListener$3").TextTrackCue = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").TextTrackCue = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_TextTrackCueEventsImpl, _EventsImpl);
function _TextTrackCueEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$length").TextTrackCueList = function() { return this.length; };
$dynamic("get$on").TextTrackList = function() {
  return new _TextTrackListEventsImpl(this);
}
$dynamic("get$length").TextTrackList = function() { return this.length; };
$dynamic("$dom_addEventListener$3").TextTrackList = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").TextTrackList = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_TextTrackListEventsImpl, _EventsImpl);
function _TextTrackListEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$length").TimeRanges = function() { return this.length; };
$dynamic("is$List").TouchList = function(){return true};
$dynamic("is$Collection").TouchList = function(){return true};
$dynamic("get$length").TouchList = function() { return this.length; };
$dynamic("$index").TouchList = function(index) {
  return this[index];
}
$dynamic("$setindex").TouchList = function(index, value) {
  $throw(new UnsupportedOperationException("Cannot assign element of immutable List."));
}
$dynamic("iterator").TouchList = function() {
  return new _FixedSizeListIterator_html_Touch(this);
}
$dynamic("add").TouchList = function(value) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("addAll").TouchList = function(collection) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("forEach").TouchList = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").TouchList = function(f) {
  return _Collections.filter(this, [], f);
}
$dynamic("isEmpty").TouchList = function() {
  return this.length == (0);
}
$dynamic("sort").TouchList = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
$dynamic("last").TouchList = function() {
  return this.$index(this.length - (1));
}
$dynamic("removeLast").TouchList = function() {
  $throw(new UnsupportedOperationException("Cannot removeLast on immutable List."));
}
$dynamic("add$1").TouchList = function($0) {
  return this.add($0);
};
$dynamic("filter$1").TouchList = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").TouchList = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("sort$1").TouchList = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$dynamic("is$List").Uint16Array = function(){return true};
$dynamic("is$Collection").Uint16Array = function(){return true};
$dynamic("get$length").Uint16Array = function() { return this.length; };
$dynamic("$index").Uint16Array = function(index) {
  return this[index];
}
$dynamic("$setindex").Uint16Array = function(index, value) {
  this[index] = value
}
$dynamic("iterator").Uint16Array = function() {
  return new _FixedSizeListIterator_int(this);
}
$dynamic("add").Uint16Array = function(value) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("addAll").Uint16Array = function(collection) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("forEach").Uint16Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Uint16Array = function(f) {
  return _Collections.filter(this, [], f);
}
$dynamic("isEmpty").Uint16Array = function() {
  return this.length == (0);
}
$dynamic("sort").Uint16Array = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
$dynamic("last").Uint16Array = function() {
  return this.$index(this.length - (1));
}
$dynamic("removeLast").Uint16Array = function() {
  $throw(new UnsupportedOperationException("Cannot removeLast on immutable List."));
}
$dynamic("add$1").Uint16Array = function($0) {
  return this.add($0);
};
$dynamic("filter$1").Uint16Array = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").Uint16Array = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("sort$1").Uint16Array = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$dynamic("is$List").Uint32Array = function(){return true};
$dynamic("is$Collection").Uint32Array = function(){return true};
$dynamic("get$length").Uint32Array = function() { return this.length; };
$dynamic("$index").Uint32Array = function(index) {
  return this[index];
}
$dynamic("$setindex").Uint32Array = function(index, value) {
  this[index] = value
}
$dynamic("iterator").Uint32Array = function() {
  return new _FixedSizeListIterator_int(this);
}
$dynamic("add").Uint32Array = function(value) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("addAll").Uint32Array = function(collection) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("forEach").Uint32Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Uint32Array = function(f) {
  return _Collections.filter(this, [], f);
}
$dynamic("isEmpty").Uint32Array = function() {
  return this.length == (0);
}
$dynamic("sort").Uint32Array = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
$dynamic("last").Uint32Array = function() {
  return this.$index(this.length - (1));
}
$dynamic("removeLast").Uint32Array = function() {
  $throw(new UnsupportedOperationException("Cannot removeLast on immutable List."));
}
$dynamic("add$1").Uint32Array = function($0) {
  return this.add($0);
};
$dynamic("filter$1").Uint32Array = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").Uint32Array = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("sort$1").Uint32Array = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$dynamic("is$List").Uint8Array = function(){return true};
$dynamic("is$Collection").Uint8Array = function(){return true};
$dynamic("get$length").Uint8Array = function() { return this.length; };
$dynamic("$index").Uint8Array = function(index) {
  return this[index];
}
$dynamic("$setindex").Uint8Array = function(index, value) {
  this[index] = value
}
$dynamic("iterator").Uint8Array = function() {
  return new _FixedSizeListIterator_int(this);
}
$dynamic("add").Uint8Array = function(value) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("addAll").Uint8Array = function(collection) {
  $throw(new UnsupportedOperationException("Cannot add to immutable List."));
}
$dynamic("forEach").Uint8Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Uint8Array = function(f) {
  return _Collections.filter(this, [], f);
}
$dynamic("isEmpty").Uint8Array = function() {
  return this.length == (0);
}
$dynamic("sort").Uint8Array = function(compare) {
  $throw(new UnsupportedOperationException("Cannot sort immutable List."));
}
$dynamic("last").Uint8Array = function() {
  return this.$index(this.length - (1));
}
$dynamic("removeLast").Uint8Array = function() {
  $throw(new UnsupportedOperationException("Cannot removeLast on immutable List."));
}
$dynamic("add$1").Uint8Array = function($0) {
  return this.add($0);
};
$dynamic("filter$1").Uint8Array = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").Uint8Array = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("sort$1").Uint8Array = function($0) {
  return this.sort($wrap_call$2(to$call$2($0)));
};
$dynamic("get$name").WebGLActiveInfo = function() { return this.name; };
$dynamic("get$on").WebSocket = function() {
  return new _WebSocketEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").WebSocket = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").WebSocket = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("close$0").WebSocket = function() {
  return this.close();
};
$inherits(_WebSocketEventsImpl, _EventsImpl);
function _WebSocketEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
_WebSocketEventsImpl.prototype.get$message = function() {
  return this._get("message");
}
$dynamic("get$on").DOMWindow = function() {
  return new _WindowEventsImpl(this);
}
$dynamic("get$length").DOMWindow = function() { return this.length; };
$dynamic("get$name").DOMWindow = function() { return this.name; };
$dynamic("$dom_addEventListener$3").DOMWindow = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").DOMWindow = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("close$0").DOMWindow = function() {
  return this.close();
};
$inherits(_WindowEventsImpl, _EventsImpl);
function _WindowEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
_WindowEventsImpl.prototype.get$click = function() {
  return this._get("click");
}
_WindowEventsImpl.prototype.get$error = function() {
  return this._get("error");
}
_WindowEventsImpl.prototype.get$message = function() {
  return this._get("message");
}
$dynamic("get$on").Worker = function() {
  return new _WorkerEventsImpl(this);
}
$dynamic("postMessage$1").Worker = function($0) {
  return this.postMessage($0);
};
$inherits(_WorkerEventsImpl, _AbstractWorkerEventsImpl);
function _WorkerEventsImpl(_ptr) {
  _AbstractWorkerEventsImpl.call(this, _ptr);
}
_WorkerEventsImpl.prototype.get$message = function() {
  return this._get("message");
}
$dynamic("get$on").XMLHttpRequest = function() {
  return new _XMLHttpRequestEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").XMLHttpRequest = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").XMLHttpRequest = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_XMLHttpRequestEventsImpl, _EventsImpl);
function _XMLHttpRequestEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$message").XMLHttpRequestException = function() { return this.message; };
$dynamic("get$name").XMLHttpRequestException = function() { return this.name; };
$dynamic("get$on").XMLHttpRequestUpload = function() {
  return new _XMLHttpRequestUploadEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").XMLHttpRequestUpload = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("$dom_removeEventListener$3").XMLHttpRequestUpload = function($0, $1, $2) {
  return this.removeEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_XMLHttpRequestUploadEventsImpl, _EventsImpl);
function _XMLHttpRequestUploadEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
$dynamic("get$message").XPathException = function() { return this.message; };
$dynamic("get$name").XPathException = function() { return this.name; };
function _AudioElementFactoryProvider() {}
function _BlobBuilderFactoryProvider() {}
function _CSSMatrixFactoryProvider() {}
function _DOMParserFactoryProvider() {}
function _DOMURLFactoryProvider() {}
function _DeprecatedPeerConnectionFactoryProvider() {}
function _EventSourceFactoryProvider() {}
function _FileReaderFactoryProvider() {}
function _FileReaderSyncFactoryProvider() {}
function _IceCandidateFactoryProvider() {}
function _MediaControllerFactoryProvider() {}
function _MediaStreamFactoryProvider() {}
function _MessageChannelFactoryProvider() {}
function _NotificationFactoryProvider() {}
function _OptionElementFactoryProvider() {}
function _PeerConnection00FactoryProvider() {}
function _SessionDescriptionFactoryProvider() {}
function _ShadowRootFactoryProvider() {}
function _SharedWorkerFactoryProvider() {}
function _SpeechGrammarFactoryProvider() {}
function _SpeechGrammarListFactoryProvider() {}
function _SpeechRecognitionFactoryProvider() {}
function _TextTrackCueFactoryProvider() {}
function _WorkerFactoryProvider() {}
function _XMLHttpRequestFactoryProvider() {}
function _XMLSerializerFactoryProvider() {}
function _XPathEvaluatorFactoryProvider() {}
function _XSLTProcessorFactoryProvider() {}
function _Collections() {}
_Collections.forEach = function(iterable, f) {
  for (var $$i = iterable.iterator(); $$i.hasNext(); ) {
    var e = $$i.next();
    f(e);
  }
}
_Collections.filter = function(source, destination, f) {
  for (var $$i = source.iterator(); $$i.hasNext(); ) {
    var e = $$i.next();
    if (f(e)) destination.add(e);
  }
  return destination;
}
function _XMLHttpRequestUtils() {}
function _MeasurementRequest() {}
_MeasurementRequest.prototype.get$value = function() { return this.value; };
_MeasurementRequest.prototype.set$value = function(value) { return this.value = value; };
function _EventFactoryProvider() {}
function _MouseEventFactoryProvider() {}
function _CSSStyleDeclarationFactoryProvider() {}
function _DocumentFragmentFactoryProvider() {}
function _SVGElementFactoryProvider() {}
function _SVGSVGElementFactoryProvider() {}
function _AudioContextFactoryProvider() {}
function _PointFactoryProvider() {}
function _WebSocketFactoryProvider() {}
function _TextFactoryProvider() {}
function _TypedArrayFactoryProvider() {}
function Testing() {}
function _Device() {}
function _VariableSizeListIterator() {}
_VariableSizeListIterator.prototype.hasNext = function() {
  return this._html_array.get$length() > this._html_pos;
}
_VariableSizeListIterator.prototype.next = function() {
  if (!this.hasNext()) {
    $throw(const$0001);
  }
  return this._html_array.$index(this._html_pos++);
}
$inherits(_FixedSizeListIterator, _VariableSizeListIterator);
function _FixedSizeListIterator() {}
_FixedSizeListIterator.prototype.hasNext = function() {
  return this._html_length > this._html_pos;
}
$inherits(_VariableSizeListIterator_dart_core_String, _VariableSizeListIterator);
function _VariableSizeListIterator_dart_core_String(array) {
  this._html_array = array;
  this._html_pos = (0);
}
$inherits(_FixedSizeListIterator_dart_core_String, _FixedSizeListIterator);
function _FixedSizeListIterator_dart_core_String(array) {
  this._html_length = array.get$length();
  _VariableSizeListIterator_dart_core_String.call(this, array);
}
$inherits(_VariableSizeListIterator_int, _VariableSizeListIterator);
function _VariableSizeListIterator_int(array) {
  this._html_array = array;
  this._html_pos = (0);
}
$inherits(_FixedSizeListIterator_int, _FixedSizeListIterator);
function _FixedSizeListIterator_int(array) {
  this._html_length = array.get$length();
  _VariableSizeListIterator_int.call(this, array);
}
$inherits(_VariableSizeListIterator_num, _VariableSizeListIterator);
function _VariableSizeListIterator_num(array) {
  this._html_array = array;
  this._html_pos = (0);
}
$inherits(_FixedSizeListIterator_num, _FixedSizeListIterator);
function _FixedSizeListIterator_num(array) {
  this._html_length = array.get$length();
  _VariableSizeListIterator_num.call(this, array);
}
$inherits(_VariableSizeListIterator_html_Node, _VariableSizeListIterator);
function _VariableSizeListIterator_html_Node(array) {
  this._html_array = array;
  this._html_pos = (0);
}
$inherits(_FixedSizeListIterator_html_Node, _FixedSizeListIterator);
function _FixedSizeListIterator_html_Node(array) {
  this._html_length = array.get$length();
  _VariableSizeListIterator_html_Node.call(this, array);
}
$inherits(_VariableSizeListIterator_html_StyleSheet, _VariableSizeListIterator);
function _VariableSizeListIterator_html_StyleSheet(array) {
  this._html_array = array;
  this._html_pos = (0);
}
$inherits(_FixedSizeListIterator_html_StyleSheet, _FixedSizeListIterator);
function _FixedSizeListIterator_html_StyleSheet(array) {
  this._html_length = array.get$length();
  _VariableSizeListIterator_html_StyleSheet.call(this, array);
}
$inherits(_VariableSizeListIterator_html_Touch, _VariableSizeListIterator);
function _VariableSizeListIterator_html_Touch(array) {
  this._html_array = array;
  this._html_pos = (0);
}
$inherits(_FixedSizeListIterator_html_Touch, _FixedSizeListIterator);
function _FixedSizeListIterator_html_Touch(array) {
  this._html_length = array.get$length();
  _VariableSizeListIterator_html_Touch.call(this, array);
}
function _Lists() {}
function get$$window() {
  return window;
}
function get$$document() {
  return document;
}
var _cachedBrowserPrefix;
var _pendingRequests;
var _pendingMeasurementFrameCallbacks;
var _JSON = JSON;
function json_JSON() {}
json_JSON.parse = function(str) {
  return _JSON.parse(str, (function (_, obj) {
    var keys = _jsKeys(obj);
    if ($eq$(keys)) return obj;
    var map = new HashMapImplementation();
    for (var $$i = keys.iterator(); $$i.hasNext(); ) {
      var key = $$i.next();
      map.$setindex(key, _getValue(obj, key));
    }
    return map;
  })
  );
}
function _getValue(obj, key) {
  return obj[key]
}
function _jsKeys(obj) {
  if (obj != null && typeof obj == 'object' && !(obj instanceof Array)) {
  return Object.keys(obj);
  }
  return null;
}
Uri.fromString$ctor = function(uri) {
  Uri._fromMatch$ctor.call(this, const$0020.firstMatch(uri));
}
Uri.fromString$ctor.prototype = Uri.prototype;
Uri._fromMatch$ctor = function(m) {
  Uri.call(this, Uri._emptyIfNull(m.$index((1))), Uri._emptyIfNull(m.$index((2))), Uri._emptyIfNull(m.$index((3))), Uri._parseIntOrZero(m.$index((4))), Uri._emptyIfNull(m.$index((5))), Uri._emptyIfNull(m.$index((6))), Uri._emptyIfNull(m.$index((7))));
}
Uri._fromMatch$ctor.prototype = Uri.prototype;
function Uri(scheme, userInfo, domain, port, path, query, fragment) {
  this.scheme = scheme;
  this.userInfo = userInfo;
  this.domain = domain;
  this.port = port;
  this.path = path;
  this.query = query;
  this.fragment = fragment;
}
Uri._emptyIfNull = function(val) {
  return val != null ? val : "";
}
Uri._parseIntOrZero = function(val) {
  if (null != val && val != "") {
    return Math.parseInt(val);
  }
  else {
    return (0);
  }
}
Uri.prototype.isAbsolute = function() {
  if ("" == this.scheme) return false;
  if ("" != this.fragment) return false;
  return true;
}
Uri.prototype.hasAuthority = function() {
  return (this.userInfo != "") || (this.domain != "") || (this.port != (0));
}
Uri.prototype.toString = function() {
  var sb = new StringBufferImpl("");
  Uri._addIfNonEmpty(sb, this.scheme, this.scheme, ":");
  if (this.hasAuthority() || (this.scheme == "file")) {
    sb.add("//");
    Uri._addIfNonEmpty(sb, this.userInfo, this.userInfo, "@");
    sb.add(null == this.domain ? "null" : this.domain);
    if (this.port != (0)) {
      sb.add(":");
      sb.add(this.port.toString());
    }
  }
  sb.add(null == this.path ? "null" : this.path);
  Uri._addIfNonEmpty(sb, this.query, "?", this.query);
  Uri._addIfNonEmpty(sb, this.fragment, "#", this.fragment);
  return sb.toString();
}
Uri._addIfNonEmpty = function(sb, test, first, second) {
  if ("" != test) {
    sb.add(null == first ? "null" : first);
    sb.add(null == second ? "null" : second);
  }
}
// Copyright (c) 2012, the Dart project authors.  Please see the AUTHORS file
// for details. All rights reserved. Use of this source code is governed by a
// BSD-style license that can be found in the LICENSE file.

// Top-level native code needed by the frog compiler

var $globalThis = this;
var $globals = null;
var $globalState = null;
var $thisScriptUrl = null;
var $isWorker = typeof ($globalThis['importScripts']) != 'undefined';
var $supportsWorkers =
    $isWorker || ((typeof $globalThis['Worker']) != 'undefined');
function $initGlobals(context) { context.isolateStatics = {}; }
function $setGlobals(context) { $globals = context.isolateStatics; }

// Wrap a 0-arg dom-callback to bind it with the current isolate:
function $wrap_call$0(fn) { return fn && fn.wrap$call$0(); }

Function.prototype.wrap$call$0 = function() {
  var isolateContext = $globalState.currentContext;
  var self = this;
  this.wrap$0 = function() {
    var res = isolateContext.eval(self);
    $globalState.topEventLoop.run();
    return res;
  };
  this.wrap$call$0 = function() { return this.wrap$0; };
  return this.wrap$0;
};

// Wrap a 1-arg dom-callback to bind it with the current isolate:
function $wrap_call$1(fn) { return fn && fn.wrap$call$1(); }

Function.prototype.wrap$call$1 = function() {
  var isolateContext = $globalState.currentContext;
  var self = this;
  this.wrap$1 = function(arg) {
    var res = isolateContext.eval(function() { return self(arg); });
    $globalState.topEventLoop.run();
    return res;
  };
  this.wrap$call$1 = function() { return this.wrap$1; };
  return this.wrap$1;
};

// Wrap a 2-arg dom-callback to bind it with the current isolate:
function $wrap_call$2(fn) { return fn && fn.wrap$call$2(); }

Function.prototype.wrap$call$2 = function() {
  var isolateContext = $globalState.currentContext;
  var self = this;
  this.wrap$2 = function(arg1, arg2) {
    var res = isolateContext.eval(function() { return self(arg1, arg2); });
    $globalState.topEventLoop.run();
    return res;
  };
  this.wrap$call$2 = function() { return this.wrap$2; };
  return this.wrap$2;
};

$thisScriptUrl = (function () {
  if (!$supportsWorkers || $isWorker) return (void 0);

  // TODO(5334778): Find a cross-platform non-brittle way of getting the
  // currently running script.
  var scripts = document.getElementsByTagName('script');
  // The scripts variable only contains the scripts that have already been
  // executed. The last one is the currently running script.
  var script = scripts[scripts.length - 1];
  var src = script && script.src;
  if (!src) {
    // TODO()
    src = "FIXME:5407062" + "_" + Math.random().toString();
    if (script) script.src = src;
  }
  return src;
})();
function _Manager() {
  this.nextIsolateId = (0);
  this.currentManagerId = (0);
  this.nextManagerId = (1);
  this.currentContext = null;
  this.rootContext = null;
  this._nativeDetectEnvironment();
  this.topEventLoop = new _EventLoop();
  this.isolates = new HashMapImplementation_int$_IsolateContext();
  this.managers = new HashMapImplementation_int$_ManagerStub();
  if (this.isWorker) {
    this.mainManager = new _MainManagerStub();
    this._nativeInitWorkerMessageHandler();
  }
}
_Manager.prototype.get$useWorkers = function() {
  return this.supportsWorkers;
}
_Manager.prototype.get$needSerialization = function() {
  return this.get$useWorkers();
}
_Manager.prototype._nativeDetectEnvironment = function() {
      this.isWorker = $isWorker;
      this.supportsWorkers = $supportsWorkers;
      this.fromCommandLine = typeof(window) == 'undefined';
    
}
_Manager.prototype._nativeInitWorkerMessageHandler = function() {
      $globalThis.onmessage = function (e) {
        _IsolateNatives._processWorkerMessage(this.mainManager, e);
      }
    
}
_Manager.prototype.maybeCloseWorker = function() {
  if (this.isolates.isEmpty()) {
    this.mainManager.postMessage(_serializeMessage(_map(["command", "close"])));
  }
}
function _IsolateContext() {
  var $0, $1;
  this.id = (($0 = get$$_globalState()).nextIsolateId = ($1 = $0.nextIsolateId) + (1), $1);
  this.ports = new HashMapImplementation_int$ReceivePort();
  this.initGlobals();
}
_IsolateContext.prototype.get$id = function() { return this.id; };
_IsolateContext.prototype.set$id = function(value) { return this.id = value; };
_IsolateContext.prototype.get$ports = function() { return this.ports; };
_IsolateContext.prototype.initGlobals = function() {
  $initGlobals(this);
}
_IsolateContext.prototype.eval = function(code) {
  var old = get$$_globalState().currentContext;
  get$$_globalState().currentContext = this;
  this._setGlobals();
  var result = null;
  try {
    result = code.call$0();
  } finally {
    get$$_globalState().currentContext = old;
    if ($ne$(old)) old._setGlobals();
  }
  return result;
}
_IsolateContext.prototype._setGlobals = function() {
  $setGlobals(this);
}
_IsolateContext.prototype.lookup = function(portId) {
  return this.ports.$index(portId);
}
_IsolateContext.prototype.register = function(portId, port) {
  if (this.ports.containsKey(portId)) {
    $throw(new ExceptionImplementation("Registry: ports must be registered only once."));
  }
  this.ports.$setindex(portId, port);
  get$$_globalState().isolates.$setindex(this.id, this);
}
_IsolateContext.prototype.unregister = function(portId) {
  this.ports.remove(portId);
  if (this.ports.isEmpty()) {
    get$$_globalState().isolates.remove(this.id);
  }
}
function _EventLoop() {
  this.events = new DoubleLinkedQueue__IsolateEvent();
}
_EventLoop.prototype.enqueue = function(isolate, fn, msg) {
  this.events.addLast(new _IsolateEvent(isolate, fn, msg));
}
_EventLoop.prototype.dequeue = function() {
  if (this.events.isEmpty()) return null;
  return this.events.removeFirst();
}
_EventLoop.prototype.runIteration = function() {
  var event = this.dequeue();
  if ($eq$(event)) {
    if (get$$_globalState().isWorker) {
      get$$_globalState().maybeCloseWorker();
    }
    else if (get$$_globalState().rootContext != null && get$$_globalState().isolates.containsKey(get$$_globalState().rootContext.id) && get$$_globalState().fromCommandLine && get$$_globalState().rootContext.ports.isEmpty()) {
      $throw(new ExceptionImplementation("Program exited with open ReceivePorts."));
    }
    return false;
  }
  event.process();
  return true;
}
_EventLoop.prototype._runHelper = function() {
  var $this = this;
  if (get$$_window() != null) {
    function next() {
      if (!$this.runIteration()) return;
      get$$_window().setTimeout(next, (0));
    }
    next();
  }
  else {
    while (this.runIteration()) {
    }
  }
}
_EventLoop.prototype.run = function() {
  if (!get$$_globalState().isWorker) {
    this._runHelper();
  }
  else {
    try {
      this._runHelper();
    } catch (e) {
      var trace = _stackTraceOf(e);
      e = _toDartException(e);
      get$$_globalState().mainManager.postMessage(_serializeMessage(_map(["command", "error", "msg", ("" + e + "\n" + trace)])));
    }
  }
}
function _IsolateEvent(isolate, fn, message) {
  this.isolate = isolate;
  this.fn = fn;
  this.message = message;
}
_IsolateEvent.prototype.get$message = function() { return this.message; };
_IsolateEvent.prototype.process = function() {
  this.isolate.eval(this.fn);
}
function _MainManagerStub() {

}
_MainManagerStub.prototype.get$id = function() {
  return (0);
}
_MainManagerStub.prototype.set$id = function(i) {
  $throw(new NotImplementedException());
}
_MainManagerStub.prototype.postMessage = function(msg) {
  $globalThis.postMessage(msg);
}
_MainManagerStub.prototype.terminate = function() {

}
_MainManagerStub.prototype.set$onmessage = function(f) {
  $throw(new ExceptionImplementation("onmessage should not be set on MainManagerStub"));
}
_MainManagerStub.prototype.postMessage$1 = _MainManagerStub.prototype.postMessage;
$dynamic("get$id").Worker = function() {
  return this.id;
}
$dynamic("set$id").Worker = function(i) {
  this.id = i;
}
$dynamic("postMessage").Worker = function(msg) {
  return this.postMessage(msg);
}
$dynamic("set$onmessage").Worker = function(f) {
  this.onmessage = f;
}
$dynamic("postMessage$1").Worker = function($0) {
  return this.postMessage($0);
};
function _IsolateNatives() {}
_IsolateNatives.get$_thisScript = function() {
  return $thisScriptUrl
}
_IsolateNatives._newWorker = function(url) {
  return new Worker(url);
}
_IsolateNatives._spawnWorker = function(factoryName, serializedReplyPort) {
  var $0, $1;
  var worker = _IsolateNatives._newWorker(_IsolateNatives.get$_thisScript());
  worker.set$onmessage((function (e) {
    _IsolateNatives._processWorkerMessage(worker, e);
  })
  );
  var workerId = (($0 = get$$_globalState()).nextManagerId = ($1 = $0.nextManagerId) + (1), $1);
  worker.set$id(workerId);
  get$$_globalState().managers.$setindex(workerId, worker);
  worker.postMessage$1(_serializeMessage(_map(["command", "start", "id", workerId, "replyTo", serializedReplyPort, "factoryName", factoryName])));
}
_IsolateNatives._getEventData = function(e) {
  return e.data
}
_IsolateNatives._processWorkerMessage = function(sender, e) {
  var msg = _deserializeMessage(_IsolateNatives._getEventData(e));
  switch (msg.$index("command")) {
    case "start":

      get$$_globalState().currentManagerId = msg.$index("id");
      var runnerObject = _IsolateNatives._allocate(_IsolateNatives._getJSConstructorFromName(msg.$index("factoryName")));
      var serializedReplyTo = msg.$index("replyTo");
      get$$_globalState().topEventLoop.enqueue(new _IsolateContext(), function function_() {
        var replyTo = _deserializeMessage(serializedReplyTo);
        _IsolateNatives._startIsolate(runnerObject, replyTo);
      }
      , "worker-start");
      get$$_globalState().topEventLoop.run();
      break;

    case "start2":

      get$$_globalState().currentManagerId = msg.$index("id");
      var entryPoint = _IsolateNatives._getJSFunctionFromName(msg.$index("functionName"));
      var replyTo = _deserializeMessage(msg.$index("replyTo"));
      get$$_globalState().topEventLoop.enqueue(new _IsolateContext(), function function_() {
        _IsolateNatives._startIsolate2(entryPoint, replyTo);
      }
      , "worker-start");
      get$$_globalState().topEventLoop.run();
      break;

    case "spawn-worker":

      _IsolateNatives._spawnWorker(msg.$index("factoryName"), msg.$index("replyPort"));
      break;

    case "spawn-worker2":

      _IsolateNatives._spawnWorker2(msg.$index("functionName"), msg.$index("uri"), msg.$index("replyPort"));
      break;

    case "message":

      msg.$index("port").send$2(msg.$index("msg"), msg.$index("replyTo"));
      get$$_globalState().topEventLoop.run();
      break;

    case "close":

      _IsolateNatives._log("Closing Worker");
      get$$_globalState().managers.remove(sender.get$id());
      sender.terminate();
      get$$_globalState().topEventLoop.run();
      break;

    case "log":

      _IsolateNatives._log(msg.$index("msg"));
      break;

    case "print":

      if (get$$_globalState().isWorker) {
        get$$_globalState().mainManager.postMessage(_serializeMessage(_map(["command", "print", "msg", msg])));
      }
      else {
        print$(msg.$index("msg"));
      }
      break;

    case "error":

      $throw(msg.$index("msg"));

  }
}
_IsolateNatives._log = function(msg) {
  if (get$$_globalState().isWorker) {
    get$$_globalState().mainManager.postMessage(_serializeMessage(_map(["command", "log", "msg", msg])));
  }
  else {
    try {
      _IsolateNatives._consoleLog(msg);
    } catch (e) {
      var trace = _stackTraceOf(e);
      e = _toDartException(e);
      $throw(new ExceptionImplementation(trace));
    }
  }
}
_IsolateNatives._consoleLog = function(msg) {
  $globalThis.console.log(msg);
}
_IsolateNatives._getJSConstructorFromName = function(factoryName) {
      return $globalThis[factoryName];
    
}
_IsolateNatives._getJSFunctionFromName = function(functionName) {
      return $globalThis[functionName];
    
}
_IsolateNatives._allocate = function(ctor) {
  return new ctor();
}
_IsolateNatives._startIsolate = function(isolate, replyTo) {
  _fillStatics(get$$_globalState().currentContext);
  var port0 = _ReceivePortFactory.ReceivePort$factory();
  replyTo.send("spawned", port0.toSendPort());
  isolate._run(port0);
}
_IsolateNatives._startIsolate2 = function(topLevel, replyTo) {
  _fillStatics(get$$_globalState().currentContext);
  $globals._port = _ReceivePortFactory.ReceivePort$factory();
  replyTo.send("spawned", get$$port().toSendPort());
  topLevel.call$0();
}
_IsolateNatives._spawnWorker2 = function(functionName, uri, replyPort) {
  var $0, $1;
  if ($eq$(functionName)) functionName = "main";
  if ($eq$(uri)) uri = _IsolateNatives.get$_thisScript();
  if (!(new Uri.fromString$ctor(uri).isAbsolute())) {
    var prefix = _IsolateNatives.get$_thisScript().substring((0), _IsolateNatives.get$_thisScript().lastIndexOf("/"));
    uri = ("" + prefix + "/" + uri);
  }
  var worker = _IsolateNatives._newWorker(uri);
  worker.set$onmessage((function (e) {
    _IsolateNatives._processWorkerMessage(worker, e);
  })
  );
  var workerId = (($0 = get$$_globalState()).nextManagerId = ($1 = $0.nextManagerId) + (1), $1);
  worker.set$id(workerId);
  get$$_globalState().managers.$setindex(workerId, worker);
  worker.postMessage$1(_serializeMessage(_map(["command", "start2", "id", workerId, "replyTo", _serializeMessage(replyPort), "functionName", functionName])));
}
function _BaseSendPort(_isolateId) {
  this._isolateId = _isolateId;
}
_BaseSendPort.prototype.get$_isolateId = function() { return this._isolateId; };
_BaseSendPort.checkReplyTo = function(replyTo) {
  if (null != replyTo && !(replyTo instanceof _NativeJsSendPort) && !(replyTo instanceof _WorkerSendPort) && !(replyTo instanceof _BufferingSendPort)) {
    $throw(new ExceptionImplementation("SendPort.send: Illegal replyTo port type"));
  }
}
_BaseSendPort.prototype.send$2 = _BaseSendPort.prototype.send;
$inherits(_NativeJsSendPort, _BaseSendPort);
function _NativeJsSendPort(_receivePort, isolateId) {
  this._receivePort = _receivePort;
  _BaseSendPort.call(this, isolateId);
}
_NativeJsSendPort.prototype.get$_receivePort = function() { return this._receivePort; };
_NativeJsSendPort.prototype.send = function(message, replyTo) {
  var $this = this;
  _waitForPendingPorts([message, replyTo], (function () {
    _BaseSendPort.checkReplyTo(replyTo);
    var isolate = get$$_globalState().isolates.$index($this._isolateId);
    if ($eq$(isolate)) return;
    if ($this._receivePort._callback == null) return;
    var shouldSerialize = get$$_globalState().currentContext != null && get$$_globalState().currentContext.id != $this._isolateId;
    var msg = message;
    var reply = replyTo;
    if (shouldSerialize) {
      msg = _serializeMessage(msg);
      reply = _serializeMessage(reply);
    }
    get$$_globalState().topEventLoop.enqueue(isolate, (function () {
      if ($this._receivePort._callback != null) {
        if (shouldSerialize) {
          msg = _deserializeMessage(msg);
          reply = _deserializeMessage(reply);
        }
        $this._receivePort._callback.call$2(msg, reply);
      }
    })
    , $add$("receive ", message));
  })
  );
}
_NativeJsSendPort.prototype.$eq = function(other) {
  return ((other instanceof _NativeJsSendPort)) && ($eq$(this._receivePort, other.get$_receivePort()));
}
_NativeJsSendPort.prototype.hashCode = function() {
  return this._receivePort._id;
}
_NativeJsSendPort.prototype.send$2 = _NativeJsSendPort.prototype.send;
$inherits(_WorkerSendPort, _BaseSendPort);
function _WorkerSendPort(_workerId, isolateId, _receivePortId) {
  this._workerId = _workerId;
  this._receivePortId = _receivePortId;
  _BaseSendPort.call(this, isolateId);
}
_WorkerSendPort.prototype.get$_workerId = function() { return this._workerId; };
_WorkerSendPort.prototype.get$_receivePortId = function() { return this._receivePortId; };
_WorkerSendPort.prototype.send = function(message, replyTo) {
  var $this = this;
  _waitForPendingPorts([message, replyTo], (function () {
    _BaseSendPort.checkReplyTo(replyTo);
    var workerMessage = _serializeMessage(_map(["command", "message", "port", $this, "msg", message, "replyTo", replyTo]));
    if (get$$_globalState().isWorker) {
      get$$_globalState().mainManager.postMessage(workerMessage);
    }
    else {
      get$$_globalState().managers.$index($this._workerId).postMessage$1(workerMessage);
    }
  })
  );
}
_WorkerSendPort.prototype.$eq = function(other) {
  return ((other instanceof _WorkerSendPort)) && (this._workerId == other.get$_workerId()) && (this._isolateId == other.get$_isolateId()) && (this._receivePortId == other.get$_receivePortId());
}
_WorkerSendPort.prototype.hashCode = function() {
  return (this._workerId << (16)) ^ (this._isolateId << (8)) ^ this._receivePortId;
}
_WorkerSendPort.prototype.send$2 = _WorkerSendPort.prototype.send;
$inherits(_BufferingSendPort, _BaseSendPort);
function _BufferingSendPort() {}
_BufferingSendPort.prototype.get$_id = function() { return this._id; };
_BufferingSendPort.prototype.send = function(message, replyTo) {
  if (this._port != null) {
    this._port.send(message, replyTo);
  }
  else {
    this.pending.add(_map(["message", message, "replyTo", replyTo]));
  }
}
_BufferingSendPort.prototype.$eq = function(other) {
  return (other instanceof _BufferingSendPort) && this._id == other.get$_id();
}
_BufferingSendPort.prototype.hashCode = function() {
  return this._id;
}
_BufferingSendPort.prototype.send$2 = _BufferingSendPort.prototype.send;
function _ReceivePortFactory() {}
_ReceivePortFactory.ReceivePort$factory = function() {
  return new _ReceivePortImpl();
}
function _ReceivePortImpl() {
  this._id = $globals._ReceivePortImpl__nextFreeId++;
  get$$_globalState().currentContext.register(this._id, this);
}
_ReceivePortImpl.prototype.get$_id = function() { return this._id; };
_ReceivePortImpl.prototype.receive = function(onMessage) {
  this._callback = onMessage;
}
_ReceivePortImpl.prototype.close = function() {
  this._callback = null;
  get$$_globalState().currentContext.unregister(this._id);
}
_ReceivePortImpl.prototype.toSendPort = function() {
  return new _NativeJsSendPort(this, get$$_globalState().currentContext.id);
}
_ReceivePortImpl.prototype.close$0 = _ReceivePortImpl.prototype.close;
function _MessageTraverser() {

}
_MessageTraverser.prototype.traverse = function(x) {
  if (_MessageTraverser.isPrimitive(x)) return this.visitPrimitive(x);
  this._taggedObjects = new Array();
  var result;
  try {
    result = this._dispatch(x);
  } finally {
    this._cleanup();
  }
  return result;
}
_MessageTraverser.prototype._cleanup = function() {
  var len = this._taggedObjects.get$length();
  for (var i = (0);
   i < len; i++) {
    this._clearAttachedInfo(this._taggedObjects.$index(i));
  }
  this._taggedObjects = null;
}
_MessageTraverser.prototype._attachInfo = function(o, info) {
  this._taggedObjects.add(o);
  this._setAttachedInfo(o, info);
}
_MessageTraverser.prototype._getInfo = function(o) {
  return this._getAttachedInfo(o);
}
_MessageTraverser.prototype._dispatch = function(x) {
  if (_MessageTraverser.isPrimitive(x)) return this.visitPrimitive(x);
  if (!!(x && x.is$List())) return this.visitList(x);
  if (!!(x && x.is$Map())) return this.visitMap(x);
  if ((x instanceof _NativeJsSendPort)) return this.visitNativeJsSendPort(x);
  if ((x instanceof _WorkerSendPort)) return this.visitWorkerSendPort(x);
  if ((x instanceof _BufferingSendPort)) return this.visitBufferingSendPort(x);
  $throw(("Message serialization: Illegal value " + x + " passed"));
}
_MessageTraverser.prototype._clearAttachedInfo = function(o) {
  o['__MessageTraverser__attached_info__'] = (void 0);
}
_MessageTraverser.prototype._setAttachedInfo = function(o, info) {
  o['__MessageTraverser__attached_info__'] = info;
}
_MessageTraverser.prototype._getAttachedInfo = function(o) {
  return o['__MessageTraverser__attached_info__'];
}
_MessageTraverser.prototype._visitNativeOrWorkerPort = function(p) {
  if ((p instanceof _NativeJsSendPort)) return this.visitNativeJsSendPort(p);
  if ((p instanceof _WorkerSendPort)) return this.visitWorkerSendPort(p);
  $throw(("Illegal underlying port " + p));
}
_MessageTraverser.isPrimitive = function(x) {
  return (null == x) || ((typeof(x) == 'string')) || ((typeof(x) == 'number')) || ((typeof(x) == 'boolean'));
}
$inherits(_PendingSendPortFinder, _MessageTraverser);
function _PendingSendPortFinder() {
  this.ports = [];
  _MessageTraverser.call(this);
}
_PendingSendPortFinder.prototype.get$ports = function() { return this.ports; };
_PendingSendPortFinder.prototype.visitPrimitive = function(x) {

}
_PendingSendPortFinder.prototype.visitNativeJsSendPort = function(port) {

}
_PendingSendPortFinder.prototype.visitWorkerSendPort = function(port) {

}
_PendingSendPortFinder.prototype.visitList = function(list) {
  var $this = this;
  var visited = this._getInfo(list);
  if (null != visited) return;
  this._attachInfo(list, true);
  list.forEach$1((function (e) {
    return $this._dispatch(e);
  })
  );
}
_PendingSendPortFinder.prototype.visitMap = function(map) {
  var $this = this;
  var visited = this._getInfo(map);
  if (null != visited) return;
  this._attachInfo(map, true);
  map.getValues().forEach$1((function (e) {
    return $this._dispatch(e);
  })
  );
}
_PendingSendPortFinder.prototype.visitBufferingSendPort = function(port) {
  if ($eq$(port._port)) {
    this.ports.add(port._futurePort);
  }
}
$inherits(_Copier, _MessageTraverser);
function _Copier() {
  _MessageTraverser.call(this);
}
_Copier.prototype.visitPrimitive = function(x) {
  return x;
}
_Copier.prototype.visitList = function(list) {
  var copy = this._getInfo(list);
  if (null != copy) return copy;
  var len = list.get$length();
  copy = new Array(len);
  this._attachInfo(list, copy);
  for (var i = (0);
   i < len; i++) {
    copy.$setindex(i, this._dispatch(list.$index(i)));
  }
  return copy;
}
_Copier.prototype.visitMap = function(map) {
  var $this = this;
  var copy = this._getInfo(map);
  if (null != copy) return copy;
  copy = new HashMapImplementation();
  this._attachInfo(map, copy);
  map.forEach$1((function (key, val) {
    copy.$setindex($this._dispatch(key), $this._dispatch(val));
  })
  );
  return copy;
}
_Copier.prototype.visitNativeJsSendPort = function(port) {
  return new _NativeJsSendPort(port._receivePort, port._isolateId);
}
_Copier.prototype.visitWorkerSendPort = function(port) {
  return new _WorkerSendPort(port._workerId, port._isolateId, port._receivePortId);
}
_Copier.prototype.visitBufferingSendPort = function(port) {
  if (port._port != null) {
    return this._visitNativeOrWorkerPort(port._port);
  }
  else {
    $throw("internal error: must call _waitForPendingPorts to ensure all ports are resolved at this point.");
  }
}
$inherits(_Serializer, _MessageTraverser);
function _Serializer() {
  this._nextFreeRefId = (0);
  _MessageTraverser.call(this);
}
_Serializer.prototype.visitPrimitive = function(x) {
  return x;
}
_Serializer.prototype.visitList = function(list) {
  var copyId = this._getInfo(list);
  if (null != copyId) return ["ref", copyId];
  var id = this._nextFreeRefId++;
  this._attachInfo(list, id);
  var jsArray = this._serializeList(list);
  return ["list", id, jsArray];
}
_Serializer.prototype.visitMap = function(map) {
  var copyId = this._getInfo(map);
  if (null != copyId) return ["ref", copyId];
  var id = this._nextFreeRefId++;
  this._attachInfo(map, id);
  var keys = this._serializeList(map.getKeys());
  var values = this._serializeList(map.getValues());
  return ["map", id, keys, values];
}
_Serializer.prototype.visitNativeJsSendPort = function(port) {
  return ["sendport", get$$_globalState().currentManagerId, port._isolateId, port._receivePort._id];
}
_Serializer.prototype.visitWorkerSendPort = function(port) {
  return ["sendport", port._workerId, port._isolateId, port._receivePortId];
}
_Serializer.prototype.visitBufferingSendPort = function(port) {
  if (port._port != null) {
    return this._visitNativeOrWorkerPort(port._port);
  }
  else {
    $throw("internal error: must call _waitForPendingPorts to ensure all ports are resolved at this point.");
  }
}
_Serializer.prototype._serializeList = function(list) {
  var len = list.get$length();
  var result = new Array(len);
  for (var i = (0);
   i < len; i++) {
    result.$setindex(i, this._dispatch(list.$index(i)));
  }
  return result;
}
function _Deserializer() {

}
_Deserializer.isPrimitive = function(x) {
  return (null == x) || ((typeof(x) == 'string')) || ((typeof(x) == 'number')) || ((typeof(x) == 'boolean'));
}
_Deserializer.prototype.deserialize = function(x) {
  if (_Deserializer.isPrimitive(x)) return x;
  this._deserialized = new HashMapImplementation();
  return this._deserializeHelper(x);
}
_Deserializer.prototype._deserializeHelper = function(x) {
  if (_Deserializer.isPrimitive(x)) return x;
  switch (x.$index((0))) {
    case "ref":

      return this._deserializeRef(x);

    case "list":

      return this._deserializeList(x);

    case "map":

      return this._deserializeMap(x);

    case "sendport":

      return this._deserializeSendPort(x);

    default:

      $throw("Unexpected serialized object");

  }
}
_Deserializer.prototype._deserializeRef = function(x) {
  var id = x.$index((1));
  var result = this._deserialized.$index(id);
  return result;
}
_Deserializer.prototype._deserializeList = function(x) {
  var id = x.$index((1));
  var dartList = x.$index((2));
  this._deserialized.$setindex(id, dartList);
  var len = dartList.get$length();
  for (var i = (0);
   i < len; i++) {
    dartList.$setindex(i, this._deserializeHelper(dartList.$index(i)));
  }
  return dartList;
}
_Deserializer.prototype._deserializeMap = function(x) {
  var result = new HashMapImplementation();
  var id = x.$index((1));
  this._deserialized.$setindex(id, result);
  var keys = x.$index((2));
  var values = x.$index((3));
  var len = keys.get$length();
  for (var i = (0);
   i < len; i++) {
    var key = this._deserializeHelper(keys.$index(i));
    var value = this._deserializeHelper(values.$index(i));
    result.$setindex(key, value);
  }
  return result;
}
_Deserializer.prototype._deserializeSendPort = function(x) {
  var managerId = x.$index((1));
  var isolateId = x.$index((2));
  var receivePortId = x.$index((3));
  if (managerId == get$$_globalState().currentManagerId) {
    var isolate = get$$_globalState().isolates.$index(isolateId);
    if ($eq$(isolate)) return null;
    var receivePort = isolate.lookup(receivePortId);
    return new _NativeJsSendPort(receivePort, isolateId);
  }
  else {
    return new _WorkerSendPort(managerId, isolateId, receivePortId);
  }
}
function get$$port() {
  return $globals._port;
}
function startRootIsolate(entry) {
  set$$_globalState(new _Manager());
  if (get$$_globalState().isWorker) return;
  var rootContext = new _IsolateContext();
  get$$_globalState().rootContext = rootContext;
  _fillStatics(rootContext);
  get$$_globalState().currentContext = rootContext;
  rootContext.eval(entry);
  get$$_globalState().topEventLoop.run();
}
function get$$_globalState() {
  return $globalState;
}
function set$$_globalState(val) {
  $globalState = val;
}
function _fillStatics(context) {
    $globals = context.isolateStatics;
    $static_init();
}
var _port;
function get$$_window() {
  return typeof window != 'undefined' ? window : (void 0);
}
function _waitForPendingPorts(message, callback) {
  var finder = new _PendingSendPortFinder();
  finder.traverse(message);
  Futures.wait(finder.get$ports()).then((function (_) {
    return callback();
  })
  );
}
function _serializeMessage(message) {
  if (get$$_globalState().get$needSerialization()) {
    return new _Serializer().traverse(message);
  }
  else {
    return new _Copier().traverse(message);
  }
}
function _deserializeMessage(message) {
  if (get$$_globalState().get$needSerialization()) {
    return new _Deserializer().deserialize(message);
  }
  else {
    return message;
  }
}
function Configuration() {

}
Configuration.prototype.onInit = function() {

}
Configuration.prototype.onStart = function() {

}
Configuration.prototype.onDone = function(passed, failed, errors, results, uncaughtError) {
  var $$list = $globals._tests;
  for (var $$i = $$list.iterator(); $$i.hasNext(); ) {
    var t = $$i.next();
    print$(("" + t.get$result().toUpperCase() + ": " + t.get$description()));
    if ($ne$(t.get$message(), "")) {
      print$(("  " + t.get$message()));
    }
  }
  print$("");
  var success = false;
  if (passed == (0) && failed == (0) && errors == (0)) {
    print$("No tests found.");
  }
  else if (failed == (0) && errors == (0) && uncaughtError == null) {
    print$(("All " + passed + " tests passed."));
    success = true;
  }
  else {
    if (uncaughtError != null) {
      print$(("Top-level uncaught error: " + uncaughtError));
    }
    print$(("" + passed + " PASSED, " + failed + " FAILED, " + errors + " ERRORS"));
  }
  if (!success) $throw(new ExceptionImplementation("Some tests failed."));
}
function TestCase(id, description, test, callbacks) {
  this.message = "";
  this.id = id;
  this.description = description;
  this.test = test;
  this.callbacks = callbacks;
  this.currentGroup = $globals._currentGroup;
}
TestCase.prototype.get$id = function() { return this.id; };
TestCase.prototype.get$description = function() { return this.description; };
TestCase.prototype.get$callbacks = function() { return this.callbacks; };
TestCase.prototype.get$message = function() { return this.message; };
TestCase.prototype.get$result = function() { return this.result; };
TestCase.prototype.get$currentGroup = function() { return this.currentGroup; };
TestCase.prototype.get$isComplete = function() {
  return this.result != null;
}
TestCase.prototype.pass = function() {
  this.result = "pass";
}
TestCase.prototype.fail = function(message, stackTrace) {
  this.result = "fail";
  this.message = message;
  this.stackTrace = stackTrace;
}
TestCase.prototype.error = function(message, stackTrace) {
  this.result = "error";
  this.message = message;
  this.stackTrace = stackTrace;
}
TestCase.prototype.error$2 = TestCase.prototype.error;
TestCase.prototype.test$0 = function() {
  return this.test();
};
function configure(config) {
  $globals._config = config;
}
var _tests;
var _testRunner;
function test(spec, body) {
  ensureInitialized();
  $globals._tests.add(new TestCase($globals._tests.get$length() + (1), _fullSpec(spec), body, (0)));
}
function group(description, body) {
  ensureInitialized();
  var oldGroup = $globals._currentGroup;
  if ($globals._currentGroup != "") {
    $globals._currentGroup = ("" + $globals._currentGroup + " " + description);
  }
  else {
    $globals._currentGroup = description;
  }
  try {
    body();
  } finally {
    $globals._currentGroup = oldGroup;
  }
}
function reportTestError(msg, trace) {
  if ($globals._currentTest < $globals._tests.get$length()) {
    var testCase = $globals._tests.$index($globals._currentTest);
    testCase.error$2(msg, trace);
    $globals._state = (3);
    if (testCase.get$callbacks() > (0)) {
      $globals._currentTest++;
      $globals._testRunner.call$0();
    }
  }
  else {
    $globals._uncaughtErrorMessage = ("" + msg + ": " + trace);
  }
}
function _defer(callback) {
  var port0 = _ReceivePortFactory.ReceivePort$factory();
  port0.receive((function (msg, reply) {
    callback();
    port0.close$0();
  })
  );
  port0.toSendPort().send();
}
function _runTests() {
  $globals._config.onStart();
  _defer((function () {
    $globals._testRunner.call$0();
  })
  );
}
function _guard(tryBody, finallyBody) {
  try {
    return tryBody.call$0();
  } catch ($$ex) {
    var $$trace = _stackTraceOf($$ex);
    $$ex = _toDartException($$ex);
    if (($$ex instanceof ExpectException)) {
      var e = $$ex;
      var trace = $$trace;
      if ($globals._state != (3)) {
        $globals._tests.$index($globals._currentTest).fail(e.message, $eq$(trace) ? "" : trace.toString());
      }
    } else {
      var e = $$ex;
      var trace = $$trace;
      if ($globals._state != (3)) {
        $globals._tests.$index($globals._currentTest).error$2(("Caught " + e), $eq$(trace) ? "" : trace.toString());
      }
    }
  } finally {
    $globals._state = (1);
    if ($ne$(finallyBody)) finallyBody.call$0();
  }
}
function _nextBatch() {
  while ($globals._currentTest < $globals._tests.get$length()) {
    var testCase = $globals._tests.$index($globals._currentTest);
    _guard((function (testCase) {
      $globals._callbacksCalled = (0);
      $globals._state = (2);
      testCase.test$0();
      if ($globals._state != (3)) {
        if (testCase.get$callbacks() == $globals._callbacksCalled) {
          testCase.pass();
        }
      }
    }).bind(null, testCase)
    );
    if (!testCase.get$isComplete() && testCase.get$callbacks() > (0)) return;
    $globals._currentTest++;
  }
  _completeTests();
}
function _completeTests() {
  $globals._state = (0);
  var testsPassed_ = (0);
  var testsFailed_ = (0);
  var testsErrors_ = (0);
  var $$list = $globals._tests;
  for (var $$i = $$list.iterator(); $$i.hasNext(); ) {
    var t = $$i.next();
    switch (t.result) {
      case "pass":

        testsPassed_++;
        break;

      case "fail":

        testsFailed_++;
        break;

      case "error":

        testsErrors_++;
        break;

    }
  }
  $globals._config.onDone(testsPassed_, testsFailed_, testsErrors_, $globals._tests, $globals._uncaughtErrorMessage);
}
function _fullSpec(spec) {
  if (null == spec) return ("" + $globals._currentGroup);
  return $globals._currentGroup != "" ? ("" + $globals._currentGroup + " " + spec) : spec;
}
function ensureInitialized() {
  if ($globals._state != (0)) return;
  $globals._tests = [];
  $globals._currentGroup = "";
  $globals._state = (1);
  $globals._testRunner = _nextBatch;
  if ($globals._config == null) {
    $globals._config = new Configuration();
  }
  $globals._config.onInit();
  _defer(_runTests);
}
$inherits(HtmlEnhancedConfiguration, Configuration);
function HtmlEnhancedConfiguration(_isLayoutTest) {
  this._isLayoutTest = _isLayoutTest;
  Configuration.call(this);
}
HtmlEnhancedConfiguration.prototype.onInit = function() {
  var _CSSID = "_unittestcss_";
  var cssElement = get$$document().head.querySelector(("#" + _CSSID));
  if ($eq$(cssElement)) {
    get$$document().head.get$elements().add(_ElementFactoryProvider.Element$html$factory(("<style id=\"" + _CSSID + "\"></style>")));
    cssElement = get$$document().head.querySelector(("#" + _CSSID));
  }
  cssElement.set$innerHTML(this.get$_htmlTestCSS());
  this._onErrorClosure = $wrap_call$1((function (e) {
    reportTestError(("(DOM callback has errors) Caught " + e), "");
  })
  );
}
HtmlEnhancedConfiguration.prototype.onStart = function() {
  get$$window().postMessage("unittest-suite-wait-for-done", "*");
  get$$window().get$on().get$error().add(this._onErrorClosure, false);
}
HtmlEnhancedConfiguration.prototype.onDone = function(passed, failed, errors, results, uncaughtError) {
  get$$window().get$on().get$error().remove(this._onErrorClosure, false);
  this._showInteractiveResultsInPage(passed, failed, errors, results, this._isLayoutTest, uncaughtError);
  get$$window().postMessage("unittest-suite-done", "*");
}
HtmlEnhancedConfiguration.prototype._showInteractiveResultsInPage = function(passed, failed, errors, results, isLayoutTest, uncaughtError) {
  if (isLayoutTest && passed == results.get$length()) {
    get$$document().body.set$innerHTML("PASS");
  }
  else {
    var te = _ElementFactoryProvider.Element$html$factory("<div class=\"unittest-table\"></div>");
    te.get$elements().add(_ElementFactoryProvider.Element$html$factory(passed == results.get$length() ? "<div class='unittest-overall unittest-pass'>PASS</div>" : "<div class='unittest-overall unittest-fail'>FAIL</div>"));
    if (passed == results.get$length() && uncaughtError == null) {
      te.get$elements().add(_ElementFactoryProvider.Element$html$factory(("          <div class='unittest-pass'>All " + passed + " tests passed</div>")));
    }
    else {
      if (uncaughtError != null) {
        te.get$elements().add(_ElementFactoryProvider.Element$html$factory(("            <div class='unittest-summary'>\n              <span class='unittest-error'>Uncaught error: " + uncaughtError + "</span>\n            </div>")));
      }
      te.get$elements().add(_ElementFactoryProvider.Element$html$factory(("          <div class='unittest-summary'>\n            <span class='unittest-pass'>Total " + passed + " passed</span>,\n            <span class='unittest-fail'>" + failed + " failed</span>,\n            <span class='unittest-error'>\n            " + (errors + (uncaughtError == null ? (0) : (1))) + " errors</span>\n          </div>")));
    }
    te.get$elements().add(_ElementFactoryProvider.Element$html$factory("        <div><button id='btnCollapseAll'>Collapse All</button></div>\n       "));
    te.query$1("#btnCollapseAll").get$on().get$click().add$1((function (_) {
      get$$document().queryAll(".unittest-row").forEach$1((function (el) {
        var $0;
        return (el.get$attributes().$setindex("class", ($0 = el.get$attributes().$index("class").replaceAll("unittest-row ", "unittest-row-hidden "))), $0);
      })
      );
    })
    );
    var previousGroup = "";
    var groupPassFail = true;
    var indentAmount = (50);
    var groupedBy = new LinkedHashMapImplementation_dart_core_String$List_TestCase();
    for (var $$i = results.iterator(); $$i.hasNext(); ) {
      var t = $$i.next();
      if (!groupedBy.containsKey(t.get$currentGroup())) {
        groupedBy.$setindex(t.get$currentGroup(), new Array());
      }
      groupedBy.$index(t.get$currentGroup()).add$1(t);
    }
    var flattened = new Array();
    groupedBy.getValues().forEach$1((function (tList) {
      tList.sort$1((function (tcA, tcB) {
        return $sub$(tcA.get$id(), tcB.get$id());
      })
      );
      flattened.addAll(tList);
    })
    );
    for (var $$i = flattened.iterator(); $$i.hasNext(); ) {
      var test_ = $$i.next();
      var safeGroup = test_.get$currentGroup().replaceAll("(?:[^a-z0-9 ]|(?<=['\"])s)", "_").replaceAll(" ", "_");
      if (test_.get$currentGroup() != previousGroup) {
        previousGroup = test_.get$currentGroup();
        var testsInGroup = results.filter$1((function (t) {
          return t.currentGroup == previousGroup;
        })
        );
        var groupTotalTestCount = testsInGroup.get$length();
        var groupTestPassedCount = testsInGroup.filter$1((function (t) {
          return t.result == "pass";
        })
        ).get$length();
        groupPassFail = $eq$(groupTotalTestCount, groupTestPassedCount);
        te.get$elements().add(_ElementFactoryProvider.Element$html$factory(("            <div>\n              <div id='" + safeGroup + "'\n                   class='unittest-group " + safeGroup + " test" + safeGroup + "'>\n                <div " + (HtmlEnhancedConfiguration.get$_isIE() ? "style='display:inline-block' " : "") + "\n                     class='unittest-row-status'>\n                  <div class='unittest-group-status unittest-group-status-\n                              " + (groupPassFail ? "pass" : "fail") + "'></div>\n                </div>\n                <div " + (HtmlEnhancedConfiguration.get$_isIE() ? "style='display:inline-block' " : "") + ">\n                    " + test_.get$currentGroup() + "</div>\n                <div " + (HtmlEnhancedConfiguration.get$_isIE() ? "style='display:inline-block' " : "") + ">\n                    (" + groupTestPassedCount + "/" + groupTotalTestCount + ")</div>\n              </div>\n            </div>")));
        var grp = te.query$1(("#" + safeGroup));
        if ($ne$(grp)) {
          grp.get$on().get$click().add$1((function (safeGroup, _) {
            var row = get$$document().query((".unittest-row-" + safeGroup));
            if (row.get$attributes().$index("class").contains$1("unittest-row ")) {
              get$$document().queryAll((".unittest-row-" + safeGroup)).forEach$1((function (e) {
                var $0;
                return (e.get$attributes().$setindex("class", ($0 = e.get$attributes().$index("class").replaceAll("unittest-row ", "unittest-row-hidden "))), $0);
              })
              );
            }
            else {
              get$$document().queryAll((".unittest-row-" + safeGroup)).forEach$1((function (e) {
                var $0;
                return (e.get$attributes().$setindex("class", ($0 = e.get$attributes().$index("class").replaceAll("unittest-row-hidden", "unittest-row"))), $0);
              })
              );
            }
          }).bind(null, safeGroup)
          );
        }
      }
      this._buildRow(test_, te, safeGroup, !groupPassFail);
    }
    get$$document().body.get$elements().clear$_();
    get$$document().body.get$elements().add(te);
  }
}
HtmlEnhancedConfiguration.prototype._buildRow = function(test_, te, groupID, isVisible) {
  var $this = this;
  var background = ("unittest-row-" + ($mod$(test_.id, (2)) == (0) ? "even" : "odd"));
  var display = ("" + (isVisible ? "unittest-row" : "unittest-row-hidden"));
  function _htmlEscape(string) {
    return string.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }
  function addRowElement(id, status, description) {
    te.get$elements().add(_ElementFactoryProvider.Element$html$factory((" <div>\n                <div class='" + display + " unittest-row-" + groupID + " " + background + "'>\n                  <div " + (HtmlEnhancedConfiguration.get$_isIE() ? "style='display:inline-block' " : "") + "\n                       class='unittest-row-id'>" + id + "</div>\n                  <div " + (HtmlEnhancedConfiguration.get$_isIE() ? "style='display:inline-block' " : "") + "\n                       class=\"unittest-row-status unittest-" + test_.result + "\">\n                       " + status + "</div>\n                  <div " + (HtmlEnhancedConfiguration.get$_isIE() ? "style='display:inline-block' " : "") + "\n                       class='unittest-row-description'>" + description + "</div>\n                </div>\n              </div>")));
  }
  if (!test_.get$isComplete()) {
    addRowElement(("" + test_.id), "NO STATUS", "Test did not complete.");
    return;
  }
  addRowElement(("" + test_.id), ("" + test_.result.toUpperCase()), ("" + test_.description + ". " + _htmlEscape(test_.message)));
  if (test_.stackTrace != null) {
    addRowElement("", "", ("<pre>" + _htmlEscape(test_.stackTrace) + "</pre>"));
  }
}
HtmlEnhancedConfiguration.get$_isIE = function() {
  return get$$document().get$window().navigator.userAgent.contains("MSIE");
}
HtmlEnhancedConfiguration.prototype.get$_htmlTestCSS = function() {
  return ("  body{\n    font-size: 14px;\n    font-family: 'Open Sans', 'Lucida Sans Unicode', 'Lucida Grande', sans-serif;\n    background: WhiteSmoke;\n  }\n\n  .unittest-group\n  {\n    background: rgb(75,75,75);\n    width:98%;\n    color: WhiteSmoke;\n    font-weight: bold;\n    padding: 6px;\n\n    /* Provide some visual separation between groups for IE */\n    " + (HtmlEnhancedConfiguration.get$_isIE() ? "border-bottom:solid black 1px;" : "") + "\n    " + (HtmlEnhancedConfiguration.get$_isIE() ? "border-top:solid #777777 1px;" : "") + "\n\n    background-image: -webkit-linear-gradient(bottom, rgb(50,50,50) 0%, rgb(100,100,100) 100%);\n    background-image: -moz-linear-gradient(bottom, rgb(50,50,50) 0%, rgb(100,100,100) 100%);\n    background-image: -ms-linear-gradient(bottom, rgb(50,50,50) 0%, rgb(100,100,100) 100%);\n    background-image: linear-gradient(bottom, rgb(50,50,50) 0%, rgb(100,100,100) 100%);\n\n    display: -webkit-box;\n    display: -moz-box;\n    display: -ms-box;\n    display: box;\n\n    -webkit-box-orient: horizontal;\n    -moz-box-orient: horizontal;\n    -ms-box-orient: horizontal;\n    box-orient: horizontal;\n\n    -webkit-box-align: center;\n    -moz-box-align: center;\n    -ms-box-align: center;\n    box-align: center;\n   }\n\n  .unittest-group-status\n  {\n    width: 20px;\n    height: 20px;\n    border-radius: 20px;\n    margin-left: 10px;\n  }\n\n  .unittest-group-status-pass{\n    background: Green;\n    background: -webkit-radial-gradient(center, ellipse cover, #AAFFAA 0%,Green 100%);\n    background: -moz-radial-gradient(center, ellipse cover, #AAFFAA 0%,Green 100%);\n    background: -ms-radial-gradient(center, ellipse cover, #AAFFAA 0%,Green 100%);\n    background: radial-gradient(center, ellipse cover, #AAFFAA 0%,Green 100%);\n  }\n\n  .unittest-group-status-fail{\n    background: Red;\n    background: -webkit-radial-gradient(center, ellipse cover, #FFAAAA 0%,Red 100%);\n    background: -moz-radial-gradient(center, ellipse cover, #FFAAAA 0%,Red 100%);\n    background: -ms-radial-gradient(center, ellipse cover, #AAFFAA 0%,Green 100%);\n    background: radial-gradient(center, ellipse cover, #FFAAAA 0%,Red 100%);\n  }\n\n  .unittest-overall{\n    font-size: 20px;\n  }\n\n  .unittest-summary{\n    font-size: 18px;\n  }\n\n  .unittest-pass{\n    color: Green;\n  }\n\n  .unittest-fail, .unittest-error\n  {\n    color: Red;\n  }\n\n  .unittest-row\n  {\n    display: -webkit-box;\n    display: -moz-box;\n    display: -ms-box;\n    display: box;\n    -webkit-box-orient: horizontal;\n    -moz-box-orient: horizontal;\n    -ms-box-orient: horizontal;\n    box-orient: horizontal;\n    width: 100%;\n  }\n\n  .unittest-row-hidden\n  {\n    display: none;\n  }\n\n  .unittest-row-odd\n  {\n    background: WhiteSmoke;\n  }\n\n  .unittest-row-even\n  {\n    background: #E5E5E5;\n  }\n\n  .unittest-row-id\n  {\n    width: 3em;\n  }\n\n  .unittest-row-status\n  {\n    width: 4em;\n  }\n\n  .unittest-row-description\n  {\n  }\n\n  ");
}
function useHtmlEnhancedConfiguration(isLayoutTest) {
  configure(new HtmlEnhancedConfiguration(isLayoutTest));
}
function Result(name, kind, url) {
  this.name = name;
  this.kind = kind;
  this.url = url;
}
Result.prototype.get$name = function() { return this.name; };
Result.prototype.asList = function() {
  var l = new Array();
  l.add($add$($add$(this.kind, " "), this.name));
  l.add(this.url);
  return l;
}
Result.prototype.toString = function() {
  return ("" + this.kind + " " + this.name + " , " + this.url);
}
function Parser() {
  this.baseUrl = "http://api.dartlang.org/";
  var r = new Request();
  this.json = r.getJson();
}
Parser.prototype.geturl = function(name) {
  var r = this._parse(name);
  var l = new Array();
  if (r != null) {
    l = r.asList();
  }
  return l;
}
Parser.prototype.getUrlsSratingWith = function(name) {
  var r = this._parseStartWith(name);
  var url = new Array();
  r.forEach$1((function (result) {
    url.add(result.toString());
  })
  );
  return url;
}
Parser.prototype._parse = function(name) {
  var foundResult = null;
  var result = this._parseFuture(name);
  result.then((function (resultValue) {
    foundResult = resultValue;
  })
  );
  return foundResult;
}
Parser.prototype._parseFuture = function(name) {
  var $this = this;
  var parsedJson = json_JSON.parse(this.json);
  var resultComplete = new CompleterImpl();
  var packagesKeys = parsedJson.getKeys();
  packagesKeys.forEach$1((function (k) {
    var packageValues = parsedJson.$index(k);
    packageValues.forEach$1((function (v) {
      if (v.$index("name").toUpperCase() == name.toUpperCase()) {
        var result = new Result(v.$index("name"), v.$index("kind"), $add$($this.baseUrl, v.$index("url")));
        resultComplete.complete(result);
      }
    })
    );
  })
  );
  return resultComplete.get$future();
}
Parser.prototype._parseStartWith = function(name) {
  var $this = this;
  var parsedJson = json_JSON.parse(this.json);
  var results = new Array();
  var packagesKeys = parsedJson.getKeys();
  packagesKeys.forEach$1((function (k) {
    var packageValues = parsedJson.$index(k);
    packageValues.forEach$1((function (v) {
      if (v.$index("name").toUpperCase().startsWith(name.toUpperCase())) {
        var result = new Result(v.$index("name"), v.$index("kind"), $add$($this.baseUrl, v.$index("url")));
        results.add(result);
      }
    })
    );
  })
  );
  return results;
}
function Request() {
  this.json = "      {\"dart:core\":[{\"name\":\"AssertionError\",\"kind\":\"class\",\"url\":\"dart_core/AssertionError.html\"},{\"name\":\"BadNumberFormatException\",\"kind\":\"class\",\"url\":\"dart_core/BadNumberFormatException.html\"},{\"name\":\"bool\",\"kind\":\"interface\",\"url\":\"dart_core/bool.html\"},{\"name\":\"Clock\",\"kind\":\"class\",\"url\":\"dart_core/Clock.html\"},{\"name\":\"ClosureArgumentMismatchException\",\"kind\":\"class\",\"url\":\"dart_core/ClosureArgumentMismatchException.html\"},{\"name\":\"Collection&lt;E&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Collection.html\"},{\"name\":\"Comparable\",\"kind\":\"interface\",\"url\":\"dart_core/Comparable.html\"},{\"name\":\"Completer&lt;T&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Completer.html\"},{\"name\":\"Date\",\"kind\":\"interface\",\"url\":\"dart_core/Date.html\"},{\"name\":\"double\",\"kind\":\"interface\",\"url\":\"dart_core/double.html\"},{\"name\":\"Duration\",\"kind\":\"interface\",\"url\":\"dart_core/Duration.html\"},{\"name\":\"Dynamic\",\"kind\":\"interface\",\"url\":\"dart_core/Dynamic.html\"},{\"name\":\"EmptyQueueException\",\"kind\":\"class\",\"url\":\"dart_core/EmptyQueueException.html\"},{\"name\":\"Exception\",\"kind\":\"interface\",\"url\":\"dart_core/Exception.html\"},{\"name\":\"Expect\",\"kind\":\"class\",\"url\":\"dart_core/Expect.html\"},{\"name\":\"ExpectException\",\"kind\":\"class\",\"url\":\"dart_core/ExpectException.html\"},{\"name\":\"FallThroughError\",\"kind\":\"class\",\"url\":\"dart_core/FallThroughError.html\"},{\"name\":\"Function\",\"kind\":\"interface\",\"url\":\"dart_core/Function.html\"},{\"name\":\"Future&lt;T&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Future.html\"},{\"name\":\"FutureAlreadyCompleteException\",\"kind\":\"class\",\"url\":\"dart_core/FutureAlreadyCompleteException.html\"},{\"name\":\"FutureNotCompleteException\",\"kind\":\"class\",\"url\":\"dart_core/FutureNotCompleteException.html\"},{\"name\":\"Futures\",\"kind\":\"class\",\"url\":\"dart_core/Futures.html\"},{\"name\":\"Hashable\",\"kind\":\"interface\",\"url\":\"dart_core/Hashable.html\"},{\"name\":\"HashMap&lt;K, V&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/HashMap.html\"},{\"name\":\"HashSet&lt;E&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/HashSet.html\"},{\"name\":\"IllegalAccessException\",\"kind\":\"class\",\"url\":\"dart_core/IllegalAccessException.html\"},{\"name\":\"IllegalArgumentException\",\"kind\":\"class\",\"url\":\"dart_core/IllegalArgumentException.html\"},{\"name\":\"IllegalJSRegExpException\",\"kind\":\"class\",\"url\":\"dart_core/IllegalJSRegExpException.html\"},{\"name\":\"IndexOutOfRangeException\",\"kind\":\"class\",\"url\":\"dart_core/IndexOutOfRangeException.html\"},{\"name\":\"int\",\"kind\":\"interface\",\"url\":\"dart_core/int.html\"},{\"name\":\"IntegerDivisionByZeroException\",\"kind\":\"class\",\"url\":\"dart_core/IntegerDivisionByZeroException.html\"},{\"name\":\"Iterable&lt;E&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Iterable.html\"},{\"name\":\"Iterator&lt;E&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Iterator.html\"},{\"name\":\"LinkedHashMap&lt;K, V&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/LinkedHashMap.html\"},{\"name\":\"List&lt;E&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/List.html\"},{\"name\":\"Map&lt;K, V&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Map.html\"},{\"name\":\"Match\",\"kind\":\"interface\",\"url\":\"dart_core/Match.html\"},{\"name\":\"Math\",\"kind\":\"class\",\"url\":\"dart_core/Math.html\"},{\"name\":\"NoMoreElementsException\",\"kind\":\"class\",\"url\":\"dart_core/NoMoreElementsException.html\"},{\"name\":\"NoSuchMethodException\",\"kind\":\"class\",\"url\":\"dart_core/NoSuchMethodException.html\"},{\"name\":\"NotImplementedException\",\"kind\":\"class\",\"url\":\"dart_core/NotImplementedException.html\"},{\"name\":\"NullPointerException\",\"kind\":\"class\",\"url\":\"dart_core/NullPointerException.html\"},{\"name\":\"num\",\"kind\":\"interface\",\"url\":\"dart_core/num.html\"},{\"name\":\"Object\",\"kind\":\"class\",\"url\":\"dart_core/Object.html\"},{\"name\":\"ObjectNotClosureException\",\"kind\":\"class\",\"url\":\"dart_core/ObjectNotClosureException.html\"},{\"name\":\"Options\",\"kind\":\"interface\",\"url\":\"dart_core/Options.html\"},{\"name\":\"OutOfMemoryException\",\"kind\":\"class\",\"url\":\"dart_core/OutOfMemoryException.html\"},{\"name\":\"Pattern\",\"kind\":\"interface\",\"url\":\"dart_core/Pattern.html\"},{\"name\":\"Queue&lt;E&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Queue.html\"},{\"name\":\"RegExp\",\"kind\":\"interface\",\"url\":\"dart_core/RegExp.html\"},{\"name\":\"Set&lt;E&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Set.html\"},{\"name\":\"StackOverflowException\",\"kind\":\"class\",\"url\":\"dart_core/StackOverflowException.html\"},{\"name\":\"Stopwatch\",\"kind\":\"interface\",\"url\":\"dart_core/Stopwatch.html\"},{\"name\":\"String\",\"kind\":\"interface\",\"url\":\"dart_core/String.html\"},{\"name\":\"StringBuffer\",\"kind\":\"interface\",\"url\":\"dart_core/StringBuffer.html\"},{\"name\":\"Strings\",\"kind\":\"class\",\"url\":\"dart_core/Strings.html\"},{\"name\":\"TimeZone\",\"kind\":\"interface\",\"url\":\"dart_core/TimeZone.html\"},{\"name\":\"TypeError\",\"kind\":\"class\",\"url\":\"dart_core/TypeError.html\"},{\"name\":\"UnsupportedOperationException\",\"kind\":\"class\",\"url\":\"dart_core/UnsupportedOperationException.html\"},{\"name\":\"void\",\"kind\":\"interface\",\"url\":\"dart_core/void.html\"},{\"name\":\"WrongArgumentCountException\",\"kind\":\"class\",\"url\":\"dart_core/WrongArgumentCountException.html\"}],\"dart:coreimpl\":[{\"name\":\"Arrays\",\"kind\":\"class\",\"url\":\"dart_coreimpl/Arrays.html\"},{\"name\":\"Collections\",\"kind\":\"class\",\"url\":\"dart_coreimpl/Collections.html\"},{\"name\":\"CompleterImpl&lt;T&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/CompleterImpl.html\"},{\"name\":\"DateImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/DateImplementation.html\"},{\"name\":\"DoubleLinkedQueue&lt;E&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/DoubleLinkedQueue.html\"},{\"name\":\"DoubleLinkedQueueEntry&lt;E&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/DoubleLinkedQueueEntry.html\"},{\"name\":\"DualPivotQuicksort\",\"kind\":\"class\",\"url\":\"dart_coreimpl/DualPivotQuicksort.html\"},{\"name\":\"DurationImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/DurationImplementation.html\"},{\"name\":\"ExceptionImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/ExceptionImplementation.html\"},{\"name\":\"FutureImpl&lt;T&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/FutureImpl.html\"},{\"name\":\"HashMapImplementation&lt;K, V&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/HashMapImplementation.html\"},{\"name\":\"HashSetImplementation&lt;E&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/HashSetImplementation.html\"},{\"name\":\"HashSetIterator&lt;E&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/HashSetIterator.html\"},{\"name\":\"ImmutableList&lt;E&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/ImmutableList.html\"},{\"name\":\"ImmutableMap&lt;K, V&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/ImmutableMap.html\"},{\"name\":\"JSSyntaxRegExp\",\"kind\":\"class\",\"url\":\"dart_coreimpl/JSSyntaxRegExp.html\"},{\"name\":\"KeyValuePair&lt;K, V&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/KeyValuePair.html\"},{\"name\":\"LinkedHashMapImplementation&lt;K, V&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/LinkedHashMapImplementation.html\"},{\"name\":\"ListFactory&lt;E&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/ListFactory.html\"},{\"name\":\"ListIterator&lt;T&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/ListIterator.html\"},{\"name\":\"Maps\",\"kind\":\"class\",\"url\":\"dart_coreimpl/Maps.html\"},{\"name\":\"MatchImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/MatchImplementation.html\"},{\"name\":\"NumImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/NumImplementation.html\"},{\"name\":\"RuntimeOptions\",\"kind\":\"class\",\"url\":\"dart_coreimpl/RuntimeOptions.html\"},{\"name\":\"SplayTreeMap&lt;K, V&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/SplayTreeMap.html\"},{\"name\":\"SplayTreeNode&lt;K, V&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/SplayTreeNode.html\"},{\"name\":\"StopwatchImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/StopwatchImplementation.html\"},{\"name\":\"StringBase\",\"kind\":\"class\",\"url\":\"dart_coreimpl/StringBase.html\"},{\"name\":\"StringBufferImpl\",\"kind\":\"class\",\"url\":\"dart_coreimpl/StringBufferImpl.html\"},{\"name\":\"StringImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/StringImplementation.html\"},{\"name\":\"TimeZoneImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/TimeZoneImplementation.html\"}],\"dart:isolate\":[{\"name\":\"Isolate\",\"kind\":\"class\",\"url\":\"dart_isolate/Isolate.html\"},{\"name\":\"IsolateSpawnException\",\"kind\":\"class\",\"url\":\"dart_isolate/IsolateSpawnException.html\"},{\"name\":\"ReceivePort\",\"kind\":\"interface\",\"url\":\"dart_isolate/ReceivePort.html\"},{\"name\":\"SendPort\",\"kind\":\"interface\",\"url\":\"dart_isolate/SendPort.html\"},{\"name\":\"TestingOnly\",\"kind\":\"class\",\"url\":\"dart_isolate/TestingOnly.html\"}],\"html\":[{\"name\":\"AbstractWorker\",\"kind\":\"interface\",\"url\":\"html/AbstractWorker.html\"},{\"name\":\"AbstractWorkerEvents\",\"kind\":\"interface\",\"url\":\"html/AbstractWorkerEvents.html\"},{\"name\":\"AnchorElement\",\"kind\":\"interface\",\"url\":\"html/AnchorElement.html\"},{\"name\":\"Animation\",\"kind\":\"interface\",\"url\":\"html/Animation.html\"},{\"name\":\"AnimationEvent\",\"kind\":\"interface\",\"url\":\"html/AnimationEvent.html\"},{\"name\":\"AnimationList\",\"kind\":\"interface\",\"url\":\"html/AnimationList.html\"},{\"name\":\"AppletElement\",\"kind\":\"interface\",\"url\":\"html/AppletElement.html\"},{\"name\":\"AreaElement\",\"kind\":\"interface\",\"url\":\"html/AreaElement.html\"},{\"name\":\"ArrayBuffer\",\"kind\":\"interface\",\"url\":\"html/ArrayBuffer.html\"},{\"name\":\"ArrayBufferView\",\"kind\":\"interface\",\"url\":\"html/ArrayBufferView.html\"},{\"name\":\"Attr\",\"kind\":\"interface\",\"url\":\"html/Attr.html\"},{\"name\":\"AttributeMap\",\"kind\":\"interface\",\"url\":\"html/AttributeMap.html\"},{\"name\":\"AudioBuffer\",\"kind\":\"interface\",\"url\":\"html/AudioBuffer.html\"},{\"name\":\"AudioBufferCallback\",\"kind\":\"interface\",\"url\":\"html/AudioBufferCallback.html\"},{\"name\":\"AudioBufferSourceNode\",\"kind\":\"interface\",\"url\":\"html/AudioBufferSourceNode.html\"},{\"name\":\"AudioChannelMerger\",\"kind\":\"interface\",\"url\":\"html/AudioChannelMerger.html\"},{\"name\":\"AudioChannelSplitter\",\"kind\":\"interface\",\"url\":\"html/AudioChannelSplitter.html\"},{\"name\":\"AudioContext\",\"kind\":\"interface\",\"url\":\"html/AudioContext.html\"},{\"name\":\"AudioContextEvents\",\"kind\":\"interface\",\"url\":\"html/AudioContextEvents.html\"},{\"name\":\"AudioDestinationNode\",\"kind\":\"interface\",\"url\":\"html/AudioDestinationNode.html\"},{\"name\":\"AudioElement\",\"kind\":\"interface\",\"url\":\"html/AudioElement.html\"},{\"name\":\"AudioGain\",\"kind\":\"interface\",\"url\":\"html/AudioGain.html\"},{\"name\":\"AudioGainNode\",\"kind\":\"interface\",\"url\":\"html/AudioGainNode.html\"},{\"name\":\"AudioListener\",\"kind\":\"interface\",\"url\":\"html/AudioListener.html\"},{\"name\":\"AudioNode\",\"kind\":\"interface\",\"url\":\"html/AudioNode.html\"},{\"name\":\"AudioPannerNode\",\"kind\":\"interface\",\"url\":\"html/AudioPannerNode.html\"},{\"name\":\"AudioParam\",\"kind\":\"interface\",\"url\":\"html/AudioParam.html\"},{\"name\":\"AudioProcessingEvent\",\"kind\":\"interface\",\"url\":\"html/AudioProcessingEvent.html\"},{\"name\":\"AudioSourceNode\",\"kind\":\"interface\",\"url\":\"html/AudioSourceNode.html\"},{\"name\":\"BarInfo\",\"kind\":\"interface\",\"url\":\"html/BarInfo.html\"},{\"name\":\"BaseElement\",\"kind\":\"interface\",\"url\":\"html/BaseElement.html\"},{\"name\":\"BaseFontElement\",\"kind\":\"interface\",\"url\":\"html/BaseFontElement.html\"},{\"name\":\"BatteryManager\",\"kind\":\"interface\",\"url\":\"html/BatteryManager.html\"},{\"name\":\"BatteryManagerEvents\",\"kind\":\"interface\",\"url\":\"html/BatteryManagerEvents.html\"},{\"name\":\"BeforeLoadEvent\",\"kind\":\"interface\",\"url\":\"html/BeforeLoadEvent.html\"},{\"name\":\"BiquadFilterNode\",\"kind\":\"interface\",\"url\":\"html/BiquadFilterNode.html\"},{\"name\":\"Blob\",\"kind\":\"interface\",\"url\":\"html/Blob.html\"},{\"name\":\"BodyElement\",\"kind\":\"interface\",\"url\":\"html/BodyElement.html\"},{\"name\":\"BodyElementEvents\",\"kind\":\"interface\",\"url\":\"html/BodyElementEvents.html\"},{\"name\":\"BRElement\",\"kind\":\"interface\",\"url\":\"html/BRElement.html\"},{\"name\":\"ButtonElement\",\"kind\":\"interface\",\"url\":\"html/ButtonElement.html\"},{\"name\":\"CanvasElement\",\"kind\":\"interface\",\"url\":\"html/CanvasElement.html\"},{\"name\":\"CanvasGradient\",\"kind\":\"interface\",\"url\":\"html/CanvasGradient.html\"},{\"name\":\"CanvasPattern\",\"kind\":\"interface\",\"url\":\"html/CanvasPattern.html\"},{\"name\":\"CanvasRenderingContext\",\"kind\":\"interface\",\"url\":\"html/CanvasRenderingContext.html\"},{\"name\":\"CanvasRenderingContext2D\",\"kind\":\"interface\",\"url\":\"html/CanvasRenderingContext2D.html\"},{\"name\":\"CDATASection\",\"kind\":\"interface\",\"url\":\"html/CDATASection.html\"},{\"name\":\"CharacterData\",\"kind\":\"interface\",\"url\":\"html/CharacterData.html\"},{\"name\":\"ClientRect\",\"kind\":\"interface\",\"url\":\"html/ClientRect.html\"},{\"name\":\"ClientRectList\",\"kind\":\"interface\",\"url\":\"html/ClientRectList.html\"},{\"name\":\"Clipboard\",\"kind\":\"interface\",\"url\":\"html/Clipboard.html\"},{\"name\":\"CloseEvent\",\"kind\":\"interface\",\"url\":\"html/CloseEvent.html\"},{\"name\":\"Comment\",\"kind\":\"interface\",\"url\":\"html/Comment.html\"},{\"name\":\"CompositionEvent\",\"kind\":\"interface\",\"url\":\"html/CompositionEvent.html\"},{\"name\":\"ComputeValue\",\"kind\":\"interface\",\"url\":\"html/ComputeValue.html\"},{\"name\":\"Console\",\"kind\":\"interface\",\"url\":\"html/Console.html\"},{\"name\":\"ContentElement\",\"kind\":\"interface\",\"url\":\"html/ContentElement.html\"},{\"name\":\"ConvolverNode\",\"kind\":\"interface\",\"url\":\"html/ConvolverNode.html\"},{\"name\":\"Coordinates\",\"kind\":\"interface\",\"url\":\"html/Coordinates.html\"},{\"name\":\"Counter\",\"kind\":\"interface\",\"url\":\"html/Counter.html\"},{\"name\":\"Crypto\",\"kind\":\"interface\",\"url\":\"html/Crypto.html\"},{\"name\":\"CSSCharsetRule\",\"kind\":\"interface\",\"url\":\"html/CSSCharsetRule.html\"},{\"name\":\"CSSFontFaceRule\",\"kind\":\"interface\",\"url\":\"html/CSSFontFaceRule.html\"},{\"name\":\"CSSImportRule\",\"kind\":\"interface\",\"url\":\"html/CSSImportRule.html\"},{\"name\":\"CSSKeyframeRule\",\"kind\":\"interface\",\"url\":\"html/CSSKeyframeRule.html\"},{\"name\":\"CSSKeyframesRule\",\"kind\":\"interface\",\"url\":\"html/CSSKeyframesRule.html\"},{\"name\":\"CSSMatrix\",\"kind\":\"interface\",\"url\":\"html/CSSMatrix.html\"},{\"name\":\"CSSMediaRule\",\"kind\":\"interface\",\"url\":\"html/CSSMediaRule.html\"},{\"name\":\"CSSPageRule\",\"kind\":\"interface\",\"url\":\"html/CSSPageRule.html\"},{\"name\":\"CSSPrimitiveValue\",\"kind\":\"interface\",\"url\":\"html/CSSPrimitiveValue.html\"},{\"name\":\"CSSRule\",\"kind\":\"interface\",\"url\":\"html/CSSRule.html\"},{\"name\":\"CSSRuleList\",\"kind\":\"interface\",\"url\":\"html/CSSRuleList.html\"},{\"name\":\"CSSStyleDeclaration\",\"kind\":\"interface\",\"url\":\"html/CSSStyleDeclaration.html\"},{\"name\":\"CSSStyleRule\",\"kind\":\"interface\",\"url\":\"html/CSSStyleRule.html\"},{\"name\":\"CSSStyleSheet\",\"kind\":\"interface\",\"url\":\"html/CSSStyleSheet.html\"},{\"name\":\"CSSTransformValue\",\"kind\":\"interface\",\"url\":\"html/CSSTransformValue.html\"},{\"name\":\"CSSUnknownRule\",\"kind\":\"interface\",\"url\":\"html/CSSUnknownRule.html\"},{\"name\":\"CSSValue\",\"kind\":\"interface\",\"url\":\"html/CSSValue.html\"},{\"name\":\"CSSValueList\",\"kind\":\"interface\",\"url\":\"html/CSSValueList.html\"},{\"name\":\"CustomEvent\",\"kind\":\"interface\",\"url\":\"html/CustomEvent.html\"},{\"name\":\"Database\",\"kind\":\"interface\",\"url\":\"html/Database.html\"},{\"name\":\"DatabaseCallback\",\"kind\":\"interface\",\"url\":\"html/DatabaseCallback.html\"},{\"name\":\"DatabaseSync\",\"kind\":\"interface\",\"url\":\"html/DatabaseSync.html\"},{\"name\":\"DataTransferItem\",\"kind\":\"interface\",\"url\":\"html/DataTransferItem.html\"},{\"name\":\"DataTransferItemList\",\"kind\":\"interface\",\"url\":\"html/DataTransferItemList.html\"},{\"name\":\"DataView\",\"kind\":\"interface\",\"url\":\"html/DataView.html\"},{\"name\":\"DedicatedWorkerContext\",\"kind\":\"interface\",\"url\":\"html/DedicatedWorkerContext.html\"},{\"name\":\"DedicatedWorkerContextEvents\",\"kind\":\"interface\",\"url\":\"html/DedicatedWorkerContextEvents.html\"},{\"name\":\"DelayNode\",\"kind\":\"interface\",\"url\":\"html/DelayNode.html\"},{\"name\":\"DeprecatedPeerConnection\",\"kind\":\"interface\",\"url\":\"html/DeprecatedPeerConnection.html\"},{\"name\":\"DeprecatedPeerConnectionEvents\",\"kind\":\"interface\",\"url\":\"html/DeprecatedPeerConnectionEvents.html\"},{\"name\":\"DetailsElement\",\"kind\":\"interface\",\"url\":\"html/DetailsElement.html\"},{\"name\":\"DeviceMotionEvent\",\"kind\":\"interface\",\"url\":\"html/DeviceMotionEvent.html\"},{\"name\":\"DeviceOrientationEvent\",\"kind\":\"interface\",\"url\":\"html/DeviceOrientationEvent.html\"},{\"name\":\"DirectoryElement\",\"kind\":\"interface\",\"url\":\"html/DirectoryElement.html\"},{\"name\":\"DirectoryEntry\",\"kind\":\"interface\",\"url\":\"html/DirectoryEntry.html\"},{\"name\":\"DirectoryEntrySync\",\"kind\":\"interface\",\"url\":\"html/DirectoryEntrySync.html\"},{\"name\":\"DirectoryReader\",\"kind\":\"interface\",\"url\":\"html/DirectoryReader.html\"},{\"name\":\"DirectoryReaderSync\",\"kind\":\"interface\",\"url\":\"html/DirectoryReaderSync.html\"},{\"name\":\"DivElement\",\"kind\":\"interface\",\"url\":\"html/DivElement.html\"},{\"name\":\"DListElement\",\"kind\":\"interface\",\"url\":\"html/DListElement.html\"},{\"name\":\"Document\",\"kind\":\"interface\",\"url\":\"html/Document.html\"},{\"name\":\"DocumentEvents\",\"kind\":\"interface\",\"url\":\"html/DocumentEvents.html\"},{\"name\":\"DocumentFragment\",\"kind\":\"interface\",\"url\":\"html/DocumentFragment.html\"},{\"name\":\"DocumentType\",\"kind\":\"interface\",\"url\":\"html/DocumentType.html\"},{\"name\":\"DOMApplicationCache\",\"kind\":\"interface\",\"url\":\"html/DOMApplicationCache.html\"},{\"name\":\"DOMApplicationCacheEvents\",\"kind\":\"interface\",\"url\":\"html/DOMApplicationCacheEvents.html\"},{\"name\":\"DOMException\",\"kind\":\"interface\",\"url\":\"html/DOMException.html\"},{\"name\":\"DOMFileSystem\",\"kind\":\"interface\",\"url\":\"html/DOMFileSystem.html\"},{\"name\":\"DOMFileSystemSync\",\"kind\":\"interface\",\"url\":\"html/DOMFileSystemSync.html\"},{\"name\":\"DOMFormData\",\"kind\":\"interface\",\"url\":\"html/DOMFormData.html\"},{\"name\":\"DOMImplementation\",\"kind\":\"interface\",\"url\":\"html/DOMImplementation.html\"},{\"name\":\"DOMMimeType\",\"kind\":\"interface\",\"url\":\"html/DOMMimeType.html\"},{\"name\":\"DOMMimeTypeArray\",\"kind\":\"interface\",\"url\":\"html/DOMMimeTypeArray.html\"},{\"name\":\"DOMParser\",\"kind\":\"interface\",\"url\":\"html/DOMParser.html\"},{\"name\":\"DOMPlugin\",\"kind\":\"interface\",\"url\":\"html/DOMPlugin.html\"},{\"name\":\"DOMPluginArray\",\"kind\":\"interface\",\"url\":\"html/DOMPluginArray.html\"},{\"name\":\"DOMSelection\",\"kind\":\"interface\",\"url\":\"html/DOMSelection.html\"},{\"name\":\"DOMSettableTokenList\",\"kind\":\"interface\",\"url\":\"html/DOMSettableTokenList.html\"},{\"name\":\"DOMStringList\",\"kind\":\"interface\",\"url\":\"html/DOMStringList.html\"},{\"name\":\"DOMTokenList\",\"kind\":\"interface\",\"url\":\"html/DOMTokenList.html\"},{\"name\":\"DOMURL\",\"kind\":\"interface\",\"url\":\"html/DOMURL.html\"},{\"name\":\"DynamicsCompressorNode\",\"kind\":\"interface\",\"url\":\"html/DynamicsCompressorNode.html\"},{\"name\":\"Element\",\"kind\":\"interface\",\"url\":\"html/Element.html\"},{\"name\":\"ElementEvents\",\"kind\":\"interface\",\"url\":\"html/ElementEvents.html\"},{\"name\":\"ElementList\",\"kind\":\"interface\",\"url\":\"html/ElementList.html\"},{\"name\":\"ElementRect\",\"kind\":\"interface\",\"url\":\"html/ElementRect.html\"},{\"name\":\"ElementTimeControl\",\"kind\":\"interface\",\"url\":\"html/ElementTimeControl.html\"},{\"name\":\"ElementTraversal\",\"kind\":\"interface\",\"url\":\"html/ElementTraversal.html\"},{\"name\":\"EmbedElement\",\"kind\":\"interface\",\"url\":\"html/EmbedElement.html\"},{\"name\":\"EmptyElementRect\",\"kind\":\"class\",\"url\":\"html/EmptyElementRect.html\"},{\"name\":\"Entity\",\"kind\":\"interface\",\"url\":\"html/Entity.html\"},{\"name\":\"EntityReference\",\"kind\":\"interface\",\"url\":\"html/EntityReference.html\"},{\"name\":\"EntriesCallback\",\"kind\":\"interface\",\"url\":\"html/EntriesCallback.html\"},{\"name\":\"Entry\",\"kind\":\"interface\",\"url\":\"html/Entry.html\"},{\"name\":\"EntryArray\",\"kind\":\"interface\",\"url\":\"html/EntryArray.html\"},{\"name\":\"EntryArraySync\",\"kind\":\"interface\",\"url\":\"html/EntryArraySync.html\"},{\"name\":\"EntryCallback\",\"kind\":\"interface\",\"url\":\"html/EntryCallback.html\"},{\"name\":\"EntrySync\",\"kind\":\"interface\",\"url\":\"html/EntrySync.html\"},{\"name\":\"ErrorCallback\",\"kind\":\"interface\",\"url\":\"html/ErrorCallback.html\"},{\"name\":\"ErrorEvent\",\"kind\":\"interface\",\"url\":\"html/ErrorEvent.html\"},{\"name\":\"Event\",\"kind\":\"interface\",\"url\":\"html/Event.html\"},{\"name\":\"EventException\",\"kind\":\"interface\",\"url\":\"html/EventException.html\"},{\"name\":\"EventListener\",\"kind\":\"interface\",\"url\":\"html/EventListener.html\"},{\"name\":\"EventListenerList\",\"kind\":\"interface\",\"url\":\"html/EventListenerList.html\"},{\"name\":\"Events\",\"kind\":\"interface\",\"url\":\"html/Events.html\"},{\"name\":\"EventSource\",\"kind\":\"interface\",\"url\":\"html/EventSource.html\"},{\"name\":\"EventSourceEvents\",\"kind\":\"interface\",\"url\":\"html/EventSourceEvents.html\"},{\"name\":\"EventTarget\",\"kind\":\"interface\",\"url\":\"html/EventTarget.html\"},{\"name\":\"EXTTextureFilterAnisotropic\",\"kind\":\"interface\",\"url\":\"html/EXTTextureFilterAnisotropic.html\"},{\"name\":\"FieldSetElement\",\"kind\":\"interface\",\"url\":\"html/FieldSetElement.html\"},{\"name\":\"File\",\"kind\":\"interface\",\"url\":\"html/File.html\"},{\"name\":\"FileCallback\",\"kind\":\"interface\",\"url\":\"html/FileCallback.html\"},{\"name\":\"FileEntry\",\"kind\":\"interface\",\"url\":\"html/FileEntry.html\"},{\"name\":\"FileEntrySync\",\"kind\":\"interface\",\"url\":\"html/FileEntrySync.html\"},{\"name\":\"FileError\",\"kind\":\"interface\",\"url\":\"html/FileError.html\"},{\"name\":\"FileException\",\"kind\":\"interface\",\"url\":\"html/FileException.html\"},{\"name\":\"FileList\",\"kind\":\"interface\",\"url\":\"html/FileList.html\"},{\"name\":\"FileReader\",\"kind\":\"interface\",\"url\":\"html/FileReader.html\"},{\"name\":\"FileReaderEvents\",\"kind\":\"interface\",\"url\":\"html/FileReaderEvents.html\"},{\"name\":\"FileReaderSync\",\"kind\":\"interface\",\"url\":\"html/FileReaderSync.html\"},{\"name\":\"FileSystemCallback\",\"kind\":\"interface\",\"url\":\"html/FileSystemCallback.html\"},{\"name\":\"FileWriter\",\"kind\":\"interface\",\"url\":\"html/FileWriter.html\"},{\"name\":\"FileWriterCallback\",\"kind\":\"interface\",\"url\":\"html/FileWriterCallback.html\"},{\"name\":\"FileWriterEvents\",\"kind\":\"interface\",\"url\":\"html/FileWriterEvents.html\"},{\"name\":\"FileWriterSync\",\"kind\":\"interface\",\"url\":\"html/FileWriterSync.html\"},{\"name\":\"FilteredElementList\",\"kind\":\"class\",\"url\":\"html/FilteredElementList.html\"},{\"name\":\"Float32Array\",\"kind\":\"interface\",\"url\":\"html/Float32Array.html\"},{\"name\":\"Float64Array\",\"kind\":\"interface\",\"url\":\"html/Float64Array.html\"},{\"name\":\"FontElement\",\"kind\":\"interface\",\"url\":\"html/FontElement.html\"},{\"name\":\"FormElement\",\"kind\":\"interface\",\"url\":\"html/FormElement.html\"},{\"name\":\"FrameElement\",\"kind\":\"interface\",\"url\":\"html/FrameElement.html\"},{\"name\":\"FrameSetElement\",\"kind\":\"interface\",\"url\":\"html/FrameSetElement.html\"},{\"name\":\"FrameSetElementEvents\",\"kind\":\"interface\",\"url\":\"html/FrameSetElementEvents.html\"},{\"name\":\"Geolocation\",\"kind\":\"interface\",\"url\":\"html/Geolocation.html\"},{\"name\":\"Geoposition\",\"kind\":\"interface\",\"url\":\"html/Geoposition.html\"},{\"name\":\"HashChangeEvent\",\"kind\":\"interface\",\"url\":\"html/HashChangeEvent.html\"},{\"name\":\"HeadElement\",\"kind\":\"interface\",\"url\":\"html/HeadElement.html\"},{\"name\":\"HeadingElement\",\"kind\":\"interface\",\"url\":\"html/HeadingElement.html\"},{\"name\":\"History\",\"kind\":\"interface\",\"url\":\"html/History.html\"},{\"name\":\"HRElement\",\"kind\":\"interface\",\"url\":\"html/HRElement.html\"},{\"name\":\"HTMLAllCollection\",\"kind\":\"interface\",\"url\":\"html/HTMLAllCollection.html\"},{\"name\":\"HTMLCollection\",\"kind\":\"interface\",\"url\":\"html/HTMLCollection.html\"},{\"name\":\"HtmlElement\",\"kind\":\"interface\",\"url\":\"html/HtmlElement.html\"},{\"name\":\"HTMLOptionsCollection\",\"kind\":\"interface\",\"url\":\"html/HTMLOptionsCollection.html\"},{\"name\":\"IceCallback\",\"kind\":\"interface\",\"url\":\"html/IceCallback.html\"},{\"name\":\"IceCandidate\",\"kind\":\"interface\",\"url\":\"html/IceCandidate.html\"},{\"name\":\"IDBAny\",\"kind\":\"interface\",\"url\":\"html/IDBAny.html\"},{\"name\":\"IDBCursor\",\"kind\":\"interface\",\"url\":\"html/IDBCursor.html\"},{\"name\":\"IDBCursorWithValue\",\"kind\":\"interface\",\"url\":\"html/IDBCursorWithValue.html\"},{\"name\":\"IDBDatabase\",\"kind\":\"interface\",\"url\":\"html/IDBDatabase.html\"},{\"name\":\"IDBDatabaseEvents\",\"kind\":\"interface\",\"url\":\"html/IDBDatabaseEvents.html\"},{\"name\":\"IDBDatabaseException\",\"kind\":\"interface\",\"url\":\"html/IDBDatabaseException.html\"},{\"name\":\"IDBFactory\",\"kind\":\"interface\",\"url\":\"html/IDBFactory.html\"},{\"name\":\"IDBIndex\",\"kind\":\"interface\",\"url\":\"html/IDBIndex.html\"},{\"name\":\"IDBKey\",\"kind\":\"interface\",\"url\":\"html/IDBKey.html\"},{\"name\":\"IDBKeyRange\",\"kind\":\"interface\",\"url\":\"html/IDBKeyRange.html\"},{\"name\":\"IDBObjectStore\",\"kind\":\"interface\",\"url\":\"html/IDBObjectStore.html\"},{\"name\":\"IDBRequest\",\"kind\":\"interface\",\"url\":\"html/IDBRequest.html\"},{\"name\":\"IDBRequestEvents\",\"kind\":\"interface\",\"url\":\"html/IDBRequestEvents.html\"},{\"name\":\"IDBTransaction\",\"kind\":\"interface\",\"url\":\"html/IDBTransaction.html\"},{\"name\":\"IDBTransactionEvents\",\"kind\":\"interface\",\"url\":\"html/IDBTransactionEvents.html\"},{\"name\":\"IDBVersionChangeEvent\",\"kind\":\"interface\",\"url\":\"html/IDBVersionChangeEvent.html\"},{\"name\":\"IDBVersionChangeRequest\",\"kind\":\"interface\",\"url\":\"html/IDBVersionChangeRequest.html\"},{\"name\":\"IDBVersionChangeRequestEvents\",\"kind\":\"interface\",\"url\":\"html/IDBVersionChangeRequestEvents.html\"},{\"name\":\"IFrameElement\",\"kind\":\"interface\",\"url\":\"html/IFrameElement.html\"},{\"name\":\"ImageData\",\"kind\":\"interface\",\"url\":\"html/ImageData.html\"},{\"name\":\"ImageElement\",\"kind\":\"interface\",\"url\":\"html/ImageElement.html\"},{\"name\":\"InputElement\",\"kind\":\"interface\",\"url\":\"html/InputElement.html\"},{\"name\":\"InputElementEvents\",\"kind\":\"interface\",\"url\":\"html/InputElementEvents.html\"},{\"name\":\"Int16Array\",\"kind\":\"interface\",\"url\":\"html/Int16Array.html\"},{\"name\":\"Int32Array\",\"kind\":\"interface\",\"url\":\"html/Int32Array.html\"},{\"name\":\"Int8Array\",\"kind\":\"interface\",\"url\":\"html/Int8Array.html\"},{\"name\":\"JavaScriptAudioNode\",\"kind\":\"interface\",\"url\":\"html/JavaScriptAudioNode.html\"},{\"name\":\"JavaScriptAudioNodeEvents\",\"kind\":\"interface\",\"url\":\"html/JavaScriptAudioNodeEvents.html\"},{\"name\":\"JavaScriptCallFrame\",\"kind\":\"interface\",\"url\":\"html/JavaScriptCallFrame.html\"},{\"name\":\"KeyboardEvent\",\"kind\":\"interface\",\"url\":\"html/KeyboardEvent.html\"},{\"name\":\"KeygenElement\",\"kind\":\"interface\",\"url\":\"html/KeygenElement.html\"},{\"name\":\"KeyLocation\",\"kind\":\"interface\",\"url\":\"html/KeyLocation.html\"},{\"name\":\"KeyName\",\"kind\":\"interface\",\"url\":\"html/KeyName.html\"},{\"name\":\"LabelElement\",\"kind\":\"interface\",\"url\":\"html/LabelElement.html\"},{\"name\":\"LegendElement\",\"kind\":\"interface\",\"url\":\"html/LegendElement.html\"},{\"name\":\"LIElement\",\"kind\":\"interface\",\"url\":\"html/LIElement.html\"},{\"name\":\"LinkElement\",\"kind\":\"interface\",\"url\":\"html/LinkElement.html\"},{\"name\":\"LocalMediaStream\",\"kind\":\"interface\",\"url\":\"html/LocalMediaStream.html\"},{\"name\":\"Location\",\"kind\":\"interface\",\"url\":\"html/Location.html\"},{\"name\":\"MapElement\",\"kind\":\"interface\",\"url\":\"html/MapElement.html\"},{\"name\":\"MarqueeElement\",\"kind\":\"interface\",\"url\":\"html/MarqueeElement.html\"},{\"name\":\"MediaController\",\"kind\":\"interface\",\"url\":\"html/MediaController.html\"},{\"name\":\"MediaElement\",\"kind\":\"interface\",\"url\":\"html/MediaElement.html\"},{\"name\":\"MediaElementAudioSourceNode\",\"kind\":\"interface\",\"url\":\"html/MediaElementAudioSourceNode.html\"},{\"name\":\"MediaElementEvents\",\"kind\":\"interface\",\"url\":\"html/MediaElementEvents.html\"},{\"name\":\"MediaError\",\"kind\":\"interface\",\"url\":\"html/MediaError.html\"},{\"name\":\"MediaKeyError\",\"kind\":\"interface\",\"url\":\"html/MediaKeyError.html\"},{\"name\":\"MediaKeyEvent\",\"kind\":\"interface\",\"url\":\"html/MediaKeyEvent.html\"},{\"name\":\"MediaList\",\"kind\":\"interface\",\"url\":\"html/MediaList.html\"},{\"name\":\"MediaQueryList\",\"kind\":\"interface\",\"url\":\"html/MediaQueryList.html\"},{\"name\":\"MediaQueryListListener\",\"kind\":\"interface\",\"url\":\"html/MediaQueryListListener.html\"},{\"name\":\"MediaStream\",\"kind\":\"interface\",\"url\":\"html/MediaStream.html\"},{\"name\":\"MediaStreamEvent\",\"kind\":\"interface\",\"url\":\"html/MediaStreamEvent.html\"},{\"name\":\"MediaStreamEvents\",\"kind\":\"interface\",\"url\":\"html/MediaStreamEvents.html\"},{\"name\":\"MediaStreamList\",\"kind\":\"interface\",\"url\":\"html/MediaStreamList.html\"},{\"name\":\"MediaStreamTrack\",\"kind\":\"interface\",\"url\":\"html/MediaStreamTrack.html\"},{\"name\":\"MediaStreamTrackList\",\"kind\":\"interface\",\"url\":\"html/MediaStreamTrackList.html\"},{\"name\":\"MemoryInfo\",\"kind\":\"interface\",\"url\":\"html/MemoryInfo.html\"},{\"name\":\"MenuElement\",\"kind\":\"interface\",\"url\":\"html/MenuElement.html\"},{\"name\":\"MessageChannel\",\"kind\":\"interface\",\"url\":\"html/MessageChannel.html\"},{\"name\":\"MessageEvent\",\"kind\":\"interface\",\"url\":\"html/MessageEvent.html\"},{\"name\":\"MessagePort\",\"kind\":\"interface\",\"url\":\"html/MessagePort.html\"},{\"name\":\"MessagePortEvents\",\"kind\":\"interface\",\"url\":\"html/MessagePortEvents.html\"},{\"name\":\"Metadata\",\"kind\":\"interface\",\"url\":\"html/Metadata.html\"},{\"name\":\"MetadataCallback\",\"kind\":\"interface\",\"url\":\"html/MetadataCallback.html\"},{\"name\":\"MetaElement\",\"kind\":\"interface\",\"url\":\"html/MetaElement.html\"},{\"name\":\"MeterElement\",\"kind\":\"interface\",\"url\":\"html/MeterElement.html\"},{\"name\":\"ModElement\",\"kind\":\"interface\",\"url\":\"html/ModElement.html\"},{\"name\":\"MouseEvent\",\"kind\":\"interface\",\"url\":\"html/MouseEvent.html\"},{\"name\":\"MutationCallback\",\"kind\":\"interface\",\"url\":\"html/MutationCallback.html\"},{\"name\":\"MutationEvent\",\"kind\":\"interface\",\"url\":\"html/MutationEvent.html\"},{\"name\":\"MutationRecord\",\"kind\":\"interface\",\"url\":\"html/MutationRecord.html\"},{\"name\":\"NamedNodeMap\",\"kind\":\"interface\",\"url\":\"html/NamedNodeMap.html\"},{\"name\":\"Navigator\",\"kind\":\"interface\",\"url\":\"html/Navigator.html\"},{\"name\":\"NavigatorUserMediaError\",\"kind\":\"interface\",\"url\":\"html/NavigatorUserMediaError.html\"},{\"name\":\"NavigatorUserMediaErrorCallback\",\"kind\":\"interface\",\"url\":\"html/NavigatorUserMediaErrorCallback.html\"},{\"name\":\"NavigatorUserMediaSuccessCallback\",\"kind\":\"interface\",\"url\":\"html/NavigatorUserMediaSuccessCallback.html\"},{\"name\":\"Node\",\"kind\":\"interface\",\"url\":\"html/Node.html\"},{\"name\":\"NodeFilter\",\"kind\":\"interface\",\"url\":\"html/NodeFilter.html\"},{\"name\":\"NodeIterator\",\"kind\":\"interface\",\"url\":\"html/NodeIterator.html\"},{\"name\":\"NodeList\",\"kind\":\"interface\",\"url\":\"html/NodeList.html\"},{\"name\":\"NodeSelector\",\"kind\":\"interface\",\"url\":\"html/NodeSelector.html\"},{\"name\":\"Notation\",\"kind\":\"interface\",\"url\":\"html/Notation.html\"},{\"name\":\"Notification\",\"kind\":\"interface\",\"url\":\"html/Notification.html\"},{\"name\":\"NotificationCenter\",\"kind\":\"interface\",\"url\":\"html/NotificationCenter.html\"},{\"name\":\"NotificationEvents\",\"kind\":\"interface\",\"url\":\"html/NotificationEvents.html\"},{\"name\":\"ObjectElement\",\"kind\":\"interface\",\"url\":\"html/ObjectElement.html\"},{\"name\":\"OESStandardDerivatives\",\"kind\":\"interface\",\"url\":\"html/OESStandardDerivatives.html\"},{\"name\":\"OESTextureFloat\",\"kind\":\"interface\",\"url\":\"html/OESTextureFloat.html\"},{\"name\":\"OESVertexArrayObject\",\"kind\":\"interface\",\"url\":\"html/OESVertexArrayObject.html\"},{\"name\":\"OfflineAudioCompletionEvent\",\"kind\":\"interface\",\"url\":\"html/OfflineAudioCompletionEvent.html\"},{\"name\":\"OListElement\",\"kind\":\"interface\",\"url\":\"html/OListElement.html\"},{\"name\":\"OperationNotAllowedException\",\"kind\":\"interface\",\"url\":\"html/OperationNotAllowedException.html\"},{\"name\":\"OptGroupElement\",\"kind\":\"interface\",\"url\":\"html/OptGroupElement.html\"},{\"name\":\"OptionElement\",\"kind\":\"interface\",\"url\":\"html/OptionElement.html\"},{\"name\":\"Oscillator\",\"kind\":\"interface\",\"url\":\"html/Oscillator.html\"},{\"name\":\"OutputElement\",\"kind\":\"interface\",\"url\":\"html/OutputElement.html\"},{\"name\":\"OverflowEvent\",\"kind\":\"interface\",\"url\":\"html/OverflowEvent.html\"},{\"name\":\"PageTransitionEvent\",\"kind\":\"interface\",\"url\":\"html/PageTransitionEvent.html\"},{\"name\":\"ParagraphElement\",\"kind\":\"interface\",\"url\":\"html/ParagraphElement.html\"},{\"name\":\"ParamElement\",\"kind\":\"interface\",\"url\":\"html/ParamElement.html\"},{\"name\":\"PeerConnection00\",\"kind\":\"interface\",\"url\":\"html/PeerConnection00.html\"},{\"name\":\"PeerConnection00Events\",\"kind\":\"interface\",\"url\":\"html/PeerConnection00Events.html\"},{\"name\":\"Performance\",\"kind\":\"interface\",\"url\":\"html/Performance.html\"},{\"name\":\"PerformanceNavigation\",\"kind\":\"interface\",\"url\":\"html/PerformanceNavigation.html\"},{\"name\":\"PerformanceTiming\",\"kind\":\"interface\",\"url\":\"html/PerformanceTiming.html\"},{\"name\":\"Point\",\"kind\":\"interface\",\"url\":\"html/Point.html\"},{\"name\":\"PointerLock\",\"kind\":\"interface\",\"url\":\"html/PointerLock.html\"},{\"name\":\"PopStateEvent\",\"kind\":\"interface\",\"url\":\"html/PopStateEvent.html\"},{\"name\":\"PositionCallback\",\"kind\":\"interface\",\"url\":\"html/PositionCallback.html\"},{\"name\":\"PositionError\",\"kind\":\"interface\",\"url\":\"html/PositionError.html\"},{\"name\":\"PositionErrorCallback\",\"kind\":\"interface\",\"url\":\"html/PositionErrorCallback.html\"},{\"name\":\"PreElement\",\"kind\":\"interface\",\"url\":\"html/PreElement.html\"},{\"name\":\"ProcessingInstruction\",\"kind\":\"interface\",\"url\":\"html/ProcessingInstruction.html\"},{\"name\":\"ProgressElement\",\"kind\":\"interface\",\"url\":\"html/ProgressElement.html\"},{\"name\":\"ProgressEvent\",\"kind\":\"interface\",\"url\":\"html/ProgressEvent.html\"},{\"name\":\"QuoteElement\",\"kind\":\"interface\",\"url\":\"html/QuoteElement.html\"},{\"name\":\"Range\",\"kind\":\"interface\",\"url\":\"html/Range.html\"},{\"name\":\"RangeException\",\"kind\":\"interface\",\"url\":\"html/RangeException.html\"},{\"name\":\"ReadyState\",\"kind\":\"interface\",\"url\":\"html/ReadyState.html\"},{\"name\":\"RealtimeAnalyserNode\",\"kind\":\"interface\",\"url\":\"html/RealtimeAnalyserNode.html\"},{\"name\":\"Rect\",\"kind\":\"interface\",\"url\":\"html/Rect.html\"},{\"name\":\"RequestAnimationFrameCallback\",\"kind\":\"interface\",\"url\":\"html/RequestAnimationFrameCallback.html\"},{\"name\":\"RGBColor\",\"kind\":\"interface\",\"url\":\"html/RGBColor.html\"},{\"name\":\"Screen\",\"kind\":\"interface\",\"url\":\"html/Screen.html\"},{\"name\":\"ScriptElement\",\"kind\":\"interface\",\"url\":\"html/ScriptElement.html\"},{\"name\":\"ScriptProfile\",\"kind\":\"interface\",\"url\":\"html/ScriptProfile.html\"},{\"name\":\"ScriptProfileNode\",\"kind\":\"interface\",\"url\":\"html/ScriptProfileNode.html\"},{\"name\":\"SelectElement\",\"kind\":\"interface\",\"url\":\"html/SelectElement.html\"},{\"name\":\"SessionDescription\",\"kind\":\"interface\",\"url\":\"html/SessionDescription.html\"},{\"name\":\"ShadowElement\",\"kind\":\"interface\",\"url\":\"html/ShadowElement.html\"},{\"name\":\"ShadowRoot\",\"kind\":\"interface\",\"url\":\"html/ShadowRoot.html\"},{\"name\":\"SharedWorker\",\"kind\":\"interface\",\"url\":\"html/SharedWorker.html\"},{\"name\":\"SharedWorkerContext\",\"kind\":\"interface\",\"url\":\"html/SharedWorkerContext.html\"},{\"name\":\"SharedWorkerContextEvents\",\"kind\":\"interface\",\"url\":\"html/SharedWorkerContextEvents.html\"},{\"name\":\"SignalingCallback\",\"kind\":\"interface\",\"url\":\"html/SignalingCallback.html\"},{\"name\":\"SourceElement\",\"kind\":\"interface\",\"url\":\"html/SourceElement.html\"},{\"name\":\"SpanElement\",\"kind\":\"interface\",\"url\":\"html/SpanElement.html\"},{\"name\":\"SpeechGrammar\",\"kind\":\"interface\",\"url\":\"html/SpeechGrammar.html\"},{\"name\":\"SpeechGrammarList\",\"kind\":\"interface\",\"url\":\"html/SpeechGrammarList.html\"},{\"name\":\"SpeechInputEvent\",\"kind\":\"interface\",\"url\":\"html/SpeechInputEvent.html\"},{\"name\":\"SpeechInputResult\",\"kind\":\"interface\",\"url\":\"html/SpeechInputResult.html\"},{\"name\":\"SpeechInputResultList\",\"kind\":\"interface\",\"url\":\"html/SpeechInputResultList.html\"},{\"name\":\"SpeechRecognition\",\"kind\":\"interface\",\"url\":\"html/SpeechRecognition.html\"},{\"name\":\"SpeechRecognitionAlternative\",\"kind\":\"interface\",\"url\":\"html/SpeechRecognitionAlternative.html\"},{\"name\":\"SpeechRecognitionError\",\"kind\":\"interface\",\"url\":\"html/SpeechRecognitionError.html\"},{\"name\":\"SpeechRecognitionEvent\",\"kind\":\"interface\",\"url\":\"html/SpeechRecognitionEvent.html\"},{\"name\":\"SpeechRecognitionEvents\",\"kind\":\"interface\",\"url\":\"html/SpeechRecognitionEvents.html\"},{\"name\":\"SpeechRecognitionResult\",\"kind\":\"interface\",\"url\":\"html/SpeechRecognitionResult.html\"},{\"name\":\"SpeechRecognitionResultList\",\"kind\":\"interface\",\"url\":\"html/SpeechRecognitionResultList.html\"},{\"name\":\"SQLError\",\"kind\":\"interface\",\"url\":\"html/SQLError.html\"},{\"name\":\"SQLException\",\"kind\":\"interface\",\"url\":\"html/SQLException.html\"},{\"name\":\"SQLResultSet\",\"kind\":\"interface\",\"url\":\"html/SQLResultSet.html\"},{\"name\":\"SQLResultSetRowList\",\"kind\":\"interface\",\"url\":\"html/SQLResultSetRowList.html\"},{\"name\":\"SQLStatementCallback\",\"kind\":\"interface\",\"url\":\"html/SQLStatementCallback.html\"},{\"name\":\"SQLStatementErrorCallback\",\"kind\":\"interface\",\"url\":\"html/SQLStatementErrorCallback.html\"},{\"name\":\"SQLTransaction\",\"kind\":\"interface\",\"url\":\"html/SQLTransaction.html\"},{\"name\":\"SQLTransactionCallback\",\"kind\":\"interface\",\"url\":\"html/SQLTransactionCallback.html\"},{\"name\":\"SQLTransactionErrorCallback\",\"kind\":\"interface\",\"url\":\"html/SQLTransactionErrorCallback.html\"},{\"name\":\"SQLTransactionSync\",\"kind\":\"interface\",\"url\":\"html/SQLTransactionSync.html\"},{\"name\":\"SQLTransactionSyncCallback\",\"kind\":\"interface\",\"url\":\"html/SQLTransactionSyncCallback.html\"},{\"name\":\"Storage\",\"kind\":\"interface\",\"url\":\"html/Storage.html\"},{\"name\":\"StorageEvent\",\"kind\":\"interface\",\"url\":\"html/StorageEvent.html\"},{\"name\":\"StorageInfo\",\"kind\":\"interface\",\"url\":\"html/StorageInfo.html\"},{\"name\":\"StorageInfoErrorCallback\",\"kind\":\"interface\",\"url\":\"html/StorageInfoErrorCallback.html\"},{\"name\":\"StorageInfoQuotaCallback\",\"kind\":\"interface\",\"url\":\"html/StorageInfoQuotaCallback.html\"},{\"name\":\"StorageInfoUsageCallback\",\"kind\":\"interface\",\"url\":\"html/StorageInfoUsageCallback.html\"},{\"name\":\"StringCallback\",\"kind\":\"interface\",\"url\":\"html/StringCallback.html\"},{\"name\":\"StyleElement\",\"kind\":\"interface\",\"url\":\"html/StyleElement.html\"},{\"name\":\"StyleMedia\",\"kind\":\"interface\",\"url\":\"html/StyleMedia.html\"},{\"name\":\"StyleSheet\",\"kind\":\"interface\",\"url\":\"html/StyleSheet.html\"},{\"name\":\"StyleSheetList\",\"kind\":\"interface\",\"url\":\"html/StyleSheetList.html\"},{\"name\":\"SVGAElement\",\"kind\":\"interface\",\"url\":\"html/SVGAElement.html\"},{\"name\":\"SVGAltGlyphDefElement\",\"kind\":\"interface\",\"url\":\"html/SVGAltGlyphDefElement.html\"},{\"name\":\"SVGAltGlyphElement\",\"kind\":\"interface\",\"url\":\"html/SVGAltGlyphElement.html\"},{\"name\":\"SVGAltGlyphItemElement\",\"kind\":\"interface\",\"url\":\"html/SVGAltGlyphItemElement.html\"},{\"name\":\"SVGAngle\",\"kind\":\"interface\",\"url\":\"html/SVGAngle.html\"},{\"name\":\"SVGAnimateColorElement\",\"kind\":\"interface\",\"url\":\"html/SVGAnimateColorElement.html\"},{\"name\":\"SVGAnimatedAngle\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedAngle.html\"},{\"name\":\"SVGAnimatedBoolean\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedBoolean.html\"},{\"name\":\"SVGAnimatedEnumeration\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedEnumeration.html\"},{\"name\":\"SVGAnimatedInteger\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedInteger.html\"},{\"name\":\"SVGAnimatedLength\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedLength.html\"},{\"name\":\"SVGAnimatedLengthList\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedLengthList.html\"},{\"name\":\"SVGAnimatedNumber\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedNumber.html\"},{\"name\":\"SVGAnimatedNumberList\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedNumberList.html\"},{\"name\":\"SVGAnimatedPreserveAspectRatio\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedPreserveAspectRatio.html\"},{\"name\":\"SVGAnimatedRect\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedRect.html\"},{\"name\":\"SVGAnimatedString\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedString.html\"},{\"name\":\"SVGAnimatedTransformList\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedTransformList.html\"},{\"name\":\"SVGAnimateElement\",\"kind\":\"interface\",\"url\":\"html/SVGAnimateElement.html\"},{\"name\":\"SVGAnimateMotionElement\",\"kind\":\"interface\",\"url\":\"html/SVGAnimateMotionElement.html\"},{\"name\":\"SVGAnimateTransformElement\",\"kind\":\"interface\",\"url\":\"html/SVGAnimateTransformElement.html\"},{\"name\":\"SVGAnimationElement\",\"kind\":\"interface\",\"url\":\"html/SVGAnimationElement.html\"},{\"name\":\"SVGCircleElement\",\"kind\":\"interface\",\"url\":\"html/SVGCircleElement.html\"},{\"name\":\"SVGClipPathElement\",\"kind\":\"interface\",\"url\":\"html/SVGClipPathElement.html\"},{\"name\":\"SVGColor\",\"kind\":\"interface\",\"url\":\"html/SVGColor.html\"},{\"name\":\"SVGComponentTransferFunctionElement\",\"kind\":\"interface\",\"url\":\"html/SVGComponentTransferFunctionElement.html\"},{\"name\":\"SVGCursorElement\",\"kind\":\"interface\",\"url\":\"html/SVGCursorElement.html\"},{\"name\":\"SVGDefsElement\",\"kind\":\"interface\",\"url\":\"html/SVGDefsElement.html\"},{\"name\":\"SVGDescElement\",\"kind\":\"interface\",\"url\":\"html/SVGDescElement.html\"},{\"name\":\"SVGDocument\",\"kind\":\"interface\",\"url\":\"html/SVGDocument.html\"},{\"name\":\"SVGElement\",\"kind\":\"interface\",\"url\":\"html/SVGElement.html\"},{\"name\":\"SVGElementInstance\",\"kind\":\"interface\",\"url\":\"html/SVGElementInstance.html\"},{\"name\":\"SVGElementInstanceEvents\",\"kind\":\"interface\",\"url\":\"html/SVGElementInstanceEvents.html\"},{\"name\":\"SVGElementInstanceList\",\"kind\":\"interface\",\"url\":\"html/SVGElementInstanceList.html\"},{\"name\":\"SVGEllipseElement\",\"kind\":\"interface\",\"url\":\"html/SVGEllipseElement.html\"},{\"name\":\"SVGException\",\"kind\":\"interface\",\"url\":\"html/SVGException.html\"},{\"name\":\"SVGExternalResourcesRequired\",\"kind\":\"interface\",\"url\":\"html/SVGExternalResourcesRequired.html\"},{\"name\":\"SVGFEBlendElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEBlendElement.html\"},{\"name\":\"SVGFEColorMatrixElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEColorMatrixElement.html\"},{\"name\":\"SVGFEComponentTransferElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEComponentTransferElement.html\"},{\"name\":\"SVGFECompositeElement\",\"kind\":\"interface\",\"url\":\"html/SVGFECompositeElement.html\"},{\"name\":\"SVGFEConvolveMatrixElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEConvolveMatrixElement.html\"},{\"name\":\"SVGFEDiffuseLightingElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEDiffuseLightingElement.html\"},{\"name\":\"SVGFEDisplacementMapElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEDisplacementMapElement.html\"},{\"name\":\"SVGFEDistantLightElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEDistantLightElement.html\"},{\"name\":\"SVGFEDropShadowElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEDropShadowElement.html\"},{\"name\":\"SVGFEFloodElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEFloodElement.html\"},{\"name\":\"SVGFEFuncAElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEFuncAElement.html\"},{\"name\":\"SVGFEFuncBElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEFuncBElement.html\"},{\"name\":\"SVGFEFuncGElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEFuncGElement.html\"},{\"name\":\"SVGFEFuncRElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEFuncRElement.html\"},{\"name\":\"SVGFEGaussianBlurElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEGaussianBlurElement.html\"},{\"name\":\"SVGFEImageElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEImageElement.html\"},{\"name\":\"SVGFEMergeElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEMergeElement.html\"},{\"name\":\"SVGFEMergeNodeElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEMergeNodeElement.html\"},{\"name\":\"SVGFEMorphologyElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEMorphologyElement.html\"},{\"name\":\"SVGFEOffsetElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEOffsetElement.html\"},{\"name\":\"SVGFEPointLightElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEPointLightElement.html\"},{\"name\":\"SVGFESpecularLightingElement\",\"kind\":\"interface\",\"url\":\"html/SVGFESpecularLightingElement.html\"},{\"name\":\"SVGFESpotLightElement\",\"kind\":\"interface\",\"url\":\"html/SVGFESpotLightElement.html\"},{\"name\":\"SVGFETileElement\",\"kind\":\"interface\",\"url\":\"html/SVGFETileElement.html\"},{\"name\":\"SVGFETurbulenceElement\",\"kind\":\"interface\",\"url\":\"html/SVGFETurbulenceElement.html\"},{\"name\":\"SVGFilterElement\",\"kind\":\"interface\",\"url\":\"html/SVGFilterElement.html\"},{\"name\":\"SVGFilterPrimitiveStandardAttributes\",\"kind\":\"interface\",\"url\":\"html/SVGFilterPrimitiveStandardAttributes.html\"},{\"name\":\"SVGFitToViewBox\",\"kind\":\"interface\",\"url\":\"html/SVGFitToViewBox.html\"},{\"name\":\"SVGFontElement\",\"kind\":\"interface\",\"url\":\"html/SVGFontElement.html\"},{\"name\":\"SVGFontFaceElement\",\"kind\":\"interface\",\"url\":\"html/SVGFontFaceElement.html\"},{\"name\":\"SVGFontFaceFormatElement\",\"kind\":\"interface\",\"url\":\"html/SVGFontFaceFormatElement.html\"},{\"name\":\"SVGFontFaceNameElement\",\"kind\":\"interface\",\"url\":\"html/SVGFontFaceNameElement.html\"},{\"name\":\"SVGFontFaceSrcElement\",\"kind\":\"interface\",\"url\":\"html/SVGFontFaceSrcElement.html\"},{\"name\":\"SVGFontFaceUriElement\",\"kind\":\"interface\",\"url\":\"html/SVGFontFaceUriElement.html\"},{\"name\":\"SVGForeignObjectElement\",\"kind\":\"interface\",\"url\":\"html/SVGForeignObjectElement.html\"},{\"name\":\"SVGGElement\",\"kind\":\"interface\",\"url\":\"html/SVGGElement.html\"},{\"name\":\"SVGGlyphElement\",\"kind\":\"interface\",\"url\":\"html/SVGGlyphElement.html\"},{\"name\":\"SVGGlyphRefElement\",\"kind\":\"interface\",\"url\":\"html/SVGGlyphRefElement.html\"},{\"name\":\"SVGGradientElement\",\"kind\":\"interface\",\"url\":\"html/SVGGradientElement.html\"},{\"name\":\"SVGHKernElement\",\"kind\":\"interface\",\"url\":\"html/SVGHKernElement.html\"},{\"name\":\"SVGImageElement\",\"kind\":\"interface\",\"url\":\"html/SVGImageElement.html\"},{\"name\":\"SVGLangSpace\",\"kind\":\"interface\",\"url\":\"html/SVGLangSpace.html\"},{\"name\":\"SVGLength\",\"kind\":\"interface\",\"url\":\"html/SVGLength.html\"},{\"name\":\"SVGLengthList\",\"kind\":\"interface\",\"url\":\"html/SVGLengthList.html\"},{\"name\":\"SVGLinearGradientElement\",\"kind\":\"interface\",\"url\":\"html/SVGLinearGradientElement.html\"},{\"name\":\"SVGLineElement\",\"kind\":\"interface\",\"url\":\"html/SVGLineElement.html\"},{\"name\":\"SVGLocatable\",\"kind\":\"interface\",\"url\":\"html/SVGLocatable.html\"},{\"name\":\"SVGMarkerElement\",\"kind\":\"interface\",\"url\":\"html/SVGMarkerElement.html\"},{\"name\":\"SVGMaskElement\",\"kind\":\"interface\",\"url\":\"html/SVGMaskElement.html\"},{\"name\":\"SVGMatrix\",\"kind\":\"interface\",\"url\":\"html/SVGMatrix.html\"},{\"name\":\"SVGMetadataElement\",\"kind\":\"interface\",\"url\":\"html/SVGMetadataElement.html\"},{\"name\":\"SVGMissingGlyphElement\",\"kind\":\"interface\",\"url\":\"html/SVGMissingGlyphElement.html\"},{\"name\":\"SVGMPathElement\",\"kind\":\"interface\",\"url\":\"html/SVGMPathElement.html\"},{\"name\":\"SVGNumber\",\"kind\":\"interface\",\"url\":\"html/SVGNumber.html\"},{\"name\":\"SVGNumberList\",\"kind\":\"interface\",\"url\":\"html/SVGNumberList.html\"},{\"name\":\"SVGPaint\",\"kind\":\"interface\",\"url\":\"html/SVGPaint.html\"},{\"name\":\"SVGPathElement\",\"kind\":\"interface\",\"url\":\"html/SVGPathElement.html\"},{\"name\":\"SVGPathSeg\",\"kind\":\"interface\",\"url\":\"html/SVGPathSeg.html\"},{\"name\":\"SVGPathSegArcAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegArcAbs.html\"},{\"name\":\"SVGPathSegArcRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegArcRel.html\"},{\"name\":\"SVGPathSegClosePath\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegClosePath.html\"},{\"name\":\"SVGPathSegCurvetoCubicAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoCubicAbs.html\"},{\"name\":\"SVGPathSegCurvetoCubicRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoCubicRel.html\"},{\"name\":\"SVGPathSegCurvetoCubicSmoothAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoCubicSmoothAbs.html\"},{\"name\":\"SVGPathSegCurvetoCubicSmoothRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoCubicSmoothRel.html\"},{\"name\":\"SVGPathSegCurvetoQuadraticAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoQuadraticAbs.html\"},{\"name\":\"SVGPathSegCurvetoQuadraticRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoQuadraticRel.html\"},{\"name\":\"SVGPathSegCurvetoQuadraticSmoothAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoQuadraticSmoothAbs.html\"},{\"name\":\"SVGPathSegCurvetoQuadraticSmoothRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoQuadraticSmoothRel.html\"},{\"name\":\"SVGPathSegLinetoAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegLinetoAbs.html\"},{\"name\":\"SVGPathSegLinetoHorizontalAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegLinetoHorizontalAbs.html\"},{\"name\":\"SVGPathSegLinetoHorizontalRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegLinetoHorizontalRel.html\"},{\"name\":\"SVGPathSegLinetoRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegLinetoRel.html\"},{\"name\":\"SVGPathSegLinetoVerticalAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegLinetoVerticalAbs.html\"},{\"name\":\"SVGPathSegLinetoVerticalRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegLinetoVerticalRel.html\"},{\"name\":\"SVGPathSegList\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegList.html\"},{\"name\":\"SVGPathSegMovetoAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegMovetoAbs.html\"},{\"name\":\"SVGPathSegMovetoRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegMovetoRel.html\"},{\"name\":\"SVGPatternElement\",\"kind\":\"interface\",\"url\":\"html/SVGPatternElement.html\"},{\"name\":\"SVGPoint\",\"kind\":\"interface\",\"url\":\"html/SVGPoint.html\"},{\"name\":\"SVGPointList\",\"kind\":\"interface\",\"url\":\"html/SVGPointList.html\"},{\"name\":\"SVGPolygonElement\",\"kind\":\"interface\",\"url\":\"html/SVGPolygonElement.html\"},{\"name\":\"SVGPolylineElement\",\"kind\":\"interface\",\"url\":\"html/SVGPolylineElement.html\"},{\"name\":\"SVGPreserveAspectRatio\",\"kind\":\"interface\",\"url\":\"html/SVGPreserveAspectRatio.html\"},{\"name\":\"SVGRadialGradientElement\",\"kind\":\"interface\",\"url\":\"html/SVGRadialGradientElement.html\"},{\"name\":\"SVGRect\",\"kind\":\"interface\",\"url\":\"html/SVGRect.html\"},{\"name\":\"SVGRectElement\",\"kind\":\"interface\",\"url\":\"html/SVGRectElement.html\"},{\"name\":\"SVGRenderingIntent\",\"kind\":\"interface\",\"url\":\"html/SVGRenderingIntent.html\"},{\"name\":\"SVGScriptElement\",\"kind\":\"interface\",\"url\":\"html/SVGScriptElement.html\"},{\"name\":\"SVGSetElement\",\"kind\":\"interface\",\"url\":\"html/SVGSetElement.html\"},{\"name\":\"SVGStopElement\",\"kind\":\"interface\",\"url\":\"html/SVGStopElement.html\"},{\"name\":\"SVGStringList\",\"kind\":\"interface\",\"url\":\"html/SVGStringList.html\"},{\"name\":\"SVGStylable\",\"kind\":\"interface\",\"url\":\"html/SVGStylable.html\"},{\"name\":\"SVGStyleElement\",\"kind\":\"interface\",\"url\":\"html/SVGStyleElement.html\"},{\"name\":\"SVGSVGElement\",\"kind\":\"interface\",\"url\":\"html/SVGSVGElement.html\"},{\"name\":\"SVGSwitchElement\",\"kind\":\"interface\",\"url\":\"html/SVGSwitchElement.html\"},{\"name\":\"SVGSymbolElement\",\"kind\":\"interface\",\"url\":\"html/SVGSymbolElement.html\"},{\"name\":\"SVGTests\",\"kind\":\"interface\",\"url\":\"html/SVGTests.html\"},{\"name\":\"SVGTextContentElement\",\"kind\":\"interface\",\"url\":\"html/SVGTextContentElement.html\"},{\"name\":\"SVGTextElement\",\"kind\":\"interface\",\"url\":\"html/SVGTextElement.html\"},{\"name\":\"SVGTextPathElement\",\"kind\":\"interface\",\"url\":\"html/SVGTextPathElement.html\"},{\"name\":\"SVGTextPositioningElement\",\"kind\":\"interface\",\"url\":\"html/SVGTextPositioningElement.html\"},{\"name\":\"SVGTitleElement\",\"kind\":\"interface\",\"url\":\"html/SVGTitleElement.html\"},{\"name\":\"SVGTransform\",\"kind\":\"interface\",\"url\":\"html/SVGTransform.html\"},{\"name\":\"SVGTransformable\",\"kind\":\"interface\",\"url\":\"html/SVGTransformable.html\"},{\"name\":\"SVGTransformList\",\"kind\":\"interface\",\"url\":\"html/SVGTransformList.html\"},{\"name\":\"SVGTRefElement\",\"kind\":\"interface\",\"url\":\"html/SVGTRefElement.html\"},{\"name\":\"SVGTSpanElement\",\"kind\":\"interface\",\"url\":\"html/SVGTSpanElement.html\"},{\"name\":\"SVGUnitTypes\",\"kind\":\"interface\",\"url\":\"html/SVGUnitTypes.html\"},{\"name\":\"SVGURIReference\",\"kind\":\"interface\",\"url\":\"html/SVGURIReference.html\"},{\"name\":\"SVGUseElement\",\"kind\":\"interface\",\"url\":\"html/SVGUseElement.html\"},{\"name\":\"SVGViewElement\",\"kind\":\"interface\",\"url\":\"html/SVGViewElement.html\"},{\"name\":\"SVGViewSpec\",\"kind\":\"interface\",\"url\":\"html/SVGViewSpec.html\"},{\"name\":\"SVGVKernElement\",\"kind\":\"interface\",\"url\":\"html/SVGVKernElement.html\"},{\"name\":\"SVGZoomAndPan\",\"kind\":\"interface\",\"url\":\"html/SVGZoomAndPan.html\"},{\"name\":\"SVGZoomEvent\",\"kind\":\"interface\",\"url\":\"html/SVGZoomEvent.html\"},{\"name\":\"TableCaptionElement\",\"kind\":\"interface\",\"url\":\"html/TableCaptionElement.html\"},{\"name\":\"TableCellElement\",\"kind\":\"interface\",\"url\":\"html/TableCellElement.html\"},{\"name\":\"TableColElement\",\"kind\":\"interface\",\"url\":\"html/TableColElement.html\"},{\"name\":\"TableElement\",\"kind\":\"interface\",\"url\":\"html/TableElement.html\"},{\"name\":\"TableRowElement\",\"kind\":\"interface\",\"url\":\"html/TableRowElement.html\"},{\"name\":\"TableSectionElement\",\"kind\":\"interface\",\"url\":\"html/TableSectionElement.html\"},{\"name\":\"Testing\",\"kind\":\"class\",\"url\":\"html/Testing.html\"},{\"name\":\"Text\",\"kind\":\"interface\",\"url\":\"html/Text.html\"},{\"name\":\"TextAreaElement\",\"kind\":\"interface\",\"url\":\"html/TextAreaElement.html\"},{\"name\":\"TextEvent\",\"kind\":\"interface\",\"url\":\"html/TextEvent.html\"},{\"name\":\"TextMetrics\",\"kind\":\"interface\",\"url\":\"html/TextMetrics.html\"},{\"name\":\"TextTrack\",\"kind\":\"interface\",\"url\":\"html/TextTrack.html\"},{\"name\":\"TextTrackCue\",\"kind\":\"interface\",\"url\":\"html/TextTrackCue.html\"},{\"name\":\"TextTrackCueEvents\",\"kind\":\"interface\",\"url\":\"html/TextTrackCueEvents.html\"},{\"name\":\"TextTrackCueList\",\"kind\":\"interface\",\"url\":\"html/TextTrackCueList.html\"},{\"name\":\"TextTrackEvents\",\"kind\":\"interface\",\"url\":\"html/TextTrackEvents.html\"},{\"name\":\"TextTrackList\",\"kind\":\"interface\",\"url\":\"html/TextTrackList.html\"},{\"name\":\"TextTrackListEvents\",\"kind\":\"interface\",\"url\":\"html/TextTrackListEvents.html\"},{\"name\":\"TimeoutHandler\",\"kind\":\"interface\",\"url\":\"html/TimeoutHandler.html\"},{\"name\":\"TimeRanges\",\"kind\":\"interface\",\"url\":\"html/TimeRanges.html\"},{\"name\":\"TitleElement\",\"kind\":\"interface\",\"url\":\"html/TitleElement.html\"},{\"name\":\"Touch\",\"kind\":\"interface\",\"url\":\"html/Touch.html\"},{\"name\":\"TouchEvent\",\"kind\":\"interface\",\"url\":\"html/TouchEvent.html\"},{\"name\":\"TouchList\",\"kind\":\"interface\",\"url\":\"html/TouchList.html\"},{\"name\":\"TrackElement\",\"kind\":\"interface\",\"url\":\"html/TrackElement.html\"},{\"name\":\"TrackEvent\",\"kind\":\"interface\",\"url\":\"html/TrackEvent.html\"},{\"name\":\"TransitionEvent\",\"kind\":\"interface\",\"url\":\"html/TransitionEvent.html\"},{\"name\":\"TreeWalker\",\"kind\":\"interface\",\"url\":\"html/TreeWalker.html\"},{\"name\":\"UIEvent\",\"kind\":\"interface\",\"url\":\"html/UIEvent.html\"},{\"name\":\"Uint16Array\",\"kind\":\"interface\",\"url\":\"html/Uint16Array.html\"},{\"name\":\"Uint32Array\",\"kind\":\"interface\",\"url\":\"html/Uint32Array.html\"},{\"name\":\"Uint8Array\",\"kind\":\"interface\",\"url\":\"html/Uint8Array.html\"},{\"name\":\"Uint8ClampedArray\",\"kind\":\"interface\",\"url\":\"html/Uint8ClampedArray.html\"},{\"name\":\"UListElement\",\"kind\":\"interface\",\"url\":\"html/UListElement.html\"},{\"name\":\"UnknownElement\",\"kind\":\"interface\",\"url\":\"html/UnknownElement.html\"},{\"name\":\"ValidityState\",\"kind\":\"interface\",\"url\":\"html/ValidityState.html\"},{\"name\":\"VideoElement\",\"kind\":\"interface\",\"url\":\"html/VideoElement.html\"},{\"name\":\"VoidCallback\",\"kind\":\"interface\",\"url\":\"html/VoidCallback.html\"},{\"name\":\"WaveShaperNode\",\"kind\":\"interface\",\"url\":\"html/WaveShaperNode.html\"},{\"name\":\"WaveTable\",\"kind\":\"interface\",\"url\":\"html/WaveTable.html\"},{\"name\":\"WebGLActiveInfo\",\"kind\":\"interface\",\"url\":\"html/WebGLActiveInfo.html\"},{\"name\":\"WebGLBuffer\",\"kind\":\"interface\",\"url\":\"html/WebGLBuffer.html\"},{\"name\":\"WebGLCompressedTextureS3TC\",\"kind\":\"interface\",\"url\":\"html/WebGLCompressedTextureS3TC.html\"},{\"name\":\"WebGLContextAttributes\",\"kind\":\"interface\",\"url\":\"html/WebGLContextAttributes.html\"},{\"name\":\"WebGLContextEvent\",\"kind\":\"interface\",\"url\":\"html/WebGLContextEvent.html\"},{\"name\":\"WebGLDebugRendererInfo\",\"kind\":\"interface\",\"url\":\"html/WebGLDebugRendererInfo.html\"},{\"name\":\"WebGLDebugShaders\",\"kind\":\"interface\",\"url\":\"html/WebGLDebugShaders.html\"},{\"name\":\"WebGLFramebuffer\",\"kind\":\"interface\",\"url\":\"html/WebGLFramebuffer.html\"},{\"name\":\"WebGLLoseContext\",\"kind\":\"interface\",\"url\":\"html/WebGLLoseContext.html\"},{\"name\":\"WebGLProgram\",\"kind\":\"interface\",\"url\":\"html/WebGLProgram.html\"},{\"name\":\"WebGLRenderbuffer\",\"kind\":\"interface\",\"url\":\"html/WebGLRenderbuffer.html\"},{\"name\":\"WebGLRenderingContext\",\"kind\":\"interface\",\"url\":\"html/WebGLRenderingContext.html\"},{\"name\":\"WebGLShader\",\"kind\":\"interface\",\"url\":\"html/WebGLShader.html\"},{\"name\":\"WebGLShaderPrecisionFormat\",\"kind\":\"interface\",\"url\":\"html/WebGLShaderPrecisionFormat.html\"},{\"name\":\"WebGLTexture\",\"kind\":\"interface\",\"url\":\"html/WebGLTexture.html\"},{\"name\":\"WebGLUniformLocation\",\"kind\":\"interface\",\"url\":\"html/WebGLUniformLocation.html\"},{\"name\":\"WebGLVertexArrayObjectOES\",\"kind\":\"interface\",\"url\":\"html/WebGLVertexArrayObjectOES.html\"},{\"name\":\"WebKitCSSFilterValue\",\"kind\":\"interface\",\"url\":\"html/WebKitCSSFilterValue.html\"},{\"name\":\"WebKitCSSRegionRule\",\"kind\":\"interface\",\"url\":\"html/WebKitCSSRegionRule.html\"},{\"name\":\"WebKitMutationObserver\",\"kind\":\"interface\",\"url\":\"html/WebKitMutationObserver.html\"},{\"name\":\"WebKitNamedFlow\",\"kind\":\"interface\",\"url\":\"html/WebKitNamedFlow.html\"},{\"name\":\"WebSocket\",\"kind\":\"interface\",\"url\":\"html/WebSocket.html\"},{\"name\":\"WebSocketEvents\",\"kind\":\"interface\",\"url\":\"html/WebSocketEvents.html\"},{\"name\":\"WheelEvent\",\"kind\":\"interface\",\"url\":\"html/WheelEvent.html\"},{\"name\":\"Window\",\"kind\":\"interface\",\"url\":\"html/Window.html\"},{\"name\":\"WindowEvents\",\"kind\":\"interface\",\"url\":\"html/WindowEvents.html\"},{\"name\":\"Worker\",\"kind\":\"interface\",\"url\":\"html/Worker.html\"},{\"name\":\"WorkerContext\",\"kind\":\"interface\",\"url\":\"html/WorkerContext.html\"},{\"name\":\"WorkerContextEvents\",\"kind\":\"interface\",\"url\":\"html/WorkerContextEvents.html\"},{\"name\":\"WorkerEvents\",\"kind\":\"interface\",\"url\":\"html/WorkerEvents.html\"},{\"name\":\"WorkerLocation\",\"kind\":\"interface\",\"url\":\"html/WorkerLocation.html\"},{\"name\":\"WorkerNavigator\",\"kind\":\"interface\",\"url\":\"html/WorkerNavigator.html\"},{\"name\":\"XMLHttpRequest\",\"kind\":\"interface\",\"url\":\"html/XMLHttpRequest.html\"},{\"name\":\"XMLHttpRequestEvents\",\"kind\":\"interface\",\"url\":\"html/XMLHttpRequestEvents.html\"},{\"name\":\"XMLHttpRequestException\",\"kind\":\"interface\",\"url\":\"html/XMLHttpRequestException.html\"},{\"name\":\"XMLHttpRequestProgressEvent\",\"kind\":\"interface\",\"url\":\"html/XMLHttpRequestProgressEvent.html\"},{\"name\":\"XMLHttpRequestUpload\",\"kind\":\"interface\",\"url\":\"html/XMLHttpRequestUpload.html\"},{\"name\":\"XMLHttpRequestUploadEvents\",\"kind\":\"interface\",\"url\":\"html/XMLHttpRequestUploadEvents.html\"},{\"name\":\"XMLSerializer\",\"kind\":\"interface\",\"url\":\"html/XMLSerializer.html\"},{\"name\":\"XPathEvaluator\",\"kind\":\"interface\",\"url\":\"html/XPathEvaluator.html\"},{\"name\":\"XPathException\",\"kind\":\"interface\",\"url\":\"html/XPathException.html\"},{\"name\":\"XPathExpression\",\"kind\":\"interface\",\"url\":\"html/XPathExpression.html\"},{\"name\":\"XPathNSResolver\",\"kind\":\"interface\",\"url\":\"html/XPathNSResolver.html\"},{\"name\":\"XPathResult\",\"kind\":\"interface\",\"url\":\"html/XPathResult.html\"},{\"name\":\"XSLTProcessor\",\"kind\":\"interface\",\"url\":\"html/XSLTProcessor.html\"}],\"io\":[{\"name\":\"ChunkedInputStream\",\"kind\":\"interface\",\"url\":\"io/ChunkedInputStream.html\"},{\"name\":\"CloseEvent\",\"kind\":\"interface\",\"url\":\"io/CloseEvent.html\"},{\"name\":\"DecoderException\",\"kind\":\"class\",\"url\":\"io/DecoderException.html\"},{\"name\":\"DetachedSocket\",\"kind\":\"interface\",\"url\":\"io/DetachedSocket.html\"},{\"name\":\"Directory\",\"kind\":\"interface\",\"url\":\"io/Directory.html\"},{\"name\":\"DirectoryIOException\",\"kind\":\"class\",\"url\":\"io/DirectoryIOException.html\"},{\"name\":\"DirectoryLister\",\"kind\":\"interface\",\"url\":\"io/DirectoryLister.html\"},{\"name\":\"EncoderException\",\"kind\":\"class\",\"url\":\"io/EncoderException.html\"},{\"name\":\"Encoding\",\"kind\":\"class\",\"url\":\"io/Encoding.html\"},{\"name\":\"Event\",\"kind\":\"interface\",\"url\":\"io/Event.html\"},{\"name\":\"File\",\"kind\":\"interface\",\"url\":\"io/File.html\"},{\"name\":\"FileIOException\",\"kind\":\"class\",\"url\":\"io/FileIOException.html\"},{\"name\":\"FileMode\",\"kind\":\"class\",\"url\":\"io/FileMode.html\"},{\"name\":\"HttpClient\",\"kind\":\"interface\",\"url\":\"io/HttpClient.html\"},{\"name\":\"HttpClientConnection\",\"kind\":\"interface\",\"url\":\"io/HttpClientConnection.html\"},{\"name\":\"HttpClientRequest\",\"kind\":\"interface\",\"url\":\"io/HttpClientRequest.html\"},{\"name\":\"HttpClientResponse\",\"kind\":\"interface\",\"url\":\"io/HttpClientResponse.html\"},{\"name\":\"HttpException\",\"kind\":\"class\",\"url\":\"io/HttpException.html\"},{\"name\":\"HttpHeaders\",\"kind\":\"interface\",\"url\":\"io/HttpHeaders.html\"},{\"name\":\"HttpParserException\",\"kind\":\"class\",\"url\":\"io/HttpParserException.html\"},{\"name\":\"HttpRequest\",\"kind\":\"interface\",\"url\":\"io/HttpRequest.html\"},{\"name\":\"HttpResponse\",\"kind\":\"interface\",\"url\":\"io/HttpResponse.html\"},{\"name\":\"HttpServer\",\"kind\":\"interface\",\"url\":\"io/HttpServer.html\"},{\"name\":\"HttpStatus\",\"kind\":\"interface\",\"url\":\"io/HttpStatus.html\"},{\"name\":\"InputStream\",\"kind\":\"interface\",\"url\":\"io/InputStream.html\"},{\"name\":\"ListInputStream\",\"kind\":\"interface\",\"url\":\"io/ListInputStream.html\"},{\"name\":\"ListOutputStream\",\"kind\":\"interface\",\"url\":\"io/ListOutputStream.html\"},{\"name\":\"MessageEvent\",\"kind\":\"interface\",\"url\":\"io/MessageEvent.html\"},{\"name\":\"OSError\",\"kind\":\"class\",\"url\":\"io/OSError.html\"},{\"name\":\"OutputStream\",\"kind\":\"interface\",\"url\":\"io/OutputStream.html\"},{\"name\":\"Platform\",\"kind\":\"class\",\"url\":\"io/Platform.html\"},{\"name\":\"Process\",\"kind\":\"class\",\"url\":\"io/Process.html\"},{\"name\":\"ProcessException\",\"kind\":\"class\",\"url\":\"io/ProcessException.html\"},{\"name\":\"ProcessOptions\",\"kind\":\"class\",\"url\":\"io/ProcessOptions.html\"},{\"name\":\"ProcessResult\",\"kind\":\"interface\",\"url\":\"io/ProcessResult.html\"},{\"name\":\"RandomAccessFile\",\"kind\":\"interface\",\"url\":\"io/RandomAccessFile.html\"},{\"name\":\"RedirectException\",\"kind\":\"class\",\"url\":\"io/RedirectException.html\"},{\"name\":\"RedirectInfo\",\"kind\":\"interface\",\"url\":\"io/RedirectInfo.html\"},{\"name\":\"RedirectLimitExceededException\",\"kind\":\"class\",\"url\":\"io/RedirectLimitExceededException.html\"},{\"name\":\"RedirectLoopException\",\"kind\":\"class\",\"url\":\"io/RedirectLoopException.html\"},{\"name\":\"ServerSocket\",\"kind\":\"interface\",\"url\":\"io/ServerSocket.html\"},{\"name\":\"Socket\",\"kind\":\"interface\",\"url\":\"io/Socket.html\"},{\"name\":\"SocketInputStream\",\"kind\":\"interface\",\"url\":\"io/SocketInputStream.html\"},{\"name\":\"SocketIOException\",\"kind\":\"class\",\"url\":\"io/SocketIOException.html\"},{\"name\":\"SocketOutputStream\",\"kind\":\"interface\",\"url\":\"io/SocketOutputStream.html\"},{\"name\":\"StreamException\",\"kind\":\"class\",\"url\":\"io/StreamException.html\"},{\"name\":\"StringInputStream\",\"kind\":\"interface\",\"url\":\"io/StringInputStream.html\"},{\"name\":\"Timer\",\"kind\":\"interface\",\"url\":\"io/Timer.html\"},{\"name\":\"WebSocket\",\"kind\":\"interface\",\"url\":\"io/WebSocket.html\"},{\"name\":\"WebSocketClientConnection\",\"kind\":\"interface\",\"url\":\"io/WebSocketClientConnection.html\"},{\"name\":\"WebSocketConnection\",\"kind\":\"interface\",\"url\":\"io/WebSocketConnection.html\"},{\"name\":\"WebSocketException\",\"kind\":\"class\",\"url\":\"io/WebSocketException.html\"},{\"name\":\"WebSocketHandler\",\"kind\":\"interface\",\"url\":\"io/WebSocketHandler.html\"}],\"json\":[{\"name\":\"JSON\",\"kind\":\"class\",\"url\":\"json/JSON.html\"}],\"uri\":[{\"name\":\"Uri\",\"kind\":\"class\",\"url\":\"uri/Uri.html\"}],\"utf\":[{\"name\":\"IterableUtf16Decoder\",\"kind\":\"class\",\"url\":\"utf/IterableUtf16Decoder.html\"},{\"name\":\"IterableUtf32Decoder\",\"kind\":\"class\",\"url\":\"utf/IterableUtf32Decoder.html\"},{\"name\":\"IterableUtf8Decoder\",\"kind\":\"class\",\"url\":\"utf/IterableUtf8Decoder.html\"},{\"name\":\"Utf16beBytesToCodeUnitsDecoder\",\"kind\":\"class\",\"url\":\"utf/Utf16beBytesToCodeUnitsDecoder.html\"},{\"name\":\"Utf16BytesToCodeUnitsDecoder\",\"kind\":\"class\",\"url\":\"utf/Utf16BytesToCodeUnitsDecoder.html\"},{\"name\":\"Utf16CodeUnitDecoder\",\"kind\":\"class\",\"url\":\"utf/Utf16CodeUnitDecoder.html\"},{\"name\":\"Utf16leBytesToCodeUnitsDecoder\",\"kind\":\"class\",\"url\":\"utf/Utf16leBytesToCodeUnitsDecoder.html\"},{\"name\":\"Utf32beBytesDecoder\",\"kind\":\"class\",\"url\":\"utf/Utf32beBytesDecoder.html\"},{\"name\":\"Utf32BytesDecoder\",\"kind\":\"class\",\"url\":\"utf/Utf32BytesDecoder.html\"},{\"name\":\"Utf32leBytesDecoder\",\"kind\":\"class\",\"url\":\"utf/Utf32leBytesDecoder.html\"},{\"name\":\"Utf8Decoder\",\"kind\":\"class\",\"url\":\"utf/Utf8Decoder.html\"}]}\n      ";
}
Request.prototype.getJson = function() {
  return this.json;
}
function main() {
  useHtmlEnhancedConfiguration(true);
  var parser = new Parser();
  group("parser", (function () {
    test("shoultReturnCorrectTheUrlList", (function () {
      var className = "AssertionError";
      var kind = "class";
      var result = parser.geturl(className);
      Expect.equals($add$($add$(kind, " "), className), result.$index((0)));
    })
    );
    test("ShouldReturnAnEmptyList", (function () {
      var className = "";
      var result = parser.geturl(className);
      Expect.equals((0), result.get$length());
    })
    );
    test("ShouldReturnALotOfResults", (function () {
      var className = "A";
      var result = parser.getUrlsSratingWith(className);
      Expect.equals((31), result.get$length());
    })
    );
  })
  );
  group("dartStringStarWithExploratoryTests", (function () {
    test("shouldBeTrueAssertioErrorStringStartWithA", (function () {
      var className = "a";
      var result = "AssertionError";
      Expect.isTrue(result.toUpperCase().startsWith(className.toUpperCase()));
    })
    );
    test("shouldBeTrueAssertioErrorStringStartWithAs", (function () {
      var className = "as";
      var result = "AssertionError";
      Expect.isTrue(result.toUpperCase().startsWith(className.toUpperCase()));
    })
    );
    test("shouldbeFalseAssertioErrorStringStartWithx", (function () {
      var className = "x";
      var result = "AssertionError";
      Expect.isFalse(result.toUpperCase().startsWith(className.toUpperCase()));
    })
    );
  })
  );
}
(function(){
  var v0/*HTMLMediaElement*/ = 'HTMLMediaElement|HTMLAudioElement|HTMLVideoElement';
  var v1/*SVGElement*/ = 'SVGElement|SVGAElement|SVGAltGlyphDefElement|SVGAltGlyphItemElement|SVGAnimationElement|SVGAnimateColorElement|SVGAnimateElement|SVGAnimateMotionElement|SVGAnimateTransformElement|SVGSetElement|SVGCircleElement|SVGClipPathElement|SVGComponentTransferFunctionElement|SVGFEFuncAElement|SVGFEFuncBElement|SVGFEFuncGElement|SVGFEFuncRElement|SVGCursorElement|SVGDefsElement|SVGDescElement|SVGEllipseElement|SVGFEBlendElement|SVGFEColorMatrixElement|SVGFEComponentTransferElement|SVGFECompositeElement|SVGFEConvolveMatrixElement|SVGFEDiffuseLightingElement|SVGFEDisplacementMapElement|SVGFEDistantLightElement|SVGFEDropShadowElement|SVGFEFloodElement|SVGFEGaussianBlurElement|SVGFEImageElement|SVGFEMergeElement|SVGFEMergeNodeElement|SVGFEMorphologyElement|SVGFEOffsetElement|SVGFEPointLightElement|SVGFESpecularLightingElement|SVGFESpotLightElement|SVGFETileElement|SVGFETurbulenceElement|SVGFilterElement|SVGFontElement|SVGFontFaceElement|SVGFontFaceFormatElement|SVGFontFaceNameElement|SVGFontFaceSrcElement|SVGFontFaceUriElement|SVGForeignObjectElement|SVGGElement|SVGGlyphElement|SVGGlyphRefElement|SVGGradientElement|SVGLinearGradientElement|SVGRadialGradientElement|SVGHKernElement|SVGImageElement|SVGLineElement|SVGMPathElement|SVGMarkerElement|SVGMaskElement|SVGMetadataElement|SVGMissingGlyphElement|SVGPathElement|SVGPatternElement|SVGPolygonElement|SVGPolylineElement|SVGRectElement|SVGSVGElement|SVGScriptElement|SVGStopElement|SVGStyleElement|SVGSwitchElement|SVGSymbolElement|SVGTextContentElement|SVGTextPathElement|SVGTextPositioningElement|SVGAltGlyphElement|SVGTRefElement|SVGTSpanElement|SVGTextElement|SVGTitleElement|SVGUseElement|SVGVKernElement|SVGViewElement';
  var v2/*CharacterData*/ = 'CharacterData|Comment|Text|CDATASection';
  var v3/*HTMLDocument*/ = 'HTMLDocument|SVGDocument';
  var v4/*DocumentFragment*/ = 'DocumentFragment|ShadowRoot';
  var v5/*Element*/ = [v0/*HTMLMediaElement*/,v1/*SVGElement*/,'Element|HTMLElement|HTMLAnchorElement|HTMLAppletElement|HTMLAreaElement|HTMLBRElement|HTMLBaseElement|HTMLBaseFontElement|HTMLBodyElement|HTMLButtonElement|HTMLCanvasElement|HTMLContentElement|HTMLDListElement|HTMLDetailsElement|HTMLDirectoryElement|HTMLDivElement|HTMLEmbedElement|HTMLFieldSetElement|HTMLFontElement|HTMLFormElement|HTMLFrameElement|HTMLFrameSetElement|HTMLHRElement|HTMLHeadElement|HTMLHeadingElement|HTMLHtmlElement|HTMLIFrameElement|HTMLImageElement|HTMLInputElement|HTMLKeygenElement|HTMLLIElement|HTMLLabelElement|HTMLLegendElement|HTMLLinkElement|HTMLMapElement|HTMLMarqueeElement|HTMLMenuElement|HTMLMetaElement|HTMLMeterElement|HTMLModElement|HTMLOListElement|HTMLObjectElement|HTMLOptGroupElement|HTMLOptionElement|HTMLOutputElement|HTMLParagraphElement|HTMLParamElement|HTMLPreElement|HTMLProgressElement|HTMLQuoteElement|HTMLScriptElement|HTMLSelectElement|HTMLShadowElement|HTMLSourceElement|HTMLSpanElement|HTMLStyleElement|HTMLTableCaptionElement|HTMLTableCellElement|HTMLTableColElement|HTMLTableElement|HTMLTableRowElement|HTMLTableSectionElement|HTMLTextAreaElement|HTMLTitleElement|HTMLTrackElement|HTMLUListElement|HTMLUnknownElement'].join('|');
  var v6/*AbstractWorker*/ = 'AbstractWorker|SharedWorker|Worker';
  var v7/*IDBRequest*/ = 'IDBRequest|IDBVersionChangeRequest';
  var v8/*MediaStream*/ = 'MediaStream|LocalMediaStream';
  var v9/*Node*/ = [v2/*CharacterData*/,v3/*HTMLDocument*/,v4/*DocumentFragment*/,v5/*Element*/,'Node|Attr|DocumentType|Entity|EntityReference|Notation|ProcessingInstruction'].join('|');
  var v10/*WorkerContext*/ = 'WorkerContext|DedicatedWorkerContext|SharedWorkerContext';
  var table = [
    ['AbstractWorker', v6/*AbstractWorker*/]
    , ['AudioParam', 'AudioParam|AudioGain']
    , ['CSSValueList', 'CSSValueList|WebKitCSSTransformValue|WebKitCSSFilterValue']
    , ['CharacterData', v2/*CharacterData*/]
    , ['DOMTokenList', 'DOMTokenList|DOMSettableTokenList']
    , ['HTMLDocument', v3/*HTMLDocument*/]
    , ['DocumentFragment', v4/*DocumentFragment*/]
    , ['HTMLMediaElement', v0/*HTMLMediaElement*/]
    , ['SVGElement', v1/*SVGElement*/]
    , ['Element', v5/*Element*/]
    , ['Entry', 'Entry|DirectoryEntry|FileEntry']
    , ['EntrySync', 'EntrySync|DirectoryEntrySync|FileEntrySync']
    , ['IDBRequest', v7/*IDBRequest*/]
    , ['MediaStream', v8/*MediaStream*/]
    , ['Node', v9/*Node*/]
    , ['WorkerContext', v10/*WorkerContext*/]
    , ['EventTarget', [v6/*AbstractWorker*/,v7/*IDBRequest*/,v8/*MediaStream*/,v9/*Node*/,v10/*WorkerContext*/,'EventTarget|AudioContext|BatteryManager|DOMApplicationCache|DeprecatedPeerConnection|EventSource|FileReader|FileWriter|IDBDatabase|IDBTransaction|MediaController|MessagePort|Notification|PeerConnection00|SpeechRecognition|TextTrack|TextTrackCue|TextTrackList|WebSocket|DOMWindow|XMLHttpRequest|XMLHttpRequestUpload'].join('|')]
    , ['HTMLCollection', 'HTMLCollection|HTMLOptionsCollection']
    , ['Uint8Array', 'Uint8Array|Uint8ClampedArray']
  ];
  $dynamicSetMetadata(table);
})();
function $static_init(){
  $globals._callbacksCalled = (0);
  $globals._config = null;
  $globals._currentGroup = "";
  $globals._currentTest = (0);
  $globals._ReceivePortImpl__nextFreeId = (1);
  $globals._state = (0);
  $globals._uncaughtErrorMessage = null;
}
var const$0000 = Object.create(_DeletedKeySentinel.prototype, {});
var const$0001 = Object.create(NoMoreElementsException.prototype, {});
var const$0002 = Object.create(EmptyQueueException.prototype, {});
var const$0003 = Object.create(UnsupportedOperationException.prototype, {_message: {"value": "", writeable: false}});
var const$0010 = new JSSyntaxRegExp("<(\\w+)");
var const$0011 = Object.create(IllegalAccessException.prototype, {});
var const$0012 = _constMap(["body", "html", "head", "html", "caption", "table", "td", "tr", "colgroup", "table", "col", "colgroup", "tr", "tbody", "tbody", "table", "tfoot", "table", "thead", "table", "track", "audio"]);
var const$0013 = new JSSyntaxRegExp("^#[_a-zA-Z]\\w*$");
var const$0014 = new JSSyntaxRegExp("^\\[name=[\"'][^'\"]+['\"]\\]$");
var const$0015 = new JSSyntaxRegExp("^[*a-zA-Z0-9]+$");
var const$0016 = _constMap([]);
var const$0017 = Object.create(UnsupportedOperationException.prototype, {_message: {"value": "TODO(jacobr): should we impl?", writeable: false}});
var const$0019 = ImmutableList.ImmutableList$from$factory([]);
var const$0020 = new JSSyntaxRegExp("^(?:([^:/?#.]+):)?(?://(?:([^/?#]*)@)?([\\w\\d\\-\\u0100-\\uffff.%]*)(?::([0-9]+))?)?([^?#]+)?(?:\\?([^#]*))?(?:#(.*))?$");
if (typeof window != 'undefined' && typeof document != 'undefined' &&
    window.addEventListener && document.readyState == 'loading') {
  window.addEventListener('DOMContentLoaded', function(e) {
    startRootIsolate(main);
  });
} else {
  startRootIsolate(main);
}
