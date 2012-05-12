class Parser {
  
  String baseUrl = "http://api.dartlang.org/";
  
  String json;
  
  Parser(){
    
  }
  
  Future<List<String>> getUrlsStartingWith(String name){
    Request req = new Request();
    Completer resultComplete = new Completer();
    Future<String> future = req.makeRequest();
    future.then((jsonfuture){
      json = jsonfuture;
      List<Result> r = _parseStartWith(name);
      
      List<String> url = new List();
      
      r.forEach((result){
        url.add(result.toString());
      });
      resultComplete.complete(url);
    });
    return resultComplete.future;
  }
   
  List<Result> _parseStartWith(String name){
    Map<String, Object> parsedJson = JSON.parse(json);
    List<Result> results = new List<Result>();
    
    var packagesKeys = parsedJson.getKeys();
    packagesKeys.forEach((k){
      
      var packageValues = parsedJson[k];
      
      packageValues.forEach((v){
        
        if(v["name"].toUpperCase().startsWith(name.toUpperCase())){
          Result result = new Result(v["name"],v["kind"],baseUrl + v["url"]);
          results.add(result);
        }
      });
    });
    return results;
  }
}