class Parser {
  
  String baseUrl = "http://api.dartlang.org/";
  
  String json;
  
  Parser(){
    Request r = new Request();
    json = r.getJson();
  }
  
  List<String> getUrlsStartingWith(String name){
    List<Result> r = _parseStartWith(name);
    
    List<String> url = new List();
   
    r.forEach((result){
      url.add(result.toString());
    });
    
    return url;
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