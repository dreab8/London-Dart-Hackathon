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

dartCallback(String data) {
  print(data);
  var obj = JSON.parse(data);
//  print(obj);
//  Element div = document.query("#jsondiv");
}

void main() {
  
  //var f = dartCallback;
  var t = callFromJavascript;
  
  //var f = dartCallback;
  //Element script = new Element.tag("script");
  //script.src = "http://api.dartlang.org/nav.json?callback=callbackForJsonpApi";
//script.src = "https://ajax.googleapis.com/ajax/services/search/news?v=1.0&q=barack%20obama&callback=callbackForJsonpApi";
  //document.body.elements.add(script);
}
