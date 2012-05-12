function $defProp(obj, prop, value) {
  Object.defineProperty(obj, prop,
      {value: value, enumerable: false, writable: true, configurable: true});
}
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
function $wrap_call$0(fn) { return fn; }
function $wrap_call$1(fn) { return fn; };
function $wrap_call$2(fn) { return fn; };
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
function $ne$(x, y) {
  if (x == null) return y != null;
  return (typeof(x) != 'object') ? x !== y : !x.$eq(y);
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
$defProp(Object.prototype, "noSuchMethod", function(name, args) {
  $throw(new NoSuchMethodException(this, name, args));
});
$defProp(Object.prototype, "$dom_addEventListener$3", function($0, $1, $2) {
  return this.noSuchMethod("$dom_addEventListener", [$0, $1, $2]);
});
$defProp(Object.prototype, "add$1", function($0) {
  return this.noSuchMethod("add", [$0]);
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
$defProp(Object.prototype, "remove$0", function() {
  return this.noSuchMethod("remove", []);
});
function IndexOutOfRangeException(_index) {
  this._index = _index;
}
IndexOutOfRangeException.prototype.is$IndexOutOfRangeException = function(){return true};
IndexOutOfRangeException.prototype.toString = function() {
  return ("IndexOutOfRangeException: " + this._index);
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
function IntegerDivisionByZeroException() {

}
IntegerDivisionByZeroException.prototype.is$IntegerDivisionByZeroException = function(){return true};
IntegerDivisionByZeroException.prototype.toString = function() {
  return "IntegerDivisionByZeroException";
}
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
Function.prototype.to$call$3 = function() {
  this.call$3 = this._genStub(3);
  this.to$call$3 = function() { return this.call$3; };
  return this.call$3;
};
Function.prototype.call$3 = function($0, $1, $2) {
  return this.to$call$3()($0, $1, $2);
};
function to$call$3(f) { return f && f.to$call$3(); }
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
$defProp(ListFactory.prototype, "clear$_", function() {
  this.set$length((0));
});
$defProp(ListFactory.prototype, "removeLast", function() {
  return this.pop();
});
$defProp(ListFactory.prototype, "last", function() {
  return this.$index(this.get$length() - (1));
});
$defProp(ListFactory.prototype, "iterator", function() {
  return new ListIterator(this);
});
$defProp(ListFactory.prototype, "toString", function() {
  return Collections.collectionToString(this);
});
$defProp(ListFactory.prototype, "add$1", ListFactory.prototype.add);
$defProp(ListFactory.prototype, "filter$1", function($0) {
  return this.filter(to$call$1($0));
});
$defProp(ListFactory.prototype, "forEach$1", function($0) {
  return this.forEach(to$call$1($0));
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
var NumImplementation = Number;
NumImplementation.prototype.hashCode = function() {
  'use strict'; return this & 0x1FFFFFFF;
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
function CompleterImpl() {
  this._futureImpl = new FutureImpl();
}
CompleterImpl.prototype.get$future = function() {
  return this._futureImpl;
}
CompleterImpl.prototype.complete = function(value) {
  this._futureImpl._setValue(value);
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
HashMapImplementation.prototype.toString = function() {
  return Maps.mapToString(this);
}
HashMapImplementation.prototype.forEach$1 = function($0) {
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
function HashSetImplementation() {
  this._backingMap = new HashMapImplementation();
}
HashSetImplementation.prototype.is$Collection = function(){return true};
HashSetImplementation.prototype.add = function(value) {
  this._backingMap.$setindex(value, value);
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
DoubleLinkedQueueEntry.prototype.get$element = function() {
  return this._element;
}
DoubleLinkedQueueEntry.prototype.remove$0 = DoubleLinkedQueueEntry.prototype.remove;
$inherits(_DoubleLinkedQueueEntrySentinel, DoubleLinkedQueueEntry);
function _DoubleLinkedQueueEntrySentinel() {
  DoubleLinkedQueueEntry.call(this, null);
  this._link(this, this);
}
_DoubleLinkedQueueEntrySentinel.prototype.remove = function() {
  $throw(const$0002);
}
_DoubleLinkedQueueEntrySentinel.prototype.get$element = function() {
  $throw(const$0002);
}
_DoubleLinkedQueueEntrySentinel.prototype.remove$0 = _DoubleLinkedQueueEntrySentinel.prototype.remove;
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
DoubleLinkedQueue.prototype.get$length = function() {
  var counter = (0);
  this.forEach(function _(element) {
    counter++;
  }
  );
  return counter;
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
DoubleLinkedQueue.prototype.filter$1 = function($0) {
  return this.filter(to$call$1($0));
};
DoubleLinkedQueue.prototype.forEach$1 = function($0) {
  return this.forEach(to$call$1($0));
};
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
$dynamic("$dom_addEventListener$3").EventTarget = function($0, $1, $2) {
  if (Object.getPrototypeOf(this).hasOwnProperty("$dom_addEventListener$3")) {
    return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
  }
  return Object.prototype.$dom_addEventListener$3.call(this, $0, $1, $2);
};
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
$dynamic("remove$0").Node = function() {
  return this.remove();
};
$dynamic("is$html_Element").Element = function(){return true};
$dynamic("get$attributes").Element = function() {
  return new _ElementAttributeMap(this);
}
$dynamic("get$$$dom_className").Element = function() {
  return this.className;
}
$dynamic("set$$$dom_className").Element = function(value) {
  this.className = value;
}
$dynamic("get$$$dom_lastElementChild").Element = function() {
  return this.lastElementChild;
}
$dynamic("$dom_addEventListener$3").AbstractWorker = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
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
function _AbstractWorkerEventsImpl() {}
$dynamic("get$name").HTMLAnchorElement = function() { return this.name; };
$dynamic("get$name").WebKitAnimation = function() { return this.name; };
$dynamic("get$length").WebKitAnimationList = function() { return this.length; };
$dynamic("get$name").HTMLAppletElement = function() { return this.name; };
$dynamic("get$name").Attr = function() { return this.name; };
$dynamic("get$value").Attr = function() { return this.value; };
$dynamic("get$length").AudioBuffer = function() { return this.length; };
$inherits(_AudioContextEventsImpl, _EventsImpl);
function _AudioContextEventsImpl() {}
$dynamic("get$name").AudioParam = function() { return this.name; };
$dynamic("get$value").AudioParam = function() { return this.value; };
$dynamic("$dom_addEventListener$3").BatteryManager = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_BatteryManagerEventsImpl, _EventsImpl);
function _BatteryManagerEventsImpl() {}
$inherits(_ElementEventsImpl, _EventsImpl);
function _ElementEventsImpl() {}
$inherits(_BodyElementEventsImpl, _ElementEventsImpl);
function _BodyElementEventsImpl() {}
$dynamic("get$name").HTMLButtonElement = function() { return this.name; };
$dynamic("get$value").HTMLButtonElement = function() { return this.value; };
$dynamic("get$length").CharacterData = function() { return this.length; };
$dynamic("get$name").WebKitCSSKeyframesRule = function() { return this.name; };
$dynamic("get$length").CSSRuleList = function() { return this.length; };
$dynamic("get$length").CSSStyleDeclaration = function() { return this.length; };
$dynamic("get$length").CSSValueList = function() { return this.length; };
$dynamic("get$length").ClientRectList = function() { return this.length; };
var _ConsoleImpl = (typeof console == 'undefined' ? {} : console);
$dynamic("$dom_addEventListener$3").DOMApplicationCache = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_DOMApplicationCacheEventsImpl, _EventsImpl);
function _DOMApplicationCacheEventsImpl() {}
$dynamic("get$name").DOMException = function() { return this.name; };
$dynamic("get$name").DOMFileSystem = function() { return this.name; };
$dynamic("get$name").DOMFileSystemSync = function() { return this.name; };
$dynamic("get$length").DOMMimeTypeArray = function() { return this.length; };
$dynamic("get$length").DOMPlugin = function() { return this.length; };
$dynamic("get$name").DOMPlugin = function() { return this.name; };
$dynamic("get$length").DOMPluginArray = function() { return this.length; };
$dynamic("get$length").DOMTokenList = function() { return this.length; };
$dynamic("add$1").DOMTokenList = function($0) {
  return this.add($0);
};
$dynamic("get$value").DOMSettableTokenList = function() { return this.value; };
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
$dynamic("forEach").DOMStringList = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").DOMStringList = function(f) {
  return _Collections.filter(this, [], f);
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
$dynamic("filter$1").DOMStringList = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").DOMStringList = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$dynamic("get$length").DataTransferItemList = function() { return this.length; };
$dynamic("add$1").DataTransferItemList = function($0) {
  return this.add($0);
};
$dynamic("$dom_addEventListener$3").WorkerContext = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_WorkerContextEventsImpl, _EventsImpl);
function _WorkerContextEventsImpl() {}
$inherits(_DedicatedWorkerContextEventsImpl, _WorkerContextEventsImpl);
function _DedicatedWorkerContextEventsImpl() {}
$dynamic("$dom_addEventListener$3").DeprecatedPeerConnection = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_DeprecatedPeerConnectionEventsImpl, _EventsImpl);
function _DeprecatedPeerConnectionEventsImpl() {}
$dynamic("get$name").Entry = function() { return this.name; };
$dynamic("get$name").EntrySync = function() { return this.name; };
$dynamic("remove$0").EntrySync = function() {
  return this.remove();
};
$dynamic("is$html_Element").HTMLDocument = function(){return true};
$inherits(_DocumentEventsImpl, _ElementEventsImpl);
function _DocumentEventsImpl() {}
function FilteredElementList() {}
FilteredElementList.prototype.is$List = function(){return true};
FilteredElementList.prototype.is$Collection = function(){return true};
FilteredElementList.prototype.get$_filtered = function() {
  return ListFactory.ListFactory$from$factory(this._childNodes.filter$1((function (n) {
    return !!(n && n.is$html_Element());
  })
  ));
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
FilteredElementList.prototype.filter$1 = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
FilteredElementList.prototype.forEach$1 = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
function EmptyElementRect() {}
$dynamic("is$html_Element").DocumentFragment = function(){return true};
$dynamic("get$parent").DocumentFragment = function() {
  return null;
}
$dynamic("get$name").DocumentType = function() { return this.name; };
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
_ChildrenElementList.prototype.filter$1 = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
_ChildrenElementList.prototype.forEach$1 = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
_FrozenElementList._wrap$ctor = function(_nodeList) {
  this._nodeList = _nodeList;
}
_FrozenElementList._wrap$ctor.prototype = _FrozenElementList.prototype;
function _FrozenElementList() {}
_FrozenElementList.prototype.is$List = function(){return true};
_FrozenElementList.prototype.is$Collection = function(){return true};
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
_FrozenElementList.prototype.filter$1 = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
_FrozenElementList.prototype.forEach$1 = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
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
_ListWrapper.prototype.clear$_ = function() {
  return this._html_list.clear$_();
}
_ListWrapper.prototype.removeLast = function() {
  return this._html_list.removeLast();
}
_ListWrapper.prototype.last = function() {
  return this._html_list.last();
}
_ListWrapper.prototype.add$1 = _ListWrapper.prototype.add;
_ListWrapper.prototype.filter$1 = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
_ListWrapper.prototype.forEach$1 = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$inherits(_ListWrapper_Element, _ListWrapper);
function _ListWrapper_Element(_list) {
  this._html_list = _list;
}
_ListWrapper_Element.prototype.add$1 = _ListWrapper_Element.prototype.add;
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
_ElementAttributeMap.prototype.$index = function(key) {
  return this._html_element.getAttribute(key);
}
_ElementAttributeMap.prototype.$setindex = function(key, value) {
  this._html_element.setAttribute(key, ("" + value));
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
_ElementAttributeMap.prototype.get$length = function() {
  return this._html_element.get$$$dom_attributes().length;
}
_ElementAttributeMap.prototype.forEach$1 = function($0) {
  return this.forEach($wrap_call$2(to$call$2($0)));
};
function _DataAttributeMap() {}
_DataAttributeMap.prototype.is$Map = function(){return true};
_DataAttributeMap.prototype.$index = function(key) {
  return this.$$dom_attributes.$index(this._attr(key));
}
_DataAttributeMap.prototype.$setindex = function(key, value) {
  this.$$dom_attributes.$setindex(this._attr(key), ("" + value));
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
_DataAttributeMap.prototype.get$length = function() {
  return this.getKeys().get$length();
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
_CssClassSet.prototype.get$length = function() {
  return this._read().get$length();
}
_CssClassSet.prototype.add = function(value) {
  this._modify((function (s) {
    return s.add$1(value);
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
$dynamic("get$name").HTMLEmbedElement = function() { return this.name; };
$dynamic("get$length").EntryArray = function() { return this.length; };
$dynamic("get$length").EntryArraySync = function() { return this.length; };
$dynamic("get$name").EventException = function() { return this.name; };
$dynamic("$dom_addEventListener$3").EventSource = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_EventSourceEventsImpl, _EventsImpl);
function _EventSourceEventsImpl() {}
function _EventListenerListImpl(_ptr, _type) {
  this._ptr = _ptr;
  this._type = _type;
}
_EventListenerListImpl.prototype.add = function(listener, useCapture) {
  this._add(listener, useCapture);
  return this;
}
_EventListenerListImpl.prototype._add = function(listener, useCapture) {
  this._ptr.$dom_addEventListener$3(this._type, listener, useCapture);
}
_EventListenerListImpl.prototype.add$1 = function($0) {
  return this.add($wrap_call$1(to$call$1($0)), false);
};
$dynamic("get$name").HTMLFieldSetElement = function() { return this.name; };
$dynamic("get$name").File = function() { return this.name; };
$dynamic("get$name").FileException = function() { return this.name; };
$dynamic("get$length").FileList = function() { return this.length; };
$dynamic("$dom_addEventListener$3").FileReader = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_FileReaderEventsImpl, _EventsImpl);
function _FileReaderEventsImpl() {}
$dynamic("get$length").FileWriter = function() { return this.length; };
$dynamic("$dom_addEventListener$3").FileWriter = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_FileWriterEventsImpl, _EventsImpl);
function _FileWriterEventsImpl() {}
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
$dynamic("forEach").Float32Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Float32Array = function(f) {
  return _Collections.filter(this, [], f);
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
$dynamic("forEach").Float64Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Float64Array = function(f) {
  return _Collections.filter(this, [], f);
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
$dynamic("get$length").HTMLFormElement = function() { return this.length; };
$dynamic("get$name").HTMLFormElement = function() { return this.name; };
$dynamic("get$name").HTMLFrameElement = function() { return this.name; };
$inherits(_FrameSetElementEventsImpl, _ElementEventsImpl);
function _FrameSetElementEventsImpl() {}
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
$dynamic("forEach").HTMLCollection = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").HTMLCollection = function(f) {
  return _Collections.filter(this, [], f);
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
$dynamic("get$length").HTMLOptionsCollection = function() {
  return this.length;
}
$dynamic("get$length").History = function() { return this.length; };
$dynamic("get$value").IDBCursorWithValue = function() { return this.value; };
$dynamic("get$name").IDBDatabase = function() { return this.name; };
$dynamic("$dom_addEventListener$3").IDBDatabase = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_IDBDatabaseEventsImpl, _EventsImpl);
function _IDBDatabaseEventsImpl() {}
$dynamic("get$name").IDBDatabaseException = function() { return this.name; };
$dynamic("get$name").IDBIndex = function() { return this.name; };
$dynamic("get$name").IDBObjectStore = function() { return this.name; };
$dynamic("add$1").IDBObjectStore = function($0) {
  return this.add($0);
};
$dynamic("$dom_addEventListener$3").IDBRequest = function($0, $1, $2) {
  if (Object.getPrototypeOf(this).hasOwnProperty("$dom_addEventListener$3")) {
    return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
  }
  return Object.prototype.$dom_addEventListener$3.call(this, $0, $1, $2);
};
$inherits(_IDBRequestEventsImpl, _EventsImpl);
function _IDBRequestEventsImpl() {}
$dynamic("$dom_addEventListener$3").IDBTransaction = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_IDBTransactionEventsImpl, _EventsImpl);
function _IDBTransactionEventsImpl() {}
$dynamic("$dom_addEventListener$3").IDBVersionChangeRequest = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_IDBVersionChangeRequestEventsImpl, _IDBRequestEventsImpl);
function _IDBVersionChangeRequestEventsImpl() {}
$dynamic("get$name").HTMLIFrameElement = function() { return this.name; };
$dynamic("get$name").HTMLImageElement = function() { return this.name; };
$dynamic("get$name").HTMLInputElement = function() { return this.name; };
$dynamic("get$value").HTMLInputElement = function() { return this.value; };
$inherits(_InputElementEventsImpl, _ElementEventsImpl);
function _InputElementEventsImpl() {}
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
$dynamic("forEach").Int16Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Int16Array = function(f) {
  return _Collections.filter(this, [], f);
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
$dynamic("forEach").Int32Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Int32Array = function(f) {
  return _Collections.filter(this, [], f);
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
$dynamic("forEach").Int8Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Int8Array = function(f) {
  return _Collections.filter(this, [], f);
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
$dynamic("$dom_addEventListener$3").JavaScriptAudioNode = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_JavaScriptAudioNodeEventsImpl, _EventsImpl);
function _JavaScriptAudioNodeEventsImpl() {}
$dynamic("get$name").HTMLKeygenElement = function() { return this.name; };
$dynamic("get$value").HTMLLIElement = function() { return this.value; };
$dynamic("$dom_addEventListener$3").MediaStream = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$dynamic("get$name").HTMLMapElement = function() { return this.name; };
$dynamic("$dom_addEventListener$3").MediaController = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_MediaElementEventsImpl, _ElementEventsImpl);
function _MediaElementEventsImpl() {}
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
$dynamic("forEach").MediaList = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").MediaList = function(f) {
  return _Collections.filter(this, [], f);
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
$inherits(_MediaStreamEventsImpl, _EventsImpl);
function _MediaStreamEventsImpl() {}
$dynamic("get$length").MediaStreamList = function() { return this.length; };
$dynamic("get$length").MediaStreamTrackList = function() { return this.length; };
$dynamic("$dom_addEventListener$3").MessagePort = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_MessagePortEventsImpl, _EventsImpl);
function _MessagePortEventsImpl() {}
$dynamic("get$name").HTMLMetaElement = function() { return this.name; };
$dynamic("get$value").HTMLMeterElement = function() { return this.value; };
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
$dynamic("forEach").NamedNodeMap = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").NamedNodeMap = function(f) {
  return _Collections.filter(this, [], f);
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
function _ChildNodeListLazy() {}
_ChildNodeListLazy.prototype.is$List = function(){return true};
_ChildNodeListLazy.prototype.is$Collection = function(){return true};
_ChildNodeListLazy.prototype.last = function() {
  return this._this.lastChild;
}
_ChildNodeListLazy.prototype.add = function(value) {
  this._this.appendChild(value);
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
_ChildNodeListLazy.prototype.get$length = function() {
  return this._this.get$$$dom_childNodes().length;
}
_ChildNodeListLazy.prototype.$index = function(index) {
  return this._this.get$$$dom_childNodes().$index(index);
}
_ChildNodeListLazy.prototype.add$1 = _ChildNodeListLazy.prototype.add;
_ChildNodeListLazy.prototype.filter$1 = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
_ChildNodeListLazy.prototype.forEach$1 = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$inherits(_ListWrapper_Node, _ListWrapper);
function _ListWrapper_Node(_list) {
  this._html_list = _list;
}
_ListWrapper_Node.prototype.add$1 = _ListWrapper_Node.prototype.add;
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
$dynamic("filter$1").NodeList = function($0) {
  return this.filter($wrap_call$1(to$call$1($0)));
};
$dynamic("forEach$1").NodeList = function($0) {
  return this.forEach($wrap_call$1(to$call$1($0)));
};
$inherits(_NotificationEventsImpl, _EventsImpl);
function _NotificationEventsImpl() {}
$dynamic("get$name").HTMLObjectElement = function() { return this.name; };
$dynamic("get$name").OperationNotAllowedException = function() { return this.name; };
$dynamic("get$value").HTMLOptionElement = function() { return this.value; };
$dynamic("get$name").HTMLOutputElement = function() { return this.name; };
$dynamic("get$value").HTMLOutputElement = function() { return this.value; };
$dynamic("get$name").HTMLParamElement = function() { return this.name; };
$dynamic("get$value").HTMLParamElement = function() { return this.value; };
$dynamic("$dom_addEventListener$3").PeerConnection00 = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_PeerConnection00EventsImpl, _EventsImpl);
function _PeerConnection00EventsImpl() {}
$dynamic("get$value").HTMLProgressElement = function() { return this.value; };
$dynamic("get$name").RangeException = function() { return this.name; };
$dynamic("get$length").SQLResultSetRowList = function() { return this.length; };
$dynamic("get$value").SVGAngle = function() { return this.value; };
$inherits(_AttributeClassSet, _CssClassSet);
function _AttributeClassSet() {}
_AttributeClassSet.prototype._write = function(s) {
  this._html_element.get$attributes().$setindex("class", this._formatSet(s));
}
$inherits(_SVGElementInstanceEventsImpl, _EventsImpl);
function _SVGElementInstanceEventsImpl() {}
$dynamic("get$length").SVGElementInstanceList = function() { return this.length; };
$dynamic("get$name").SVGException = function() { return this.name; };
$dynamic("get$value").SVGLength = function() { return this.value; };
$dynamic("get$value").SVGNumber = function() { return this.value; };
$dynamic("get$length").HTMLSelectElement = function() { return this.length; };
$dynamic("get$name").HTMLSelectElement = function() { return this.name; };
$dynamic("get$value").HTMLSelectElement = function() { return this.value; };
$dynamic("get$name").SharedWorkerContext = function() { return this.name; };
$inherits(_SharedWorkerContextEventsImpl, _WorkerContextEventsImpl);
function _SharedWorkerContextEventsImpl() {}
$dynamic("get$length").SpeechGrammarList = function() { return this.length; };
$dynamic("get$length").SpeechInputResultList = function() { return this.length; };
$dynamic("$dom_addEventListener$3").SpeechRecognition = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_SpeechRecognitionEventsImpl, _EventsImpl);
function _SpeechRecognitionEventsImpl() {}
$dynamic("get$length").SpeechRecognitionResult = function() { return this.length; };
$dynamic("get$length").SpeechRecognitionResultList = function() { return this.length; };
$dynamic("is$Map").Storage = function(){return true};
$dynamic("$index").Storage = function(key) {
  return this.getItem(key);
}
$dynamic("$setindex").Storage = function(key, value) {
  return this.setItem(key, value);
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
$dynamic("get$length").Storage = function() {
  return this.get$$$dom_length();
}
$dynamic("get$$$dom_length").Storage = function() {
  return this.length;
}
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
$dynamic("forEach").StyleSheetList = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").StyleSheetList = function(f) {
  return _Collections.filter(this, [], f);
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
$dynamic("get$name").HTMLTextAreaElement = function() { return this.name; };
$dynamic("get$value").HTMLTextAreaElement = function() { return this.value; };
$dynamic("$dom_addEventListener$3").TextTrack = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_TextTrackEventsImpl, _EventsImpl);
function _TextTrackEventsImpl() {}
$dynamic("$dom_addEventListener$3").TextTrackCue = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_TextTrackCueEventsImpl, _EventsImpl);
function _TextTrackCueEventsImpl() {}
$dynamic("get$length").TextTrackCueList = function() { return this.length; };
$dynamic("get$length").TextTrackList = function() { return this.length; };
$dynamic("$dom_addEventListener$3").TextTrackList = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_TextTrackListEventsImpl, _EventsImpl);
function _TextTrackListEventsImpl() {}
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
$dynamic("forEach").TouchList = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").TouchList = function(f) {
  return _Collections.filter(this, [], f);
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
$dynamic("forEach").Uint16Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Uint16Array = function(f) {
  return _Collections.filter(this, [], f);
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
$dynamic("forEach").Uint32Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Uint32Array = function(f) {
  return _Collections.filter(this, [], f);
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
$dynamic("forEach").Uint8Array = function(f) {
  return _Collections.forEach(this, f);
}
$dynamic("filter").Uint8Array = function(f) {
  return _Collections.filter(this, [], f);
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
$dynamic("get$name").WebGLActiveInfo = function() { return this.name; };
$dynamic("$dom_addEventListener$3").WebSocket = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_WebSocketEventsImpl, _EventsImpl);
function _WebSocketEventsImpl() {}
$dynamic("get$length").DOMWindow = function() { return this.length; };
$dynamic("get$name").DOMWindow = function() { return this.name; };
$dynamic("$dom_addEventListener$3").DOMWindow = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_WindowEventsImpl, _EventsImpl);
function _WindowEventsImpl() {}
$inherits(_WorkerEventsImpl, _AbstractWorkerEventsImpl);
function _WorkerEventsImpl() {}
$dynamic("get$on").XMLHttpRequest = function() {
  return new _XMLHttpRequestEventsImpl(this);
}
$dynamic("$dom_addEventListener$3").XMLHttpRequest = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_XMLHttpRequestEventsImpl, _EventsImpl);
function _XMLHttpRequestEventsImpl(_ptr) {
  _EventsImpl.call(this, _ptr);
}
_XMLHttpRequestEventsImpl.prototype.get$load = function() {
  return this._get("load");
}
$dynamic("get$name").XMLHttpRequestException = function() { return this.name; };
$dynamic("$dom_addEventListener$3").XMLHttpRequestUpload = function($0, $1, $2) {
  return this.addEventListener($0, $wrap_call$1(to$call$1($1)), $2);
};
$inherits(_XMLHttpRequestUploadEventsImpl, _EventsImpl);
function _XMLHttpRequestUploadEventsImpl() {}
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
_XMLHttpRequestFactoryProvider.XMLHttpRequest$factory = function() {
  return new XMLHttpRequest();
}
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
function Result(name, kind, url) {
  this.name = name;
  this.kind = kind;
  this.url = url;
}
Result.prototype.get$name = function() { return this.name; };
Result.prototype.toString = function() {
  return ("" + this.kind + " " + this.name + " , " + this.url);
}
function Request() {
  this.jsonq = "      {\"dart:core\":[{\"name\":\"AssertionError\",\"kind\":\"class\",\"url\":\"dart_core/AssertionError.html\"},{\"name\":\"BadNumberFormatException\",\"kind\":\"class\",\"url\":\"dart_core/BadNumberFormatException.html\"},{\"name\":\"bool\",\"kind\":\"interface\",\"url\":\"dart_core/bool.html\"},{\"name\":\"Clock\",\"kind\":\"class\",\"url\":\"dart_core/Clock.html\"},{\"name\":\"ClosureArgumentMismatchException\",\"kind\":\"class\",\"url\":\"dart_core/ClosureArgumentMismatchException.html\"},{\"name\":\"Collection&lt;E&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Collection.html\"},{\"name\":\"Comparable\",\"kind\":\"interface\",\"url\":\"dart_core/Comparable.html\"},{\"name\":\"Completer&lt;T&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Completer.html\"},{\"name\":\"Date\",\"kind\":\"interface\",\"url\":\"dart_core/Date.html\"},{\"name\":\"double\",\"kind\":\"interface\",\"url\":\"dart_core/double.html\"},{\"name\":\"Duration\",\"kind\":\"interface\",\"url\":\"dart_core/Duration.html\"},{\"name\":\"Dynamic\",\"kind\":\"interface\",\"url\":\"dart_core/Dynamic.html\"},{\"name\":\"EmptyQueueException\",\"kind\":\"class\",\"url\":\"dart_core/EmptyQueueException.html\"},{\"name\":\"Exception\",\"kind\":\"interface\",\"url\":\"dart_core/Exception.html\"},{\"name\":\"Expect\",\"kind\":\"class\",\"url\":\"dart_core/Expect.html\"},{\"name\":\"ExpectException\",\"kind\":\"class\",\"url\":\"dart_core/ExpectException.html\"},{\"name\":\"FallThroughError\",\"kind\":\"class\",\"url\":\"dart_core/FallThroughError.html\"},{\"name\":\"Function\",\"kind\":\"interface\",\"url\":\"dart_core/Function.html\"},{\"name\":\"Future&lt;T&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Future.html\"},{\"name\":\"FutureAlreadyCompleteException\",\"kind\":\"class\",\"url\":\"dart_core/FutureAlreadyCompleteException.html\"},{\"name\":\"FutureNotCompleteException\",\"kind\":\"class\",\"url\":\"dart_core/FutureNotCompleteException.html\"},{\"name\":\"Futures\",\"kind\":\"class\",\"url\":\"dart_core/Futures.html\"},{\"name\":\"Hashable\",\"kind\":\"interface\",\"url\":\"dart_core/Hashable.html\"},{\"name\":\"HashMap&lt;K, V&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/HashMap.html\"},{\"name\":\"HashSet&lt;E&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/HashSet.html\"},{\"name\":\"IllegalAccessException\",\"kind\":\"class\",\"url\":\"dart_core/IllegalAccessException.html\"},{\"name\":\"IllegalArgumentException\",\"kind\":\"class\",\"url\":\"dart_core/IllegalArgumentException.html\"},{\"name\":\"IllegalJSRegExpException\",\"kind\":\"class\",\"url\":\"dart_core/IllegalJSRegExpException.html\"},{\"name\":\"IndexOutOfRangeException\",\"kind\":\"class\",\"url\":\"dart_core/IndexOutOfRangeException.html\"},{\"name\":\"int\",\"kind\":\"interface\",\"url\":\"dart_core/int.html\"},{\"name\":\"IntegerDivisionByZeroException\",\"kind\":\"class\",\"url\":\"dart_core/IntegerDivisionByZeroException.html\"},{\"name\":\"Iterable&lt;E&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Iterable.html\"},{\"name\":\"Iterator&lt;E&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Iterator.html\"},{\"name\":\"LinkedHashMap&lt;K, V&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/LinkedHashMap.html\"},{\"name\":\"List&lt;E&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/List.html\"},{\"name\":\"Map&lt;K, V&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Map.html\"},{\"name\":\"Match\",\"kind\":\"interface\",\"url\":\"dart_core/Match.html\"},{\"name\":\"Math\",\"kind\":\"class\",\"url\":\"dart_core/Math.html\"},{\"name\":\"NoMoreElementsException\",\"kind\":\"class\",\"url\":\"dart_core/NoMoreElementsException.html\"},{\"name\":\"NoSuchMethodException\",\"kind\":\"class\",\"url\":\"dart_core/NoSuchMethodException.html\"},{\"name\":\"NotImplementedException\",\"kind\":\"class\",\"url\":\"dart_core/NotImplementedException.html\"},{\"name\":\"NullPointerException\",\"kind\":\"class\",\"url\":\"dart_core/NullPointerException.html\"},{\"name\":\"num\",\"kind\":\"interface\",\"url\":\"dart_core/num.html\"},{\"name\":\"Object\",\"kind\":\"class\",\"url\":\"dart_core/Object.html\"},{\"name\":\"ObjectNotClosureException\",\"kind\":\"class\",\"url\":\"dart_core/ObjectNotClosureException.html\"},{\"name\":\"Options\",\"kind\":\"interface\",\"url\":\"dart_core/Options.html\"},{\"name\":\"OutOfMemoryException\",\"kind\":\"class\",\"url\":\"dart_core/OutOfMemoryException.html\"},{\"name\":\"Pattern\",\"kind\":\"interface\",\"url\":\"dart_core/Pattern.html\"},{\"name\":\"Queue&lt;E&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Queue.html\"},{\"name\":\"RegExp\",\"kind\":\"interface\",\"url\":\"dart_core/RegExp.html\"},{\"name\":\"Set&lt;E&gt;\",\"kind\":\"interface\",\"url\":\"dart_core/Set.html\"},{\"name\":\"StackOverflowException\",\"kind\":\"class\",\"url\":\"dart_core/StackOverflowException.html\"},{\"name\":\"Stopwatch\",\"kind\":\"interface\",\"url\":\"dart_core/Stopwatch.html\"},{\"name\":\"String\",\"kind\":\"interface\",\"url\":\"dart_core/String.html\"},{\"name\":\"StringBuffer\",\"kind\":\"interface\",\"url\":\"dart_core/StringBuffer.html\"},{\"name\":\"Strings\",\"kind\":\"class\",\"url\":\"dart_core/Strings.html\"},{\"name\":\"TimeZone\",\"kind\":\"interface\",\"url\":\"dart_core/TimeZone.html\"},{\"name\":\"TypeError\",\"kind\":\"class\",\"url\":\"dart_core/TypeError.html\"},{\"name\":\"UnsupportedOperationException\",\"kind\":\"class\",\"url\":\"dart_core/UnsupportedOperationException.html\"},{\"name\":\"void\",\"kind\":\"interface\",\"url\":\"dart_core/void.html\"},{\"name\":\"WrongArgumentCountException\",\"kind\":\"class\",\"url\":\"dart_core/WrongArgumentCountException.html\"}],\"dart:coreimpl\":[{\"name\":\"Arrays\",\"kind\":\"class\",\"url\":\"dart_coreimpl/Arrays.html\"},{\"name\":\"Collections\",\"kind\":\"class\",\"url\":\"dart_coreimpl/Collections.html\"},{\"name\":\"CompleterImpl&lt;T&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/CompleterImpl.html\"},{\"name\":\"DateImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/DateImplementation.html\"},{\"name\":\"DoubleLinkedQueue&lt;E&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/DoubleLinkedQueue.html\"},{\"name\":\"DoubleLinkedQueueEntry&lt;E&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/DoubleLinkedQueueEntry.html\"},{\"name\":\"DualPivotQuicksort\",\"kind\":\"class\",\"url\":\"dart_coreimpl/DualPivotQuicksort.html\"},{\"name\":\"DurationImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/DurationImplementation.html\"},{\"name\":\"ExceptionImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/ExceptionImplementation.html\"},{\"name\":\"FutureImpl&lt;T&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/FutureImpl.html\"},{\"name\":\"HashMapImplementation&lt;K, V&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/HashMapImplementation.html\"},{\"name\":\"HashSetImplementation&lt;E&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/HashSetImplementation.html\"},{\"name\":\"HashSetIterator&lt;E&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/HashSetIterator.html\"},{\"name\":\"ImmutableList&lt;E&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/ImmutableList.html\"},{\"name\":\"ImmutableMap&lt;K, V&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/ImmutableMap.html\"},{\"name\":\"JSSyntaxRegExp\",\"kind\":\"class\",\"url\":\"dart_coreimpl/JSSyntaxRegExp.html\"},{\"name\":\"KeyValuePair&lt;K, V&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/KeyValuePair.html\"},{\"name\":\"LinkedHashMapImplementation&lt;K, V&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/LinkedHashMapImplementation.html\"},{\"name\":\"ListFactory&lt;E&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/ListFactory.html\"},{\"name\":\"ListIterator&lt;T&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/ListIterator.html\"},{\"name\":\"Maps\",\"kind\":\"class\",\"url\":\"dart_coreimpl/Maps.html\"},{\"name\":\"MatchImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/MatchImplementation.html\"},{\"name\":\"NumImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/NumImplementation.html\"},{\"name\":\"RuntimeOptions\",\"kind\":\"class\",\"url\":\"dart_coreimpl/RuntimeOptions.html\"},{\"name\":\"SplayTreeMap&lt;K, V&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/SplayTreeMap.html\"},{\"name\":\"SplayTreeNode&lt;K, V&gt;\",\"kind\":\"class\",\"url\":\"dart_coreimpl/SplayTreeNode.html\"},{\"name\":\"StopwatchImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/StopwatchImplementation.html\"},{\"name\":\"StringBase\",\"kind\":\"class\",\"url\":\"dart_coreimpl/StringBase.html\"},{\"name\":\"StringBufferImpl\",\"kind\":\"class\",\"url\":\"dart_coreimpl/StringBufferImpl.html\"},{\"name\":\"StringImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/StringImplementation.html\"},{\"name\":\"TimeZoneImplementation\",\"kind\":\"class\",\"url\":\"dart_coreimpl/TimeZoneImplementation.html\"}],\"dart:isolate\":[{\"name\":\"Isolate\",\"kind\":\"class\",\"url\":\"dart_isolate/Isolate.html\"},{\"name\":\"IsolateSpawnException\",\"kind\":\"class\",\"url\":\"dart_isolate/IsolateSpawnException.html\"},{\"name\":\"ReceivePort\",\"kind\":\"interface\",\"url\":\"dart_isolate/ReceivePort.html\"},{\"name\":\"SendPort\",\"kind\":\"interface\",\"url\":\"dart_isolate/SendPort.html\"},{\"name\":\"TestingOnly\",\"kind\":\"class\",\"url\":\"dart_isolate/TestingOnly.html\"}],\"html\":[{\"name\":\"AbstractWorker\",\"kind\":\"interface\",\"url\":\"html/AbstractWorker.html\"},{\"name\":\"AbstractWorkerEvents\",\"kind\":\"interface\",\"url\":\"html/AbstractWorkerEvents.html\"},{\"name\":\"AnchorElement\",\"kind\":\"interface\",\"url\":\"html/AnchorElement.html\"},{\"name\":\"Animation\",\"kind\":\"interface\",\"url\":\"html/Animation.html\"},{\"name\":\"AnimationEvent\",\"kind\":\"interface\",\"url\":\"html/AnimationEvent.html\"},{\"name\":\"AnimationList\",\"kind\":\"interface\",\"url\":\"html/AnimationList.html\"},{\"name\":\"AppletElement\",\"kind\":\"interface\",\"url\":\"html/AppletElement.html\"},{\"name\":\"AreaElement\",\"kind\":\"interface\",\"url\":\"html/AreaElement.html\"},{\"name\":\"ArrayBuffer\",\"kind\":\"interface\",\"url\":\"html/ArrayBuffer.html\"},{\"name\":\"ArrayBufferView\",\"kind\":\"interface\",\"url\":\"html/ArrayBufferView.html\"},{\"name\":\"Attr\",\"kind\":\"interface\",\"url\":\"html/Attr.html\"},{\"name\":\"AttributeMap\",\"kind\":\"interface\",\"url\":\"html/AttributeMap.html\"},{\"name\":\"AudioBuffer\",\"kind\":\"interface\",\"url\":\"html/AudioBuffer.html\"},{\"name\":\"AudioBufferCallback\",\"kind\":\"interface\",\"url\":\"html/AudioBufferCallback.html\"},{\"name\":\"AudioBufferSourceNode\",\"kind\":\"interface\",\"url\":\"html/AudioBufferSourceNode.html\"},{\"name\":\"AudioChannelMerger\",\"kind\":\"interface\",\"url\":\"html/AudioChannelMerger.html\"},{\"name\":\"AudioChannelSplitter\",\"kind\":\"interface\",\"url\":\"html/AudioChannelSplitter.html\"},{\"name\":\"AudioContext\",\"kind\":\"interface\",\"url\":\"html/AudioContext.html\"},{\"name\":\"AudioContextEvents\",\"kind\":\"interface\",\"url\":\"html/AudioContextEvents.html\"},{\"name\":\"AudioDestinationNode\",\"kind\":\"interface\",\"url\":\"html/AudioDestinationNode.html\"},{\"name\":\"AudioElement\",\"kind\":\"interface\",\"url\":\"html/AudioElement.html\"},{\"name\":\"AudioGain\",\"kind\":\"interface\",\"url\":\"html/AudioGain.html\"},{\"name\":\"AudioGainNode\",\"kind\":\"interface\",\"url\":\"html/AudioGainNode.html\"},{\"name\":\"AudioListener\",\"kind\":\"interface\",\"url\":\"html/AudioListener.html\"},{\"name\":\"AudioNode\",\"kind\":\"interface\",\"url\":\"html/AudioNode.html\"},{\"name\":\"AudioPannerNode\",\"kind\":\"interface\",\"url\":\"html/AudioPannerNode.html\"},{\"name\":\"AudioParam\",\"kind\":\"interface\",\"url\":\"html/AudioParam.html\"},{\"name\":\"AudioProcessingEvent\",\"kind\":\"interface\",\"url\":\"html/AudioProcessingEvent.html\"},{\"name\":\"AudioSourceNode\",\"kind\":\"interface\",\"url\":\"html/AudioSourceNode.html\"},{\"name\":\"BarInfo\",\"kind\":\"interface\",\"url\":\"html/BarInfo.html\"},{\"name\":\"BaseElement\",\"kind\":\"interface\",\"url\":\"html/BaseElement.html\"},{\"name\":\"BaseFontElement\",\"kind\":\"interface\",\"url\":\"html/BaseFontElement.html\"},{\"name\":\"BatteryManager\",\"kind\":\"interface\",\"url\":\"html/BatteryManager.html\"},{\"name\":\"BatteryManagerEvents\",\"kind\":\"interface\",\"url\":\"html/BatteryManagerEvents.html\"},{\"name\":\"BeforeLoadEvent\",\"kind\":\"interface\",\"url\":\"html/BeforeLoadEvent.html\"},{\"name\":\"BiquadFilterNode\",\"kind\":\"interface\",\"url\":\"html/BiquadFilterNode.html\"},{\"name\":\"Blob\",\"kind\":\"interface\",\"url\":\"html/Blob.html\"},{\"name\":\"BodyElement\",\"kind\":\"interface\",\"url\":\"html/BodyElement.html\"},{\"name\":\"BodyElementEvents\",\"kind\":\"interface\",\"url\":\"html/BodyElementEvents.html\"},{\"name\":\"BRElement\",\"kind\":\"interface\",\"url\":\"html/BRElement.html\"},{\"name\":\"ButtonElement\",\"kind\":\"interface\",\"url\":\"html/ButtonElement.html\"},{\"name\":\"CanvasElement\",\"kind\":\"interface\",\"url\":\"html/CanvasElement.html\"},{\"name\":\"CanvasGradient\",\"kind\":\"interface\",\"url\":\"html/CanvasGradient.html\"},{\"name\":\"CanvasPattern\",\"kind\":\"interface\",\"url\":\"html/CanvasPattern.html\"},{\"name\":\"CanvasRenderingContext\",\"kind\":\"interface\",\"url\":\"html/CanvasRenderingContext.html\"},{\"name\":\"CanvasRenderingContext2D\",\"kind\":\"interface\",\"url\":\"html/CanvasRenderingContext2D.html\"},{\"name\":\"CDATASection\",\"kind\":\"interface\",\"url\":\"html/CDATASection.html\"},{\"name\":\"CharacterData\",\"kind\":\"interface\",\"url\":\"html/CharacterData.html\"},{\"name\":\"ClientRect\",\"kind\":\"interface\",\"url\":\"html/ClientRect.html\"},{\"name\":\"ClientRectList\",\"kind\":\"interface\",\"url\":\"html/ClientRectList.html\"},{\"name\":\"Clipboard\",\"kind\":\"interface\",\"url\":\"html/Clipboard.html\"},{\"name\":\"CloseEvent\",\"kind\":\"interface\",\"url\":\"html/CloseEvent.html\"},{\"name\":\"Comment\",\"kind\":\"interface\",\"url\":\"html/Comment.html\"},{\"name\":\"CompositionEvent\",\"kind\":\"interface\",\"url\":\"html/CompositionEvent.html\"},{\"name\":\"ComputeValue\",\"kind\":\"interface\",\"url\":\"html/ComputeValue.html\"},{\"name\":\"Console\",\"kind\":\"interface\",\"url\":\"html/Console.html\"},{\"name\":\"ContentElement\",\"kind\":\"interface\",\"url\":\"html/ContentElement.html\"},{\"name\":\"ConvolverNode\",\"kind\":\"interface\",\"url\":\"html/ConvolverNode.html\"},{\"name\":\"Coordinates\",\"kind\":\"interface\",\"url\":\"html/Coordinates.html\"},{\"name\":\"Counter\",\"kind\":\"interface\",\"url\":\"html/Counter.html\"},{\"name\":\"Crypto\",\"kind\":\"interface\",\"url\":\"html/Crypto.html\"},{\"name\":\"CSSCharsetRule\",\"kind\":\"interface\",\"url\":\"html/CSSCharsetRule.html\"},{\"name\":\"CSSFontFaceRule\",\"kind\":\"interface\",\"url\":\"html/CSSFontFaceRule.html\"},{\"name\":\"CSSImportRule\",\"kind\":\"interface\",\"url\":\"html/CSSImportRule.html\"},{\"name\":\"CSSKeyframeRule\",\"kind\":\"interface\",\"url\":\"html/CSSKeyframeRule.html\"},{\"name\":\"CSSKeyframesRule\",\"kind\":\"interface\",\"url\":\"html/CSSKeyframesRule.html\"},{\"name\":\"CSSMatrix\",\"kind\":\"interface\",\"url\":\"html/CSSMatrix.html\"},{\"name\":\"CSSMediaRule\",\"kind\":\"interface\",\"url\":\"html/CSSMediaRule.html\"},{\"name\":\"CSSPageRule\",\"kind\":\"interface\",\"url\":\"html/CSSPageRule.html\"},{\"name\":\"CSSPrimitiveValue\",\"kind\":\"interface\",\"url\":\"html/CSSPrimitiveValue.html\"},{\"name\":\"CSSRule\",\"kind\":\"interface\",\"url\":\"html/CSSRule.html\"},{\"name\":\"CSSRuleList\",\"kind\":\"interface\",\"url\":\"html/CSSRuleList.html\"},{\"name\":\"CSSStyleDeclaration\",\"kind\":\"interface\",\"url\":\"html/CSSStyleDeclaration.html\"},{\"name\":\"CSSStyleRule\",\"kind\":\"interface\",\"url\":\"html/CSSStyleRule.html\"},{\"name\":\"CSSStyleSheet\",\"kind\":\"interface\",\"url\":\"html/CSSStyleSheet.html\"},{\"name\":\"CSSTransformValue\",\"kind\":\"interface\",\"url\":\"html/CSSTransformValue.html\"},{\"name\":\"CSSUnknownRule\",\"kind\":\"interface\",\"url\":\"html/CSSUnknownRule.html\"},{\"name\":\"CSSValue\",\"kind\":\"interface\",\"url\":\"html/CSSValue.html\"},{\"name\":\"CSSValueList\",\"kind\":\"interface\",\"url\":\"html/CSSValueList.html\"},{\"name\":\"CustomEvent\",\"kind\":\"interface\",\"url\":\"html/CustomEvent.html\"},{\"name\":\"Database\",\"kind\":\"interface\",\"url\":\"html/Database.html\"},{\"name\":\"DatabaseCallback\",\"kind\":\"interface\",\"url\":\"html/DatabaseCallback.html\"},{\"name\":\"DatabaseSync\",\"kind\":\"interface\",\"url\":\"html/DatabaseSync.html\"},{\"name\":\"DataTransferItem\",\"kind\":\"interface\",\"url\":\"html/DataTransferItem.html\"},{\"name\":\"DataTransferItemList\",\"kind\":\"interface\",\"url\":\"html/DataTransferItemList.html\"},{\"name\":\"DataView\",\"kind\":\"interface\",\"url\":\"html/DataView.html\"},{\"name\":\"DedicatedWorkerContext\",\"kind\":\"interface\",\"url\":\"html/DedicatedWorkerContext.html\"},{\"name\":\"DedicatedWorkerContextEvents\",\"kind\":\"interface\",\"url\":\"html/DedicatedWorkerContextEvents.html\"},{\"name\":\"DelayNode\",\"kind\":\"interface\",\"url\":\"html/DelayNode.html\"},{\"name\":\"DeprecatedPeerConnection\",\"kind\":\"interface\",\"url\":\"html/DeprecatedPeerConnection.html\"},{\"name\":\"DeprecatedPeerConnectionEvents\",\"kind\":\"interface\",\"url\":\"html/DeprecatedPeerConnectionEvents.html\"},{\"name\":\"DetailsElement\",\"kind\":\"interface\",\"url\":\"html/DetailsElement.html\"},{\"name\":\"DeviceMotionEvent\",\"kind\":\"interface\",\"url\":\"html/DeviceMotionEvent.html\"},{\"name\":\"DeviceOrientationEvent\",\"kind\":\"interface\",\"url\":\"html/DeviceOrientationEvent.html\"},{\"name\":\"DirectoryElement\",\"kind\":\"interface\",\"url\":\"html/DirectoryElement.html\"},{\"name\":\"DirectoryEntry\",\"kind\":\"interface\",\"url\":\"html/DirectoryEntry.html\"},{\"name\":\"DirectoryEntrySync\",\"kind\":\"interface\",\"url\":\"html/DirectoryEntrySync.html\"},{\"name\":\"DirectoryReader\",\"kind\":\"interface\",\"url\":\"html/DirectoryReader.html\"},{\"name\":\"DirectoryReaderSync\",\"kind\":\"interface\",\"url\":\"html/DirectoryReaderSync.html\"},{\"name\":\"DivElement\",\"kind\":\"interface\",\"url\":\"html/DivElement.html\"},{\"name\":\"DListElement\",\"kind\":\"interface\",\"url\":\"html/DListElement.html\"},{\"name\":\"Document\",\"kind\":\"interface\",\"url\":\"html/Document.html\"},{\"name\":\"DocumentEvents\",\"kind\":\"interface\",\"url\":\"html/DocumentEvents.html\"},{\"name\":\"DocumentFragment\",\"kind\":\"interface\",\"url\":\"html/DocumentFragment.html\"},{\"name\":\"DocumentType\",\"kind\":\"interface\",\"url\":\"html/DocumentType.html\"},{\"name\":\"DOMApplicationCache\",\"kind\":\"interface\",\"url\":\"html/DOMApplicationCache.html\"},{\"name\":\"DOMApplicationCacheEvents\",\"kind\":\"interface\",\"url\":\"html/DOMApplicationCacheEvents.html\"},{\"name\":\"DOMException\",\"kind\":\"interface\",\"url\":\"html/DOMException.html\"},{\"name\":\"DOMFileSystem\",\"kind\":\"interface\",\"url\":\"html/DOMFileSystem.html\"},{\"name\":\"DOMFileSystemSync\",\"kind\":\"interface\",\"url\":\"html/DOMFileSystemSync.html\"},{\"name\":\"DOMFormData\",\"kind\":\"interface\",\"url\":\"html/DOMFormData.html\"},{\"name\":\"DOMImplementation\",\"kind\":\"interface\",\"url\":\"html/DOMImplementation.html\"},{\"name\":\"DOMMimeType\",\"kind\":\"interface\",\"url\":\"html/DOMMimeType.html\"},{\"name\":\"DOMMimeTypeArray\",\"kind\":\"interface\",\"url\":\"html/DOMMimeTypeArray.html\"},{\"name\":\"DOMParser\",\"kind\":\"interface\",\"url\":\"html/DOMParser.html\"},{\"name\":\"DOMPlugin\",\"kind\":\"interface\",\"url\":\"html/DOMPlugin.html\"},{\"name\":\"DOMPluginArray\",\"kind\":\"interface\",\"url\":\"html/DOMPluginArray.html\"},{\"name\":\"DOMSelection\",\"kind\":\"interface\",\"url\":\"html/DOMSelection.html\"},{\"name\":\"DOMSettableTokenList\",\"kind\":\"interface\",\"url\":\"html/DOMSettableTokenList.html\"},{\"name\":\"DOMStringList\",\"kind\":\"interface\",\"url\":\"html/DOMStringList.html\"},{\"name\":\"DOMTokenList\",\"kind\":\"interface\",\"url\":\"html/DOMTokenList.html\"},{\"name\":\"DOMURL\",\"kind\":\"interface\",\"url\":\"html/DOMURL.html\"},{\"name\":\"DynamicsCompressorNode\",\"kind\":\"interface\",\"url\":\"html/DynamicsCompressorNode.html\"},{\"name\":\"Element\",\"kind\":\"interface\",\"url\":\"html/Element.html\"},{\"name\":\"ElementEvents\",\"kind\":\"interface\",\"url\":\"html/ElementEvents.html\"},{\"name\":\"ElementList\",\"kind\":\"interface\",\"url\":\"html/ElementList.html\"},{\"name\":\"ElementRect\",\"kind\":\"interface\",\"url\":\"html/ElementRect.html\"},{\"name\":\"ElementTimeControl\",\"kind\":\"interface\",\"url\":\"html/ElementTimeControl.html\"},{\"name\":\"ElementTraversal\",\"kind\":\"interface\",\"url\":\"html/ElementTraversal.html\"},{\"name\":\"EmbedElement\",\"kind\":\"interface\",\"url\":\"html/EmbedElement.html\"},{\"name\":\"EmptyElementRect\",\"kind\":\"class\",\"url\":\"html/EmptyElementRect.html\"},{\"name\":\"Entity\",\"kind\":\"interface\",\"url\":\"html/Entity.html\"},{\"name\":\"EntityReference\",\"kind\":\"interface\",\"url\":\"html/EntityReference.html\"},{\"name\":\"EntriesCallback\",\"kind\":\"interface\",\"url\":\"html/EntriesCallback.html\"},{\"name\":\"Entry\",\"kind\":\"interface\",\"url\":\"html/Entry.html\"},{\"name\":\"EntryArray\",\"kind\":\"interface\",\"url\":\"html/EntryArray.html\"},{\"name\":\"EntryArraySync\",\"kind\":\"interface\",\"url\":\"html/EntryArraySync.html\"},{\"name\":\"EntryCallback\",\"kind\":\"interface\",\"url\":\"html/EntryCallback.html\"},{\"name\":\"EntrySync\",\"kind\":\"interface\",\"url\":\"html/EntrySync.html\"},{\"name\":\"ErrorCallback\",\"kind\":\"interface\",\"url\":\"html/ErrorCallback.html\"},{\"name\":\"ErrorEvent\",\"kind\":\"interface\",\"url\":\"html/ErrorEvent.html\"},{\"name\":\"Event\",\"kind\":\"interface\",\"url\":\"html/Event.html\"},{\"name\":\"EventException\",\"kind\":\"interface\",\"url\":\"html/EventException.html\"},{\"name\":\"EventListener\",\"kind\":\"interface\",\"url\":\"html/EventListener.html\"},{\"name\":\"EventListenerList\",\"kind\":\"interface\",\"url\":\"html/EventListenerList.html\"},{\"name\":\"Events\",\"kind\":\"interface\",\"url\":\"html/Events.html\"},{\"name\":\"EventSource\",\"kind\":\"interface\",\"url\":\"html/EventSource.html\"},{\"name\":\"EventSourceEvents\",\"kind\":\"interface\",\"url\":\"html/EventSourceEvents.html\"},{\"name\":\"EventTarget\",\"kind\":\"interface\",\"url\":\"html/EventTarget.html\"},{\"name\":\"EXTTextureFilterAnisotropic\",\"kind\":\"interface\",\"url\":\"html/EXTTextureFilterAnisotropic.html\"},{\"name\":\"FieldSetElement\",\"kind\":\"interface\",\"url\":\"html/FieldSetElement.html\"},{\"name\":\"File\",\"kind\":\"interface\",\"url\":\"html/File.html\"},{\"name\":\"FileCallback\",\"kind\":\"interface\",\"url\":\"html/FileCallback.html\"},{\"name\":\"FileEntry\",\"kind\":\"interface\",\"url\":\"html/FileEntry.html\"},{\"name\":\"FileEntrySync\",\"kind\":\"interface\",\"url\":\"html/FileEntrySync.html\"},{\"name\":\"FileError\",\"kind\":\"interface\",\"url\":\"html/FileError.html\"},{\"name\":\"FileException\",\"kind\":\"interface\",\"url\":\"html/FileException.html\"},{\"name\":\"FileList\",\"kind\":\"interface\",\"url\":\"html/FileList.html\"},{\"name\":\"FileReader\",\"kind\":\"interface\",\"url\":\"html/FileReader.html\"},{\"name\":\"FileReaderEvents\",\"kind\":\"interface\",\"url\":\"html/FileReaderEvents.html\"},{\"name\":\"FileReaderSync\",\"kind\":\"interface\",\"url\":\"html/FileReaderSync.html\"},{\"name\":\"FileSystemCallback\",\"kind\":\"interface\",\"url\":\"html/FileSystemCallback.html\"},{\"name\":\"FileWriter\",\"kind\":\"interface\",\"url\":\"html/FileWriter.html\"},{\"name\":\"FileWriterCallback\",\"kind\":\"interface\",\"url\":\"html/FileWriterCallback.html\"},{\"name\":\"FileWriterEvents\",\"kind\":\"interface\",\"url\":\"html/FileWriterEvents.html\"},{\"name\":\"FileWriterSync\",\"kind\":\"interface\",\"url\":\"html/FileWriterSync.html\"},{\"name\":\"FilteredElementList\",\"kind\":\"class\",\"url\":\"html/FilteredElementList.html\"},{\"name\":\"Float32Array\",\"kind\":\"interface\",\"url\":\"html/Float32Array.html\"},{\"name\":\"Float64Array\",\"kind\":\"interface\",\"url\":\"html/Float64Array.html\"},{\"name\":\"FontElement\",\"kind\":\"interface\",\"url\":\"html/FontElement.html\"},{\"name\":\"FormElement\",\"kind\":\"interface\",\"url\":\"html/FormElement.html\"},{\"name\":\"FrameElement\",\"kind\":\"interface\",\"url\":\"html/FrameElement.html\"},{\"name\":\"FrameSetElement\",\"kind\":\"interface\",\"url\":\"html/FrameSetElement.html\"},{\"name\":\"FrameSetElementEvents\",\"kind\":\"interface\",\"url\":\"html/FrameSetElementEvents.html\"},{\"name\":\"Geolocation\",\"kind\":\"interface\",\"url\":\"html/Geolocation.html\"},{\"name\":\"Geoposition\",\"kind\":\"interface\",\"url\":\"html/Geoposition.html\"},{\"name\":\"HashChangeEvent\",\"kind\":\"interface\",\"url\":\"html/HashChangeEvent.html\"},{\"name\":\"HeadElement\",\"kind\":\"interface\",\"url\":\"html/HeadElement.html\"},{\"name\":\"HeadingElement\",\"kind\":\"interface\",\"url\":\"html/HeadingElement.html\"},{\"name\":\"History\",\"kind\":\"interface\",\"url\":\"html/History.html\"},{\"name\":\"HRElement\",\"kind\":\"interface\",\"url\":\"html/HRElement.html\"},{\"name\":\"HTMLAllCollection\",\"kind\":\"interface\",\"url\":\"html/HTMLAllCollection.html\"},{\"name\":\"HTMLCollection\",\"kind\":\"interface\",\"url\":\"html/HTMLCollection.html\"},{\"name\":\"HtmlElement\",\"kind\":\"interface\",\"url\":\"html/HtmlElement.html\"},{\"name\":\"HTMLOptionsCollection\",\"kind\":\"interface\",\"url\":\"html/HTMLOptionsCollection.html\"},{\"name\":\"IceCallback\",\"kind\":\"interface\",\"url\":\"html/IceCallback.html\"},{\"name\":\"IceCandidate\",\"kind\":\"interface\",\"url\":\"html/IceCandidate.html\"},{\"name\":\"IDBAny\",\"kind\":\"interface\",\"url\":\"html/IDBAny.html\"},{\"name\":\"IDBCursor\",\"kind\":\"interface\",\"url\":\"html/IDBCursor.html\"},{\"name\":\"IDBCursorWithValue\",\"kind\":\"interface\",\"url\":\"html/IDBCursorWithValue.html\"},{\"name\":\"IDBDatabase\",\"kind\":\"interface\",\"url\":\"html/IDBDatabase.html\"},{\"name\":\"IDBDatabaseEvents\",\"kind\":\"interface\",\"url\":\"html/IDBDatabaseEvents.html\"},{\"name\":\"IDBDatabaseException\",\"kind\":\"interface\",\"url\":\"html/IDBDatabaseException.html\"},{\"name\":\"IDBFactory\",\"kind\":\"interface\",\"url\":\"html/IDBFactory.html\"},{\"name\":\"IDBIndex\",\"kind\":\"interface\",\"url\":\"html/IDBIndex.html\"},{\"name\":\"IDBKey\",\"kind\":\"interface\",\"url\":\"html/IDBKey.html\"},{\"name\":\"IDBKeyRange\",\"kind\":\"interface\",\"url\":\"html/IDBKeyRange.html\"},{\"name\":\"IDBObjectStore\",\"kind\":\"interface\",\"url\":\"html/IDBObjectStore.html\"},{\"name\":\"IDBRequest\",\"kind\":\"interface\",\"url\":\"html/IDBRequest.html\"},{\"name\":\"IDBRequestEvents\",\"kind\":\"interface\",\"url\":\"html/IDBRequestEvents.html\"},{\"name\":\"IDBTransaction\",\"kind\":\"interface\",\"url\":\"html/IDBTransaction.html\"},{\"name\":\"IDBTransactionEvents\",\"kind\":\"interface\",\"url\":\"html/IDBTransactionEvents.html\"},{\"name\":\"IDBVersionChangeEvent\",\"kind\":\"interface\",\"url\":\"html/IDBVersionChangeEvent.html\"},{\"name\":\"IDBVersionChangeRequest\",\"kind\":\"interface\",\"url\":\"html/IDBVersionChangeRequest.html\"},{\"name\":\"IDBVersionChangeRequestEvents\",\"kind\":\"interface\",\"url\":\"html/IDBVersionChangeRequestEvents.html\"},{\"name\":\"IFrameElement\",\"kind\":\"interface\",\"url\":\"html/IFrameElement.html\"},{\"name\":\"ImageData\",\"kind\":\"interface\",\"url\":\"html/ImageData.html\"},{\"name\":\"ImageElement\",\"kind\":\"interface\",\"url\":\"html/ImageElement.html\"},{\"name\":\"InputElement\",\"kind\":\"interface\",\"url\":\"html/InputElement.html\"},{\"name\":\"InputElementEvents\",\"kind\":\"interface\",\"url\":\"html/InputElementEvents.html\"},{\"name\":\"Int16Array\",\"kind\":\"interface\",\"url\":\"html/Int16Array.html\"},{\"name\":\"Int32Array\",\"kind\":\"interface\",\"url\":\"html/Int32Array.html\"},{\"name\":\"Int8Array\",\"kind\":\"interface\",\"url\":\"html/Int8Array.html\"},{\"name\":\"JavaScriptAudioNode\",\"kind\":\"interface\",\"url\":\"html/JavaScriptAudioNode.html\"},{\"name\":\"JavaScriptAudioNodeEvents\",\"kind\":\"interface\",\"url\":\"html/JavaScriptAudioNodeEvents.html\"},{\"name\":\"JavaScriptCallFrame\",\"kind\":\"interface\",\"url\":\"html/JavaScriptCallFrame.html\"},{\"name\":\"KeyboardEvent\",\"kind\":\"interface\",\"url\":\"html/KeyboardEvent.html\"},{\"name\":\"KeygenElement\",\"kind\":\"interface\",\"url\":\"html/KeygenElement.html\"},{\"name\":\"KeyLocation\",\"kind\":\"interface\",\"url\":\"html/KeyLocation.html\"},{\"name\":\"KeyName\",\"kind\":\"interface\",\"url\":\"html/KeyName.html\"},{\"name\":\"LabelElement\",\"kind\":\"interface\",\"url\":\"html/LabelElement.html\"},{\"name\":\"LegendElement\",\"kind\":\"interface\",\"url\":\"html/LegendElement.html\"},{\"name\":\"LIElement\",\"kind\":\"interface\",\"url\":\"html/LIElement.html\"},{\"name\":\"LinkElement\",\"kind\":\"interface\",\"url\":\"html/LinkElement.html\"},{\"name\":\"LocalMediaStream\",\"kind\":\"interface\",\"url\":\"html/LocalMediaStream.html\"},{\"name\":\"Location\",\"kind\":\"interface\",\"url\":\"html/Location.html\"},{\"name\":\"MapElement\",\"kind\":\"interface\",\"url\":\"html/MapElement.html\"},{\"name\":\"MarqueeElement\",\"kind\":\"interface\",\"url\":\"html/MarqueeElement.html\"},{\"name\":\"MediaController\",\"kind\":\"interface\",\"url\":\"html/MediaController.html\"},{\"name\":\"MediaElement\",\"kind\":\"interface\",\"url\":\"html/MediaElement.html\"},{\"name\":\"MediaElementAudioSourceNode\",\"kind\":\"interface\",\"url\":\"html/MediaElementAudioSourceNode.html\"},{\"name\":\"MediaElementEvents\",\"kind\":\"interface\",\"url\":\"html/MediaElementEvents.html\"},{\"name\":\"MediaError\",\"kind\":\"interface\",\"url\":\"html/MediaError.html\"},{\"name\":\"MediaKeyError\",\"kind\":\"interface\",\"url\":\"html/MediaKeyError.html\"},{\"name\":\"MediaKeyEvent\",\"kind\":\"interface\",\"url\":\"html/MediaKeyEvent.html\"},{\"name\":\"MediaList\",\"kind\":\"interface\",\"url\":\"html/MediaList.html\"},{\"name\":\"MediaQueryList\",\"kind\":\"interface\",\"url\":\"html/MediaQueryList.html\"},{\"name\":\"MediaQueryListListener\",\"kind\":\"interface\",\"url\":\"html/MediaQueryListListener.html\"},{\"name\":\"MediaStream\",\"kind\":\"interface\",\"url\":\"html/MediaStream.html\"},{\"name\":\"MediaStreamEvent\",\"kind\":\"interface\",\"url\":\"html/MediaStreamEvent.html\"},{\"name\":\"MediaStreamEvents\",\"kind\":\"interface\",\"url\":\"html/MediaStreamEvents.html\"},{\"name\":\"MediaStreamList\",\"kind\":\"interface\",\"url\":\"html/MediaStreamList.html\"},{\"name\":\"MediaStreamTrack\",\"kind\":\"interface\",\"url\":\"html/MediaStreamTrack.html\"},{\"name\":\"MediaStreamTrackList\",\"kind\":\"interface\",\"url\":\"html/MediaStreamTrackList.html\"},{\"name\":\"MemoryInfo\",\"kind\":\"interface\",\"url\":\"html/MemoryInfo.html\"},{\"name\":\"MenuElement\",\"kind\":\"interface\",\"url\":\"html/MenuElement.html\"},{\"name\":\"MessageChannel\",\"kind\":\"interface\",\"url\":\"html/MessageChannel.html\"},{\"name\":\"MessageEvent\",\"kind\":\"interface\",\"url\":\"html/MessageEvent.html\"},{\"name\":\"MessagePort\",\"kind\":\"interface\",\"url\":\"html/MessagePort.html\"},{\"name\":\"MessagePortEvents\",\"kind\":\"interface\",\"url\":\"html/MessagePortEvents.html\"},{\"name\":\"Metadata\",\"kind\":\"interface\",\"url\":\"html/Metadata.html\"},{\"name\":\"MetadataCallback\",\"kind\":\"interface\",\"url\":\"html/MetadataCallback.html\"},{\"name\":\"MetaElement\",\"kind\":\"interface\",\"url\":\"html/MetaElement.html\"},{\"name\":\"MeterElement\",\"kind\":\"interface\",\"url\":\"html/MeterElement.html\"},{\"name\":\"ModElement\",\"kind\":\"interface\",\"url\":\"html/ModElement.html\"},{\"name\":\"MouseEvent\",\"kind\":\"interface\",\"url\":\"html/MouseEvent.html\"},{\"name\":\"MutationCallback\",\"kind\":\"interface\",\"url\":\"html/MutationCallback.html\"},{\"name\":\"MutationEvent\",\"kind\":\"interface\",\"url\":\"html/MutationEvent.html\"},{\"name\":\"MutationRecord\",\"kind\":\"interface\",\"url\":\"html/MutationRecord.html\"},{\"name\":\"NamedNodeMap\",\"kind\":\"interface\",\"url\":\"html/NamedNodeMap.html\"},{\"name\":\"Navigator\",\"kind\":\"interface\",\"url\":\"html/Navigator.html\"},{\"name\":\"NavigatorUserMediaError\",\"kind\":\"interface\",\"url\":\"html/NavigatorUserMediaError.html\"},{\"name\":\"NavigatorUserMediaErrorCallback\",\"kind\":\"interface\",\"url\":\"html/NavigatorUserMediaErrorCallback.html\"},{\"name\":\"NavigatorUserMediaSuccessCallback\",\"kind\":\"interface\",\"url\":\"html/NavigatorUserMediaSuccessCallback.html\"},{\"name\":\"Node\",\"kind\":\"interface\",\"url\":\"html/Node.html\"},{\"name\":\"NodeFilter\",\"kind\":\"interface\",\"url\":\"html/NodeFilter.html\"},{\"name\":\"NodeIterator\",\"kind\":\"interface\",\"url\":\"html/NodeIterator.html\"},{\"name\":\"NodeList\",\"kind\":\"interface\",\"url\":\"html/NodeList.html\"},{\"name\":\"NodeSelector\",\"kind\":\"interface\",\"url\":\"html/NodeSelector.html\"},{\"name\":\"Notation\",\"kind\":\"interface\",\"url\":\"html/Notation.html\"},{\"name\":\"Notification\",\"kind\":\"interface\",\"url\":\"html/Notification.html\"},{\"name\":\"NotificationCenter\",\"kind\":\"interface\",\"url\":\"html/NotificationCenter.html\"},{\"name\":\"NotificationEvents\",\"kind\":\"interface\",\"url\":\"html/NotificationEvents.html\"},{\"name\":\"ObjectElement\",\"kind\":\"interface\",\"url\":\"html/ObjectElement.html\"},{\"name\":\"OESStandardDerivatives\",\"kind\":\"interface\",\"url\":\"html/OESStandardDerivatives.html\"},{\"name\":\"OESTextureFloat\",\"kind\":\"interface\",\"url\":\"html/OESTextureFloat.html\"},{\"name\":\"OESVertexArrayObject\",\"kind\":\"interface\",\"url\":\"html/OESVertexArrayObject.html\"},{\"name\":\"OfflineAudioCompletionEvent\",\"kind\":\"interface\",\"url\":\"html/OfflineAudioCompletionEvent.html\"},{\"name\":\"OListElement\",\"kind\":\"interface\",\"url\":\"html/OListElement.html\"},{\"name\":\"OperationNotAllowedException\",\"kind\":\"interface\",\"url\":\"html/OperationNotAllowedException.html\"},{\"name\":\"OptGroupElement\",\"kind\":\"interface\",\"url\":\"html/OptGroupElement.html\"},{\"name\":\"OptionElement\",\"kind\":\"interface\",\"url\":\"html/OptionElement.html\"},{\"name\":\"Oscillator\",\"kind\":\"interface\",\"url\":\"html/Oscillator.html\"},{\"name\":\"OutputElement\",\"kind\":\"interface\",\"url\":\"html/OutputElement.html\"},{\"name\":\"OverflowEvent\",\"kind\":\"interface\",\"url\":\"html/OverflowEvent.html\"},{\"name\":\"PageTransitionEvent\",\"kind\":\"interface\",\"url\":\"html/PageTransitionEvent.html\"},{\"name\":\"ParagraphElement\",\"kind\":\"interface\",\"url\":\"html/ParagraphElement.html\"},{\"name\":\"ParamElement\",\"kind\":\"interface\",\"url\":\"html/ParamElement.html\"},{\"name\":\"PeerConnection00\",\"kind\":\"interface\",\"url\":\"html/PeerConnection00.html\"},{\"name\":\"PeerConnection00Events\",\"kind\":\"interface\",\"url\":\"html/PeerConnection00Events.html\"},{\"name\":\"Performance\",\"kind\":\"interface\",\"url\":\"html/Performance.html\"},{\"name\":\"PerformanceNavigation\",\"kind\":\"interface\",\"url\":\"html/PerformanceNavigation.html\"},{\"name\":\"PerformanceTiming\",\"kind\":\"interface\",\"url\":\"html/PerformanceTiming.html\"},{\"name\":\"Point\",\"kind\":\"interface\",\"url\":\"html/Point.html\"},{\"name\":\"PointerLock\",\"kind\":\"interface\",\"url\":\"html/PointerLock.html\"},{\"name\":\"PopStateEvent\",\"kind\":\"interface\",\"url\":\"html/PopStateEvent.html\"},{\"name\":\"PositionCallback\",\"kind\":\"interface\",\"url\":\"html/PositionCallback.html\"},{\"name\":\"PositionError\",\"kind\":\"interface\",\"url\":\"html/PositionError.html\"},{\"name\":\"PositionErrorCallback\",\"kind\":\"interface\",\"url\":\"html/PositionErrorCallback.html\"},{\"name\":\"PreElement\",\"kind\":\"interface\",\"url\":\"html/PreElement.html\"},{\"name\":\"ProcessingInstruction\",\"kind\":\"interface\",\"url\":\"html/ProcessingInstruction.html\"},{\"name\":\"ProgressElement\",\"kind\":\"interface\",\"url\":\"html/ProgressElement.html\"},{\"name\":\"ProgressEvent\",\"kind\":\"interface\",\"url\":\"html/ProgressEvent.html\"},{\"name\":\"QuoteElement\",\"kind\":\"interface\",\"url\":\"html/QuoteElement.html\"},{\"name\":\"Range\",\"kind\":\"interface\",\"url\":\"html/Range.html\"},{\"name\":\"RangeException\",\"kind\":\"interface\",\"url\":\"html/RangeException.html\"},{\"name\":\"ReadyState\",\"kind\":\"interface\",\"url\":\"html/ReadyState.html\"},{\"name\":\"RealtimeAnalyserNode\",\"kind\":\"interface\",\"url\":\"html/RealtimeAnalyserNode.html\"},{\"name\":\"Rect\",\"kind\":\"interface\",\"url\":\"html/Rect.html\"},{\"name\":\"RequestAnimationFrameCallback\",\"kind\":\"interface\",\"url\":\"html/RequestAnimationFrameCallback.html\"},{\"name\":\"RGBColor\",\"kind\":\"interface\",\"url\":\"html/RGBColor.html\"},{\"name\":\"Screen\",\"kind\":\"interface\",\"url\":\"html/Screen.html\"},{\"name\":\"ScriptElement\",\"kind\":\"interface\",\"url\":\"html/ScriptElement.html\"},{\"name\":\"ScriptProfile\",\"kind\":\"interface\",\"url\":\"html/ScriptProfile.html\"},{\"name\":\"ScriptProfileNode\",\"kind\":\"interface\",\"url\":\"html/ScriptProfileNode.html\"},{\"name\":\"SelectElement\",\"kind\":\"interface\",\"url\":\"html/SelectElement.html\"},{\"name\":\"SessionDescription\",\"kind\":\"interface\",\"url\":\"html/SessionDescription.html\"},{\"name\":\"ShadowElement\",\"kind\":\"interface\",\"url\":\"html/ShadowElement.html\"},{\"name\":\"ShadowRoot\",\"kind\":\"interface\",\"url\":\"html/ShadowRoot.html\"},{\"name\":\"SharedWorker\",\"kind\":\"interface\",\"url\":\"html/SharedWorker.html\"},{\"name\":\"SharedWorkerContext\",\"kind\":\"interface\",\"url\":\"html/SharedWorkerContext.html\"},{\"name\":\"SharedWorkerContextEvents\",\"kind\":\"interface\",\"url\":\"html/SharedWorkerContextEvents.html\"},{\"name\":\"SignalingCallback\",\"kind\":\"interface\",\"url\":\"html/SignalingCallback.html\"},{\"name\":\"SourceElement\",\"kind\":\"interface\",\"url\":\"html/SourceElement.html\"},{\"name\":\"SpanElement\",\"kind\":\"interface\",\"url\":\"html/SpanElement.html\"},{\"name\":\"SpeechGrammar\",\"kind\":\"interface\",\"url\":\"html/SpeechGrammar.html\"},{\"name\":\"SpeechGrammarList\",\"kind\":\"interface\",\"url\":\"html/SpeechGrammarList.html\"},{\"name\":\"SpeechInputEvent\",\"kind\":\"interface\",\"url\":\"html/SpeechInputEvent.html\"},{\"name\":\"SpeechInputResult\",\"kind\":\"interface\",\"url\":\"html/SpeechInputResult.html\"},{\"name\":\"SpeechInputResultList\",\"kind\":\"interface\",\"url\":\"html/SpeechInputResultList.html\"},{\"name\":\"SpeechRecognition\",\"kind\":\"interface\",\"url\":\"html/SpeechRecognition.html\"},{\"name\":\"SpeechRecognitionAlternative\",\"kind\":\"interface\",\"url\":\"html/SpeechRecognitionAlternative.html\"},{\"name\":\"SpeechRecognitionError\",\"kind\":\"interface\",\"url\":\"html/SpeechRecognitionError.html\"},{\"name\":\"SpeechRecognitionEvent\",\"kind\":\"interface\",\"url\":\"html/SpeechRecognitionEvent.html\"},{\"name\":\"SpeechRecognitionEvents\",\"kind\":\"interface\",\"url\":\"html/SpeechRecognitionEvents.html\"},{\"name\":\"SpeechRecognitionResult\",\"kind\":\"interface\",\"url\":\"html/SpeechRecognitionResult.html\"},{\"name\":\"SpeechRecognitionResultList\",\"kind\":\"interface\",\"url\":\"html/SpeechRecognitionResultList.html\"},{\"name\":\"SQLError\",\"kind\":\"interface\",\"url\":\"html/SQLError.html\"},{\"name\":\"SQLException\",\"kind\":\"interface\",\"url\":\"html/SQLException.html\"},{\"name\":\"SQLResultSet\",\"kind\":\"interface\",\"url\":\"html/SQLResultSet.html\"},{\"name\":\"SQLResultSetRowList\",\"kind\":\"interface\",\"url\":\"html/SQLResultSetRowList.html\"},{\"name\":\"SQLStatementCallback\",\"kind\":\"interface\",\"url\":\"html/SQLStatementCallback.html\"},{\"name\":\"SQLStatementErrorCallback\",\"kind\":\"interface\",\"url\":\"html/SQLStatementErrorCallback.html\"},{\"name\":\"SQLTransaction\",\"kind\":\"interface\",\"url\":\"html/SQLTransaction.html\"},{\"name\":\"SQLTransactionCallback\",\"kind\":\"interface\",\"url\":\"html/SQLTransactionCallback.html\"},{\"name\":\"SQLTransactionErrorCallback\",\"kind\":\"interface\",\"url\":\"html/SQLTransactionErrorCallback.html\"},{\"name\":\"SQLTransactionSync\",\"kind\":\"interface\",\"url\":\"html/SQLTransactionSync.html\"},{\"name\":\"SQLTransactionSyncCallback\",\"kind\":\"interface\",\"url\":\"html/SQLTransactionSyncCallback.html\"},{\"name\":\"Storage\",\"kind\":\"interface\",\"url\":\"html/Storage.html\"},{\"name\":\"StorageEvent\",\"kind\":\"interface\",\"url\":\"html/StorageEvent.html\"},{\"name\":\"StorageInfo\",\"kind\":\"interface\",\"url\":\"html/StorageInfo.html\"},{\"name\":\"StorageInfoErrorCallback\",\"kind\":\"interface\",\"url\":\"html/StorageInfoErrorCallback.html\"},{\"name\":\"StorageInfoQuotaCallback\",\"kind\":\"interface\",\"url\":\"html/StorageInfoQuotaCallback.html\"},{\"name\":\"StorageInfoUsageCallback\",\"kind\":\"interface\",\"url\":\"html/StorageInfoUsageCallback.html\"},{\"name\":\"StringCallback\",\"kind\":\"interface\",\"url\":\"html/StringCallback.html\"},{\"name\":\"StyleElement\",\"kind\":\"interface\",\"url\":\"html/StyleElement.html\"},{\"name\":\"StyleMedia\",\"kind\":\"interface\",\"url\":\"html/StyleMedia.html\"},{\"name\":\"StyleSheet\",\"kind\":\"interface\",\"url\":\"html/StyleSheet.html\"},{\"name\":\"StyleSheetList\",\"kind\":\"interface\",\"url\":\"html/StyleSheetList.html\"},{\"name\":\"SVGAElement\",\"kind\":\"interface\",\"url\":\"html/SVGAElement.html\"},{\"name\":\"SVGAltGlyphDefElement\",\"kind\":\"interface\",\"url\":\"html/SVGAltGlyphDefElement.html\"},{\"name\":\"SVGAltGlyphElement\",\"kind\":\"interface\",\"url\":\"html/SVGAltGlyphElement.html\"},{\"name\":\"SVGAltGlyphItemElement\",\"kind\":\"interface\",\"url\":\"html/SVGAltGlyphItemElement.html\"},{\"name\":\"SVGAngle\",\"kind\":\"interface\",\"url\":\"html/SVGAngle.html\"},{\"name\":\"SVGAnimateColorElement\",\"kind\":\"interface\",\"url\":\"html/SVGAnimateColorElement.html\"},{\"name\":\"SVGAnimatedAngle\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedAngle.html\"},{\"name\":\"SVGAnimatedBoolean\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedBoolean.html\"},{\"name\":\"SVGAnimatedEnumeration\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedEnumeration.html\"},{\"name\":\"SVGAnimatedInteger\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedInteger.html\"},{\"name\":\"SVGAnimatedLength\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedLength.html\"},{\"name\":\"SVGAnimatedLengthList\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedLengthList.html\"},{\"name\":\"SVGAnimatedNumber\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedNumber.html\"},{\"name\":\"SVGAnimatedNumberList\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedNumberList.html\"},{\"name\":\"SVGAnimatedPreserveAspectRatio\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedPreserveAspectRatio.html\"},{\"name\":\"SVGAnimatedRect\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedRect.html\"},{\"name\":\"SVGAnimatedString\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedString.html\"},{\"name\":\"SVGAnimatedTransformList\",\"kind\":\"interface\",\"url\":\"html/SVGAnimatedTransformList.html\"},{\"name\":\"SVGAnimateElement\",\"kind\":\"interface\",\"url\":\"html/SVGAnimateElement.html\"},{\"name\":\"SVGAnimateMotionElement\",\"kind\":\"interface\",\"url\":\"html/SVGAnimateMotionElement.html\"},{\"name\":\"SVGAnimateTransformElement\",\"kind\":\"interface\",\"url\":\"html/SVGAnimateTransformElement.html\"},{\"name\":\"SVGAnimationElement\",\"kind\":\"interface\",\"url\":\"html/SVGAnimationElement.html\"},{\"name\":\"SVGCircleElement\",\"kind\":\"interface\",\"url\":\"html/SVGCircleElement.html\"},{\"name\":\"SVGClipPathElement\",\"kind\":\"interface\",\"url\":\"html/SVGClipPathElement.html\"},{\"name\":\"SVGColor\",\"kind\":\"interface\",\"url\":\"html/SVGColor.html\"},{\"name\":\"SVGComponentTransferFunctionElement\",\"kind\":\"interface\",\"url\":\"html/SVGComponentTransferFunctionElement.html\"},{\"name\":\"SVGCursorElement\",\"kind\":\"interface\",\"url\":\"html/SVGCursorElement.html\"},{\"name\":\"SVGDefsElement\",\"kind\":\"interface\",\"url\":\"html/SVGDefsElement.html\"},{\"name\":\"SVGDescElement\",\"kind\":\"interface\",\"url\":\"html/SVGDescElement.html\"},{\"name\":\"SVGDocument\",\"kind\":\"interface\",\"url\":\"html/SVGDocument.html\"},{\"name\":\"SVGElement\",\"kind\":\"interface\",\"url\":\"html/SVGElement.html\"},{\"name\":\"SVGElementInstance\",\"kind\":\"interface\",\"url\":\"html/SVGElementInstance.html\"},{\"name\":\"SVGElementInstanceEvents\",\"kind\":\"interface\",\"url\":\"html/SVGElementInstanceEvents.html\"},{\"name\":\"SVGElementInstanceList\",\"kind\":\"interface\",\"url\":\"html/SVGElementInstanceList.html\"},{\"name\":\"SVGEllipseElement\",\"kind\":\"interface\",\"url\":\"html/SVGEllipseElement.html\"},{\"name\":\"SVGException\",\"kind\":\"interface\",\"url\":\"html/SVGException.html\"},{\"name\":\"SVGExternalResourcesRequired\",\"kind\":\"interface\",\"url\":\"html/SVGExternalResourcesRequired.html\"},{\"name\":\"SVGFEBlendElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEBlendElement.html\"},{\"name\":\"SVGFEColorMatrixElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEColorMatrixElement.html\"},{\"name\":\"SVGFEComponentTransferElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEComponentTransferElement.html\"},{\"name\":\"SVGFECompositeElement\",\"kind\":\"interface\",\"url\":\"html/SVGFECompositeElement.html\"},{\"name\":\"SVGFEConvolveMatrixElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEConvolveMatrixElement.html\"},{\"name\":\"SVGFEDiffuseLightingElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEDiffuseLightingElement.html\"},{\"name\":\"SVGFEDisplacementMapElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEDisplacementMapElement.html\"},{\"name\":\"SVGFEDistantLightElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEDistantLightElement.html\"},{\"name\":\"SVGFEDropShadowElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEDropShadowElement.html\"},{\"name\":\"SVGFEFloodElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEFloodElement.html\"},{\"name\":\"SVGFEFuncAElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEFuncAElement.html\"},{\"name\":\"SVGFEFuncBElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEFuncBElement.html\"},{\"name\":\"SVGFEFuncGElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEFuncGElement.html\"},{\"name\":\"SVGFEFuncRElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEFuncRElement.html\"},{\"name\":\"SVGFEGaussianBlurElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEGaussianBlurElement.html\"},{\"name\":\"SVGFEImageElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEImageElement.html\"},{\"name\":\"SVGFEMergeElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEMergeElement.html\"},{\"name\":\"SVGFEMergeNodeElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEMergeNodeElement.html\"},{\"name\":\"SVGFEMorphologyElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEMorphologyElement.html\"},{\"name\":\"SVGFEOffsetElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEOffsetElement.html\"},{\"name\":\"SVGFEPointLightElement\",\"kind\":\"interface\",\"url\":\"html/SVGFEPointLightElement.html\"},{\"name\":\"SVGFESpecularLightingElement\",\"kind\":\"interface\",\"url\":\"html/SVGFESpecularLightingElement.html\"},{\"name\":\"SVGFESpotLightElement\",\"kind\":\"interface\",\"url\":\"html/SVGFESpotLightElement.html\"},{\"name\":\"SVGFETileElement\",\"kind\":\"interface\",\"url\":\"html/SVGFETileElement.html\"},{\"name\":\"SVGFETurbulenceElement\",\"kind\":\"interface\",\"url\":\"html/SVGFETurbulenceElement.html\"},{\"name\":\"SVGFilterElement\",\"kind\":\"interface\",\"url\":\"html/SVGFilterElement.html\"},{\"name\":\"SVGFilterPrimitiveStandardAttributes\",\"kind\":\"interface\",\"url\":\"html/SVGFilterPrimitiveStandardAttributes.html\"},{\"name\":\"SVGFitToViewBox\",\"kind\":\"interface\",\"url\":\"html/SVGFitToViewBox.html\"},{\"name\":\"SVGFontElement\",\"kind\":\"interface\",\"url\":\"html/SVGFontElement.html\"},{\"name\":\"SVGFontFaceElement\",\"kind\":\"interface\",\"url\":\"html/SVGFontFaceElement.html\"},{\"name\":\"SVGFontFaceFormatElement\",\"kind\":\"interface\",\"url\":\"html/SVGFontFaceFormatElement.html\"},{\"name\":\"SVGFontFaceNameElement\",\"kind\":\"interface\",\"url\":\"html/SVGFontFaceNameElement.html\"},{\"name\":\"SVGFontFaceSrcElement\",\"kind\":\"interface\",\"url\":\"html/SVGFontFaceSrcElement.html\"},{\"name\":\"SVGFontFaceUriElement\",\"kind\":\"interface\",\"url\":\"html/SVGFontFaceUriElement.html\"},{\"name\":\"SVGForeignObjectElement\",\"kind\":\"interface\",\"url\":\"html/SVGForeignObjectElement.html\"},{\"name\":\"SVGGElement\",\"kind\":\"interface\",\"url\":\"html/SVGGElement.html\"},{\"name\":\"SVGGlyphElement\",\"kind\":\"interface\",\"url\":\"html/SVGGlyphElement.html\"},{\"name\":\"SVGGlyphRefElement\",\"kind\":\"interface\",\"url\":\"html/SVGGlyphRefElement.html\"},{\"name\":\"SVGGradientElement\",\"kind\":\"interface\",\"url\":\"html/SVGGradientElement.html\"},{\"name\":\"SVGHKernElement\",\"kind\":\"interface\",\"url\":\"html/SVGHKernElement.html\"},{\"name\":\"SVGImageElement\",\"kind\":\"interface\",\"url\":\"html/SVGImageElement.html\"},{\"name\":\"SVGLangSpace\",\"kind\":\"interface\",\"url\":\"html/SVGLangSpace.html\"},{\"name\":\"SVGLength\",\"kind\":\"interface\",\"url\":\"html/SVGLength.html\"},{\"name\":\"SVGLengthList\",\"kind\":\"interface\",\"url\":\"html/SVGLengthList.html\"},{\"name\":\"SVGLinearGradientElement\",\"kind\":\"interface\",\"url\":\"html/SVGLinearGradientElement.html\"},{\"name\":\"SVGLineElement\",\"kind\":\"interface\",\"url\":\"html/SVGLineElement.html\"},{\"name\":\"SVGLocatable\",\"kind\":\"interface\",\"url\":\"html/SVGLocatable.html\"},{\"name\":\"SVGMarkerElement\",\"kind\":\"interface\",\"url\":\"html/SVGMarkerElement.html\"},{\"name\":\"SVGMaskElement\",\"kind\":\"interface\",\"url\":\"html/SVGMaskElement.html\"},{\"name\":\"SVGMatrix\",\"kind\":\"interface\",\"url\":\"html/SVGMatrix.html\"},{\"name\":\"SVGMetadataElement\",\"kind\":\"interface\",\"url\":\"html/SVGMetadataElement.html\"},{\"name\":\"SVGMissingGlyphElement\",\"kind\":\"interface\",\"url\":\"html/SVGMissingGlyphElement.html\"},{\"name\":\"SVGMPathElement\",\"kind\":\"interface\",\"url\":\"html/SVGMPathElement.html\"},{\"name\":\"SVGNumber\",\"kind\":\"interface\",\"url\":\"html/SVGNumber.html\"},{\"name\":\"SVGNumberList\",\"kind\":\"interface\",\"url\":\"html/SVGNumberList.html\"},{\"name\":\"SVGPaint\",\"kind\":\"interface\",\"url\":\"html/SVGPaint.html\"},{\"name\":\"SVGPathElement\",\"kind\":\"interface\",\"url\":\"html/SVGPathElement.html\"},{\"name\":\"SVGPathSeg\",\"kind\":\"interface\",\"url\":\"html/SVGPathSeg.html\"},{\"name\":\"SVGPathSegArcAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegArcAbs.html\"},{\"name\":\"SVGPathSegArcRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegArcRel.html\"},{\"name\":\"SVGPathSegClosePath\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegClosePath.html\"},{\"name\":\"SVGPathSegCurvetoCubicAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoCubicAbs.html\"},{\"name\":\"SVGPathSegCurvetoCubicRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoCubicRel.html\"},{\"name\":\"SVGPathSegCurvetoCubicSmoothAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoCubicSmoothAbs.html\"},{\"name\":\"SVGPathSegCurvetoCubicSmoothRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoCubicSmoothRel.html\"},{\"name\":\"SVGPathSegCurvetoQuadraticAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoQuadraticAbs.html\"},{\"name\":\"SVGPathSegCurvetoQuadraticRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoQuadraticRel.html\"},{\"name\":\"SVGPathSegCurvetoQuadraticSmoothAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoQuadraticSmoothAbs.html\"},{\"name\":\"SVGPathSegCurvetoQuadraticSmoothRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegCurvetoQuadraticSmoothRel.html\"},{\"name\":\"SVGPathSegLinetoAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegLinetoAbs.html\"},{\"name\":\"SVGPathSegLinetoHorizontalAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegLinetoHorizontalAbs.html\"},{\"name\":\"SVGPathSegLinetoHorizontalRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegLinetoHorizontalRel.html\"},{\"name\":\"SVGPathSegLinetoRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegLinetoRel.html\"},{\"name\":\"SVGPathSegLinetoVerticalAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegLinetoVerticalAbs.html\"},{\"name\":\"SVGPathSegLinetoVerticalRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegLinetoVerticalRel.html\"},{\"name\":\"SVGPathSegList\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegList.html\"},{\"name\":\"SVGPathSegMovetoAbs\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegMovetoAbs.html\"},{\"name\":\"SVGPathSegMovetoRel\",\"kind\":\"interface\",\"url\":\"html/SVGPathSegMovetoRel.html\"},{\"name\":\"SVGPatternElement\",\"kind\":\"interface\",\"url\":\"html/SVGPatternElement.html\"},{\"name\":\"SVGPoint\",\"kind\":\"interface\",\"url\":\"html/SVGPoint.html\"},{\"name\":\"SVGPointList\",\"kind\":\"interface\",\"url\":\"html/SVGPointList.html\"},{\"name\":\"SVGPolygonElement\",\"kind\":\"interface\",\"url\":\"html/SVGPolygonElement.html\"},{\"name\":\"SVGPolylineElement\",\"kind\":\"interface\",\"url\":\"html/SVGPolylineElement.html\"},{\"name\":\"SVGPreserveAspectRatio\",\"kind\":\"interface\",\"url\":\"html/SVGPreserveAspectRatio.html\"},{\"name\":\"SVGRadialGradientElement\",\"kind\":\"interface\",\"url\":\"html/SVGRadialGradientElement.html\"},{\"name\":\"SVGRect\",\"kind\":\"interface\",\"url\":\"html/SVGRect.html\"},{\"name\":\"SVGRectElement\",\"kind\":\"interface\",\"url\":\"html/SVGRectElement.html\"},{\"name\":\"SVGRenderingIntent\",\"kind\":\"interface\",\"url\":\"html/SVGRenderingIntent.html\"},{\"name\":\"SVGScriptElement\",\"kind\":\"interface\",\"url\":\"html/SVGScriptElement.html\"},{\"name\":\"SVGSetElement\",\"kind\":\"interface\",\"url\":\"html/SVGSetElement.html\"},{\"name\":\"SVGStopElement\",\"kind\":\"interface\",\"url\":\"html/SVGStopElement.html\"},{\"name\":\"SVGStringList\",\"kind\":\"interface\",\"url\":\"html/SVGStringList.html\"},{\"name\":\"SVGStylable\",\"kind\":\"interface\",\"url\":\"html/SVGStylable.html\"},{\"name\":\"SVGStyleElement\",\"kind\":\"interface\",\"url\":\"html/SVGStyleElement.html\"},{\"name\":\"SVGSVGElement\",\"kind\":\"interface\",\"url\":\"html/SVGSVGElement.html\"},{\"name\":\"SVGSwitchElement\",\"kind\":\"interface\",\"url\":\"html/SVGSwitchElement.html\"},{\"name\":\"SVGSymbolElement\",\"kind\":\"interface\",\"url\":\"html/SVGSymbolElement.html\"},{\"name\":\"SVGTests\",\"kind\":\"interface\",\"url\":\"html/SVGTests.html\"},{\"name\":\"SVGTextContentElement\",\"kind\":\"interface\",\"url\":\"html/SVGTextContentElement.html\"},{\"name\":\"SVGTextElement\",\"kind\":\"interface\",\"url\":\"html/SVGTextElement.html\"},{\"name\":\"SVGTextPathElement\",\"kind\":\"interface\",\"url\":\"html/SVGTextPathElement.html\"},{\"name\":\"SVGTextPositioningElement\",\"kind\":\"interface\",\"url\":\"html/SVGTextPositioningElement.html\"},{\"name\":\"SVGTitleElement\",\"kind\":\"interface\",\"url\":\"html/SVGTitleElement.html\"},{\"name\":\"SVGTransform\",\"kind\":\"interface\",\"url\":\"html/SVGTransform.html\"},{\"name\":\"SVGTransformable\",\"kind\":\"interface\",\"url\":\"html/SVGTransformable.html\"},{\"name\":\"SVGTransformList\",\"kind\":\"interface\",\"url\":\"html/SVGTransformList.html\"},{\"name\":\"SVGTRefElement\",\"kind\":\"interface\",\"url\":\"html/SVGTRefElement.html\"},{\"name\":\"SVGTSpanElement\",\"kind\":\"interface\",\"url\":\"html/SVGTSpanElement.html\"},{\"name\":\"SVGUnitTypes\",\"kind\":\"interface\",\"url\":\"html/SVGUnitTypes.html\"},{\"name\":\"SVGURIReference\",\"kind\":\"interface\",\"url\":\"html/SVGURIReference.html\"},{\"name\":\"SVGUseElement\",\"kind\":\"interface\",\"url\":\"html/SVGUseElement.html\"},{\"name\":\"SVGViewElement\",\"kind\":\"interface\",\"url\":\"html/SVGViewElement.html\"},{\"name\":\"SVGViewSpec\",\"kind\":\"interface\",\"url\":\"html/SVGViewSpec.html\"},{\"name\":\"SVGVKernElement\",\"kind\":\"interface\",\"url\":\"html/SVGVKernElement.html\"},{\"name\":\"SVGZoomAndPan\",\"kind\":\"interface\",\"url\":\"html/SVGZoomAndPan.html\"},{\"name\":\"SVGZoomEvent\",\"kind\":\"interface\",\"url\":\"html/SVGZoomEvent.html\"},{\"name\":\"TableCaptionElement\",\"kind\":\"interface\",\"url\":\"html/TableCaptionElement.html\"},{\"name\":\"TableCellElement\",\"kind\":\"interface\",\"url\":\"html/TableCellElement.html\"},{\"name\":\"TableColElement\",\"kind\":\"interface\",\"url\":\"html/TableColElement.html\"},{\"name\":\"TableElement\",\"kind\":\"interface\",\"url\":\"html/TableElement.html\"},{\"name\":\"TableRowElement\",\"kind\":\"interface\",\"url\":\"html/TableRowElement.html\"},{\"name\":\"TableSectionElement\",\"kind\":\"interface\",\"url\":\"html/TableSectionElement.html\"},{\"name\":\"Testing\",\"kind\":\"class\",\"url\":\"html/Testing.html\"},{\"name\":\"Text\",\"kind\":\"interface\",\"url\":\"html/Text.html\"},{\"name\":\"TextAreaElement\",\"kind\":\"interface\",\"url\":\"html/TextAreaElement.html\"},{\"name\":\"TextEvent\",\"kind\":\"interface\",\"url\":\"html/TextEvent.html\"},{\"name\":\"TextMetrics\",\"kind\":\"interface\",\"url\":\"html/TextMetrics.html\"},{\"name\":\"TextTrack\",\"kind\":\"interface\",\"url\":\"html/TextTrack.html\"},{\"name\":\"TextTrackCue\",\"kind\":\"interface\",\"url\":\"html/TextTrackCue.html\"},{\"name\":\"TextTrackCueEvents\",\"kind\":\"interface\",\"url\":\"html/TextTrackCueEvents.html\"},{\"name\":\"TextTrackCueList\",\"kind\":\"interface\",\"url\":\"html/TextTrackCueList.html\"},{\"name\":\"TextTrackEvents\",\"kind\":\"interface\",\"url\":\"html/TextTrackEvents.html\"},{\"name\":\"TextTrackList\",\"kind\":\"interface\",\"url\":\"html/TextTrackList.html\"},{\"name\":\"TextTrackListEvents\",\"kind\":\"interface\",\"url\":\"html/TextTrackListEvents.html\"},{\"name\":\"TimeoutHandler\",\"kind\":\"interface\",\"url\":\"html/TimeoutHandler.html\"},{\"name\":\"TimeRanges\",\"kind\":\"interface\",\"url\":\"html/TimeRanges.html\"},{\"name\":\"TitleElement\",\"kind\":\"interface\",\"url\":\"html/TitleElement.html\"},{\"name\":\"Touch\",\"kind\":\"interface\",\"url\":\"html/Touch.html\"},{\"name\":\"TouchEvent\",\"kind\":\"interface\",\"url\":\"html/TouchEvent.html\"},{\"name\":\"TouchList\",\"kind\":\"interface\",\"url\":\"html/TouchList.html\"},{\"name\":\"TrackElement\",\"kind\":\"interface\",\"url\":\"html/TrackElement.html\"},{\"name\":\"TrackEvent\",\"kind\":\"interface\",\"url\":\"html/TrackEvent.html\"},{\"name\":\"TransitionEvent\",\"kind\":\"interface\",\"url\":\"html/TransitionEvent.html\"},{\"name\":\"TreeWalker\",\"kind\":\"interface\",\"url\":\"html/TreeWalker.html\"},{\"name\":\"UIEvent\",\"kind\":\"interface\",\"url\":\"html/UIEvent.html\"},{\"name\":\"Uint16Array\",\"kind\":\"interface\",\"url\":\"html/Uint16Array.html\"},{\"name\":\"Uint32Array\",\"kind\":\"interface\",\"url\":\"html/Uint32Array.html\"},{\"name\":\"Uint8Array\",\"kind\":\"interface\",\"url\":\"html/Uint8Array.html\"},{\"name\":\"Uint8ClampedArray\",\"kind\":\"interface\",\"url\":\"html/Uint8ClampedArray.html\"},{\"name\":\"UListElement\",\"kind\":\"interface\",\"url\":\"html/UListElement.html\"},{\"name\":\"UnknownElement\",\"kind\":\"interface\",\"url\":\"html/UnknownElement.html\"},{\"name\":\"ValidityState\",\"kind\":\"interface\",\"url\":\"html/ValidityState.html\"},{\"name\":\"VideoElement\",\"kind\":\"interface\",\"url\":\"html/VideoElement.html\"},{\"name\":\"VoidCallback\",\"kind\":\"interface\",\"url\":\"html/VoidCallback.html\"},{\"name\":\"WaveShaperNode\",\"kind\":\"interface\",\"url\":\"html/WaveShaperNode.html\"},{\"name\":\"WaveTable\",\"kind\":\"interface\",\"url\":\"html/WaveTable.html\"},{\"name\":\"WebGLActiveInfo\",\"kind\":\"interface\",\"url\":\"html/WebGLActiveInfo.html\"},{\"name\":\"WebGLBuffer\",\"kind\":\"interface\",\"url\":\"html/WebGLBuffer.html\"},{\"name\":\"WebGLCompressedTextureS3TC\",\"kind\":\"interface\",\"url\":\"html/WebGLCompressedTextureS3TC.html\"},{\"name\":\"WebGLContextAttributes\",\"kind\":\"interface\",\"url\":\"html/WebGLContextAttributes.html\"},{\"name\":\"WebGLContextEvent\",\"kind\":\"interface\",\"url\":\"html/WebGLContextEvent.html\"},{\"name\":\"WebGLDebugRendererInfo\",\"kind\":\"interface\",\"url\":\"html/WebGLDebugRendererInfo.html\"},{\"name\":\"WebGLDebugShaders\",\"kind\":\"interface\",\"url\":\"html/WebGLDebugShaders.html\"},{\"name\":\"WebGLFramebuffer\",\"kind\":\"interface\",\"url\":\"html/WebGLFramebuffer.html\"},{\"name\":\"WebGLLoseContext\",\"kind\":\"interface\",\"url\":\"html/WebGLLoseContext.html\"},{\"name\":\"WebGLProgram\",\"kind\":\"interface\",\"url\":\"html/WebGLProgram.html\"},{\"name\":\"WebGLRenderbuffer\",\"kind\":\"interface\",\"url\":\"html/WebGLRenderbuffer.html\"},{\"name\":\"WebGLRenderingContext\",\"kind\":\"interface\",\"url\":\"html/WebGLRenderingContext.html\"},{\"name\":\"WebGLShader\",\"kind\":\"interface\",\"url\":\"html/WebGLShader.html\"},{\"name\":\"WebGLShaderPrecisionFormat\",\"kind\":\"interface\",\"url\":\"html/WebGLShaderPrecisionFormat.html\"},{\"name\":\"WebGLTexture\",\"kind\":\"interface\",\"url\":\"html/WebGLTexture.html\"},{\"name\":\"WebGLUniformLocation\",\"kind\":\"interface\",\"url\":\"html/WebGLUniformLocation.html\"},{\"name\":\"WebGLVertexArrayObjectOES\",\"kind\":\"interface\",\"url\":\"html/WebGLVertexArrayObjectOES.html\"},{\"name\":\"WebKitCSSFilterValue\",\"kind\":\"interface\",\"url\":\"html/WebKitCSSFilterValue.html\"},{\"name\":\"WebKitCSSRegionRule\",\"kind\":\"interface\",\"url\":\"html/WebKitCSSRegionRule.html\"},{\"name\":\"WebKitMutationObserver\",\"kind\":\"interface\",\"url\":\"html/WebKitMutationObserver.html\"},{\"name\":\"WebKitNamedFlow\",\"kind\":\"interface\",\"url\":\"html/WebKitNamedFlow.html\"},{\"name\":\"WebSocket\",\"kind\":\"interface\",\"url\":\"html/WebSocket.html\"},{\"name\":\"WebSocketEvents\",\"kind\":\"interface\",\"url\":\"html/WebSocketEvents.html\"},{\"name\":\"WheelEvent\",\"kind\":\"interface\",\"url\":\"html/WheelEvent.html\"},{\"name\":\"Window\",\"kind\":\"interface\",\"url\":\"html/Window.html\"},{\"name\":\"WindowEvents\",\"kind\":\"interface\",\"url\":\"html/WindowEvents.html\"},{\"name\":\"Worker\",\"kind\":\"interface\",\"url\":\"html/Worker.html\"},{\"name\":\"WorkerContext\",\"kind\":\"interface\",\"url\":\"html/WorkerContext.html\"},{\"name\":\"WorkerContextEvents\",\"kind\":\"interface\",\"url\":\"html/WorkerContextEvents.html\"},{\"name\":\"WorkerEvents\",\"kind\":\"interface\",\"url\":\"html/WorkerEvents.html\"},{\"name\":\"WorkerLocation\",\"kind\":\"interface\",\"url\":\"html/WorkerLocation.html\"},{\"name\":\"WorkerNavigator\",\"kind\":\"interface\",\"url\":\"html/WorkerNavigator.html\"},{\"name\":\"XMLHttpRequest\",\"kind\":\"interface\",\"url\":\"html/XMLHttpRequest.html\"},{\"name\":\"XMLHttpRequestEvents\",\"kind\":\"interface\",\"url\":\"html/XMLHttpRequestEvents.html\"},{\"name\":\"XMLHttpRequestException\",\"kind\":\"interface\",\"url\":\"html/XMLHttpRequestException.html\"},{\"name\":\"XMLHttpRequestProgressEvent\",\"kind\":\"interface\",\"url\":\"html/XMLHttpRequestProgressEvent.html\"},{\"name\":\"XMLHttpRequestUpload\",\"kind\":\"interface\",\"url\":\"html/XMLHttpRequestUpload.html\"},{\"name\":\"XMLHttpRequestUploadEvents\",\"kind\":\"interface\",\"url\":\"html/XMLHttpRequestUploadEvents.html\"},{\"name\":\"XMLSerializer\",\"kind\":\"interface\",\"url\":\"html/XMLSerializer.html\"},{\"name\":\"XPathEvaluator\",\"kind\":\"interface\",\"url\":\"html/XPathEvaluator.html\"},{\"name\":\"XPathException\",\"kind\":\"interface\",\"url\":\"html/XPathException.html\"},{\"name\":\"XPathExpression\",\"kind\":\"interface\",\"url\":\"html/XPathExpression.html\"},{\"name\":\"XPathNSResolver\",\"kind\":\"interface\",\"url\":\"html/XPathNSResolver.html\"},{\"name\":\"XPathResult\",\"kind\":\"interface\",\"url\":\"html/XPathResult.html\"},{\"name\":\"XSLTProcessor\",\"kind\":\"interface\",\"url\":\"html/XSLTProcessor.html\"}],\"io\":[{\"name\":\"ChunkedInputStream\",\"kind\":\"interface\",\"url\":\"io/ChunkedInputStream.html\"},{\"name\":\"CloseEvent\",\"kind\":\"interface\",\"url\":\"io/CloseEvent.html\"},{\"name\":\"DecoderException\",\"kind\":\"class\",\"url\":\"io/DecoderException.html\"},{\"name\":\"DetachedSocket\",\"kind\":\"interface\",\"url\":\"io/DetachedSocket.html\"},{\"name\":\"Directory\",\"kind\":\"interface\",\"url\":\"io/Directory.html\"},{\"name\":\"DirectoryIOException\",\"kind\":\"class\",\"url\":\"io/DirectoryIOException.html\"},{\"name\":\"DirectoryLister\",\"kind\":\"interface\",\"url\":\"io/DirectoryLister.html\"},{\"name\":\"EncoderException\",\"kind\":\"class\",\"url\":\"io/EncoderException.html\"},{\"name\":\"Encoding\",\"kind\":\"class\",\"url\":\"io/Encoding.html\"},{\"name\":\"Event\",\"kind\":\"interface\",\"url\":\"io/Event.html\"},{\"name\":\"File\",\"kind\":\"interface\",\"url\":\"io/File.html\"},{\"name\":\"FileIOException\",\"kind\":\"class\",\"url\":\"io/FileIOException.html\"},{\"name\":\"FileMode\",\"kind\":\"class\",\"url\":\"io/FileMode.html\"},{\"name\":\"HttpClient\",\"kind\":\"interface\",\"url\":\"io/HttpClient.html\"},{\"name\":\"HttpClientConnection\",\"kind\":\"interface\",\"url\":\"io/HttpClientConnection.html\"},{\"name\":\"HttpClientRequest\",\"kind\":\"interface\",\"url\":\"io/HttpClientRequest.html\"},{\"name\":\"HttpClientResponse\",\"kind\":\"interface\",\"url\":\"io/HttpClientResponse.html\"},{\"name\":\"HttpException\",\"kind\":\"class\",\"url\":\"io/HttpException.html\"},{\"name\":\"HttpHeaders\",\"kind\":\"interface\",\"url\":\"io/HttpHeaders.html\"},{\"name\":\"HttpParserException\",\"kind\":\"class\",\"url\":\"io/HttpParserException.html\"},{\"name\":\"HttpRequest\",\"kind\":\"interface\",\"url\":\"io/HttpRequest.html\"},{\"name\":\"HttpResponse\",\"kind\":\"interface\",\"url\":\"io/HttpResponse.html\"},{\"name\":\"HttpServer\",\"kind\":\"interface\",\"url\":\"io/HttpServer.html\"},{\"name\":\"HttpStatus\",\"kind\":\"interface\",\"url\":\"io/HttpStatus.html\"},{\"name\":\"InputStream\",\"kind\":\"interface\",\"url\":\"io/InputStream.html\"},{\"name\":\"ListInputStream\",\"kind\":\"interface\",\"url\":\"io/ListInputStream.html\"},{\"name\":\"ListOutputStream\",\"kind\":\"interface\",\"url\":\"io/ListOutputStream.html\"},{\"name\":\"MessageEvent\",\"kind\":\"interface\",\"url\":\"io/MessageEvent.html\"},{\"name\":\"OSError\",\"kind\":\"class\",\"url\":\"io/OSError.html\"},{\"name\":\"OutputStream\",\"kind\":\"interface\",\"url\":\"io/OutputStream.html\"},{\"name\":\"Platform\",\"kind\":\"class\",\"url\":\"io/Platform.html\"},{\"name\":\"Process\",\"kind\":\"class\",\"url\":\"io/Process.html\"},{\"name\":\"ProcessException\",\"kind\":\"class\",\"url\":\"io/ProcessException.html\"},{\"name\":\"ProcessOptions\",\"kind\":\"class\",\"url\":\"io/ProcessOptions.html\"},{\"name\":\"ProcessResult\",\"kind\":\"interface\",\"url\":\"io/ProcessResult.html\"},{\"name\":\"RandomAccessFile\",\"kind\":\"interface\",\"url\":\"io/RandomAccessFile.html\"},{\"name\":\"RedirectException\",\"kind\":\"class\",\"url\":\"io/RedirectException.html\"},{\"name\":\"RedirectInfo\",\"kind\":\"interface\",\"url\":\"io/RedirectInfo.html\"},{\"name\":\"RedirectLimitExceededException\",\"kind\":\"class\",\"url\":\"io/RedirectLimitExceededException.html\"},{\"name\":\"RedirectLoopException\",\"kind\":\"class\",\"url\":\"io/RedirectLoopException.html\"},{\"name\":\"ServerSocket\",\"kind\":\"interface\",\"url\":\"io/ServerSocket.html\"},{\"name\":\"Socket\",\"kind\":\"interface\",\"url\":\"io/Socket.html\"},{\"name\":\"SocketInputStream\",\"kind\":\"interface\",\"url\":\"io/SocketInputStream.html\"},{\"name\":\"SocketIOException\",\"kind\":\"class\",\"url\":\"io/SocketIOException.html\"},{\"name\":\"SocketOutputStream\",\"kind\":\"interface\",\"url\":\"io/SocketOutputStream.html\"},{\"name\":\"StreamException\",\"kind\":\"class\",\"url\":\"io/StreamException.html\"},{\"name\":\"StringInputStream\",\"kind\":\"interface\",\"url\":\"io/StringInputStream.html\"},{\"name\":\"Timer\",\"kind\":\"interface\",\"url\":\"io/Timer.html\"},{\"name\":\"WebSocket\",\"kind\":\"interface\",\"url\":\"io/WebSocket.html\"},{\"name\":\"WebSocketClientConnection\",\"kind\":\"interface\",\"url\":\"io/WebSocketClientConnection.html\"},{\"name\":\"WebSocketConnection\",\"kind\":\"interface\",\"url\":\"io/WebSocketConnection.html\"},{\"name\":\"WebSocketException\",\"kind\":\"class\",\"url\":\"io/WebSocketException.html\"},{\"name\":\"WebSocketHandler\",\"kind\":\"interface\",\"url\":\"io/WebSocketHandler.html\"}],\"json\":[{\"name\":\"JSON\",\"kind\":\"class\",\"url\":\"json/JSON.html\"}],\"uri\":[{\"name\":\"Uri\",\"kind\":\"class\",\"url\":\"uri/Uri.html\"}],\"utf\":[{\"name\":\"IterableUtf16Decoder\",\"kind\":\"class\",\"url\":\"utf/IterableUtf16Decoder.html\"},{\"name\":\"IterableUtf32Decoder\",\"kind\":\"class\",\"url\":\"utf/IterableUtf32Decoder.html\"},{\"name\":\"IterableUtf8Decoder\",\"kind\":\"class\",\"url\":\"utf/IterableUtf8Decoder.html\"},{\"name\":\"Utf16beBytesToCodeUnitsDecoder\",\"kind\":\"class\",\"url\":\"utf/Utf16beBytesToCodeUnitsDecoder.html\"},{\"name\":\"Utf16BytesToCodeUnitsDecoder\",\"kind\":\"class\",\"url\":\"utf/Utf16BytesToCodeUnitsDecoder.html\"},{\"name\":\"Utf16CodeUnitDecoder\",\"kind\":\"class\",\"url\":\"utf/Utf16CodeUnitDecoder.html\"},{\"name\":\"Utf16leBytesToCodeUnitsDecoder\",\"kind\":\"class\",\"url\":\"utf/Utf16leBytesToCodeUnitsDecoder.html\"},{\"name\":\"Utf32beBytesDecoder\",\"kind\":\"class\",\"url\":\"utf/Utf32beBytesDecoder.html\"},{\"name\":\"Utf32BytesDecoder\",\"kind\":\"class\",\"url\":\"utf/Utf32BytesDecoder.html\"},{\"name\":\"Utf32leBytesDecoder\",\"kind\":\"class\",\"url\":\"utf/Utf32leBytesDecoder.html\"},{\"name\":\"Utf8Decoder\",\"kind\":\"class\",\"url\":\"utf/Utf8Decoder.html\"}]}\n      ";
}
Request.prototype.makeRequest = function() {
  print$("pppp");
  var resultComplete = new CompleterImpl();
  var req = _XMLHttpRequestFactoryProvider.XMLHttpRequest$factory();
  req.get$on().get$load().add($wrap_call$1((function (event) {
    print$("hhhhhhh");
    resultComplete.complete(req.responseText);
  })
  ), false);
  req.open("get", "http://api.dartlang.org/nav.json", true);
  req.send();
  return resultComplete.get$future();
}
function Parser() {
  this.baseUrl = "http://api.dartlang.org/";
}
Parser.prototype.getUrlsStartingWith = function(name) {
  var $this = this;
  var req = new Request();
  var resultComplete = new CompleterImpl();
  var future = req.makeRequest();
  future.then((function (jsonfuture) {
    $this.json = jsonfuture;
    var r = $this._parseStartWith(name);
    var url = new Array();
    r.forEach$1((function (result) {
      url.add(result.toString());
    })
    );
    resultComplete.complete(url);
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
function callFromJavascript(name, suggestFn, f) {
  var results = new Array();
  if (name.toLowerCase() == "home") {
    results.add("darlang.org , http://www.dartlang.org/");
    f.call$3(results, suggestFn, name);
  }
  else if (name.toLowerCase() == "spec") {
    results.add("language specification , http://www.dartlang.org/docs/spec/latest/dart-language-specification.html");
    f.call$3(results, suggestFn, name);
  }
  else {
    var p = new Parser();
    var future = p.getUrlsStartingWith(name);
    future.then((function (resultFuture) {
      results = resultFuture;
      if (results.get$length() == (0) && name.length > (2)) {
        results.add(("dartlang.org : , http://www.dartlang.org/search.html?&q=" + name));
      }
      f.call$3(results, suggestFn, name);
    })
    );
  }
}
function main() {
  var t = callFromJavascript;
}
(function(){
  var v0/*CharacterData*/ = 'CharacterData|Comment|Text|CDATASection';
  var v1/*HTMLDocument*/ = 'HTMLDocument|SVGDocument';
  var v2/*DocumentFragment*/ = 'DocumentFragment|ShadowRoot';
  var v3/*Element*/ = 'Element|HTMLElement|HTMLAnchorElement|HTMLAppletElement|HTMLAreaElement|HTMLBRElement|HTMLBaseElement|HTMLBaseFontElement|HTMLBodyElement|HTMLButtonElement|HTMLCanvasElement|HTMLContentElement|HTMLDListElement|HTMLDetailsElement|HTMLDirectoryElement|HTMLDivElement|HTMLEmbedElement|HTMLFieldSetElement|HTMLFontElement|HTMLFormElement|HTMLFrameElement|HTMLFrameSetElement|HTMLHRElement|HTMLHeadElement|HTMLHeadingElement|HTMLHtmlElement|HTMLIFrameElement|HTMLImageElement|HTMLInputElement|HTMLKeygenElement|HTMLLIElement|HTMLLabelElement|HTMLLegendElement|HTMLLinkElement|HTMLMapElement|HTMLMarqueeElement|HTMLMediaElement|HTMLAudioElement|HTMLVideoElement|HTMLMenuElement|HTMLMetaElement|HTMLMeterElement|HTMLModElement|HTMLOListElement|HTMLObjectElement|HTMLOptGroupElement|HTMLOptionElement|HTMLOutputElement|HTMLParagraphElement|HTMLParamElement|HTMLPreElement|HTMLProgressElement|HTMLQuoteElement|SVGElement|SVGAElement|SVGAltGlyphDefElement|SVGAltGlyphItemElement|SVGAnimationElement|SVGAnimateColorElement|SVGAnimateElement|SVGAnimateMotionElement|SVGAnimateTransformElement|SVGSetElement|SVGCircleElement|SVGClipPathElement|SVGComponentTransferFunctionElement|SVGFEFuncAElement|SVGFEFuncBElement|SVGFEFuncGElement|SVGFEFuncRElement|SVGCursorElement|SVGDefsElement|SVGDescElement|SVGEllipseElement|SVGFEBlendElement|SVGFEColorMatrixElement|SVGFEComponentTransferElement|SVGFECompositeElement|SVGFEConvolveMatrixElement|SVGFEDiffuseLightingElement|SVGFEDisplacementMapElement|SVGFEDistantLightElement|SVGFEDropShadowElement|SVGFEFloodElement|SVGFEGaussianBlurElement|SVGFEImageElement|SVGFEMergeElement|SVGFEMergeNodeElement|SVGFEMorphologyElement|SVGFEOffsetElement|SVGFEPointLightElement|SVGFESpecularLightingElement|SVGFESpotLightElement|SVGFETileElement|SVGFETurbulenceElement|SVGFilterElement|SVGFontElement|SVGFontFaceElement|SVGFontFaceFormatElement|SVGFontFaceNameElement|SVGFontFaceSrcElement|SVGFontFaceUriElement|SVGForeignObjectElement|SVGGElement|SVGGlyphElement|SVGGlyphRefElement|SVGGradientElement|SVGLinearGradientElement|SVGRadialGradientElement|SVGHKernElement|SVGImageElement|SVGLineElement|SVGMPathElement|SVGMarkerElement|SVGMaskElement|SVGMetadataElement|SVGMissingGlyphElement|SVGPathElement|SVGPatternElement|SVGPolygonElement|SVGPolylineElement|SVGRectElement|SVGSVGElement|SVGScriptElement|SVGStopElement|SVGStyleElement|SVGSwitchElement|SVGSymbolElement|SVGTextContentElement|SVGTextPathElement|SVGTextPositioningElement|SVGAltGlyphElement|SVGTRefElement|SVGTSpanElement|SVGTextElement|SVGTitleElement|SVGUseElement|SVGVKernElement|SVGViewElement|HTMLScriptElement|HTMLSelectElement|HTMLShadowElement|HTMLSourceElement|HTMLSpanElement|HTMLStyleElement|HTMLTableCaptionElement|HTMLTableCellElement|HTMLTableColElement|HTMLTableElement|HTMLTableRowElement|HTMLTableSectionElement|HTMLTextAreaElement|HTMLTitleElement|HTMLTrackElement|HTMLUListElement|HTMLUnknownElement';
  var v4/*AbstractWorker*/ = 'AbstractWorker|SharedWorker|Worker';
  var v5/*IDBRequest*/ = 'IDBRequest|IDBVersionChangeRequest';
  var v6/*MediaStream*/ = 'MediaStream|LocalMediaStream';
  var v7/*Node*/ = [v0/*CharacterData*/,v1/*HTMLDocument*/,v2/*DocumentFragment*/,v3/*Element*/,'Node|Attr|DocumentType|Entity|EntityReference|Notation|ProcessingInstruction'].join('|');
  var v8/*WorkerContext*/ = 'WorkerContext|DedicatedWorkerContext|SharedWorkerContext';
  var table = [
    ['AbstractWorker', v4/*AbstractWorker*/]
    , ['AudioParam', 'AudioParam|AudioGain']
    , ['CSSValueList', 'CSSValueList|WebKitCSSTransformValue|WebKitCSSFilterValue']
    , ['CharacterData', v0/*CharacterData*/]
    , ['DOMTokenList', 'DOMTokenList|DOMSettableTokenList']
    , ['HTMLDocument', v1/*HTMLDocument*/]
    , ['DocumentFragment', v2/*DocumentFragment*/]
    , ['Element', v3/*Element*/]
    , ['Entry', 'Entry|DirectoryEntry|FileEntry']
    , ['EntrySync', 'EntrySync|DirectoryEntrySync|FileEntrySync']
    , ['IDBRequest', v5/*IDBRequest*/]
    , ['MediaStream', v6/*MediaStream*/]
    , ['Node', v7/*Node*/]
    , ['WorkerContext', v8/*WorkerContext*/]
    , ['EventTarget', [v4/*AbstractWorker*/,v5/*IDBRequest*/,v6/*MediaStream*/,v7/*Node*/,v8/*WorkerContext*/,'EventTarget|AudioContext|BatteryManager|DOMApplicationCache|DeprecatedPeerConnection|EventSource|FileReader|FileWriter|IDBDatabase|IDBTransaction|MediaController|MessagePort|Notification|PeerConnection00|SpeechRecognition|TextTrack|TextTrackCue|TextTrackList|WebSocket|DOMWindow|XMLHttpRequest|XMLHttpRequestUpload'].join('|')]
    , ['HTMLCollection', 'HTMLCollection|HTMLOptionsCollection']
    , ['Uint8Array', 'Uint8Array|Uint8ClampedArray']
  ];
  $dynamicSetMetadata(table);
})();
function $static_init(){
}
var const$0000 = Object.create(_DeletedKeySentinel.prototype, {});
var const$0001 = Object.create(NoMoreElementsException.prototype, {});
var const$0002 = Object.create(EmptyQueueException.prototype, {});
var const$0003 = Object.create(UnsupportedOperationException.prototype, {_message: {"value": "", writeable: false}});
$static_init();
if (typeof window != 'undefined' && typeof document != 'undefined' &&
    window.addEventListener && document.readyState == 'loading') {
  window.addEventListener('DOMContentLoaded', function(e) {
    main();
  });
} else {
  main();
}
