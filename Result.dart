class Result {
  String name;
  String kind;
  String url;
  
  Result(this.name,this.kind,this.url);
  
  List asList(){
    List l = new List();
    l.add(kind + " " + name);
    l.add(url);
    return l;
  }
  
  String toString(){
    return "${this.kind} ${this.name} , ${this.url}";
  }
}
