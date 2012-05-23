class Request {
  
  final String url = 'http://api.dartlang.org/nav.json';
  String _json;

  String getJsonResult() => _json;
  
  Future<String> makeRequest(){
    Completer resultComplete = new Completer();
    XMLHttpRequest req = new XMLHttpRequest();
    
    req.on.load.add((event) {
      resultComplete.complete(req.responseText);
    });

    req.open('get', url, true);
    req.send();
    return resultComplete.future;
  }
}