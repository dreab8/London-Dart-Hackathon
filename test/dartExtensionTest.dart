#import('dart:html');
#import('dart:json');

#import('/home/drea/opt/dart/dart-sdk/lib/dart2js/lib/unittest/unittest.dart');
#import('/home/drea/opt/dart/dart-sdk/lib/dart2js/lib/unittest/html_enhanced_config.dart');
#import('../dartExtension.dart', prefix:'d');

void main() {
  useHtmlEnhancedConfiguration(true);
  
  d.Parser parser = new d.Parser();
  
  group('parser',(){
    
   test('shoouldParseTheCorrectResultForTheAssertionErrorClass',(){
      var className = "AssertionError";
      d.Result result = parser.parse(className);
      Expect.equals(className,result.name); 
      
    }); 
   
    test('shoultReturnCorrectTheUrlList',(){
      var className = "AssertionError";
      List result = parser.geturl(className);
      Expect.equals(className,result[0]);
    });
    
    test('ShouldReturAnEmptyList',(){
      var className = "";
      List result = parser.geturl(className);
      Expect.equals(0,result.length);
    });
  });
}
