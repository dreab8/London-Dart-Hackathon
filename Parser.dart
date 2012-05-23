class Parser {
  
  final String baseUrl = "http://api.dartlang.org/";
  String _json;
  Request _request;
    
  Parser(){
  }
  
  set reaquest(Request request) => this._request = request;
  
  Future<List<String>> getUrlsStartingWith(String searchedString){
    Completer resultComplete = new Completer();
    Future<String> future = _request.makeRequest();
    
    future.then((jsonFuture){
      _json = jsonFuture;
      List<Result> r = _parseStartWith(searchedString);
      
      List<String> url = new List();
      
      r.forEach((result){
        url.add(result.toString());
      });
      resultComplete.complete(url);
    });
    
    return resultComplete.future;
  }
   
  List<Result> _parseStartWith(String name){
    Map<String, Object> parsedJson = JSON.parse(_json);
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