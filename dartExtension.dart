#library('dartSearchExtension');

#import('dart:html');
#import('dart:json');

#source('Result.dart');
#source('Request.dart');
#source('Parser.dart');

callFromJavascript(String name, var suggestFn, var f){
  List results = new List();
  
  if(name.toLowerCase() == "home"){
    results.add("darlang.org , http://www.dartlang.org/");
    f(results,suggestFn,name) ;
    
  }else if (name.toLowerCase() == "spec"){
    results.add("language specification , http://www.dartlang.org/docs/spec/latest/dart-language-specification.html");
    f(results,suggestFn,name);
  }else{
    Parser p = new Parser();
    p.reaquest = new Request();
    
    Future<List<String>> future = p.getUrlsStartingWith(name);
    
    future.then((resultFuture){
      results = resultFuture;
          if(results.length == 0 && name.length > 2){
            results.add("dartlang.org : , http://www.dartlang.org/search.html?&q=${name}");
          }
          f(results,suggestFn,name);
    });
  }
  
}

void main() {
  var t = callFromJavascript;
}
