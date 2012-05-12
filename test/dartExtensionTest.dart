#import('dart:html');
#import('dart:json');

#import('/home/drea/opt/dart/dart-sdk/lib/dart2js/lib/unittest/unittest.dart');
#import('/home/drea/opt/dart/dart-sdk/lib/dart2js/lib/unittest/html_enhanced_config.dart');
#import('../dartExtension.dart', prefix:'d');

void main() {
  useHtmlEnhancedConfiguration(true);
  
  d.Parser parser = new d.Parser();
  
  group('parser',(){
    
//    test('shoultReturnCorrectTheUrlList',(){
//      var className = "AssertionError";
//      var kind = "class";
//      var url = "http://api.dartlang.org/dart_core/AssertionError.html";
//      List<String> result = parser.getUrlsStartingWith( className);
//      Expect.equals("${kind} ${className} , ${url}", result[0]);
//    });
//    
//    test('ShouldReturnAnEmptyListForNotMatchingSearch',(){
//      var className = "yrer";
//      List result = parser.getUrlsStartingWith(className);
//      Expect.equals(0,result.length);
//    });
//    
//    test('ShouldReturnALotOfResults',(){
//      var className = "A";
//      List result = parser.getUrlsStartingWith(className);
//      Expect.equals(31,result.length);
//    });
    
  });
  
  group('dartStringStarWithExploratoryTests',(){
    
//    test('shouldBeTrueAssertioErrorStringStartWithA',(){
//      String className = "a";
//      String result = "AssertionError";
//      Expect.isTrue(result.toUpperCase().startsWith(className.toUpperCase()));
//    });
//    
//    test('shouldBeTrueAssertioErrorStringStartWithAs',(){
//      String className = "as";
//      String result = "AssertionError";
//      Expect.isTrue(result.toUpperCase().startsWith(className.toUpperCase()));
//    });
//    
//    test('shouldbeFalseAssertioErrorStringStartWithx',(){
//      String className = "x";
//      String result = "AssertionError";
//      Expect.isFalse(result.toUpperCase().startsWith(className.toUpperCase()));
//    });
    
  });
}
