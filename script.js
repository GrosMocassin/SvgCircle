// http://stackoverflow.com/questions/9723422/is-there-some-innerhtml-replacement-in-svg-xml

// Inspiration for this derived from a shim known as "innerSVG" which adds "innerHTML" attribute to SVGElement:
Object.defineProperty(SVGElement.prototype, 'innerHTML', {
  get: function() {
    // TBD!
  },
  set: function(markup) {
    // 1. Remove all children
    while (this.firstChild) {
      this.firstChild.parentNode.removeChild(this.firstChild);
    }

    // 2. Parse the SVG
    var doc = new DOMParser().parseFromString(
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' + markup + '</svg>',
        'application/xml'
    );
    
    // 3. Import the parsed SVG and grab the childNodes
    var contents = this.ownerDocument.importNode(doc.documentElement, true).childNodes;

    // 4. Append the childNodes to this node
    for (var i = 0; i < contents.length; i++) {
      this.appendChild(contents[i]);
    }
  },
  enumerable: false,
  configurable: true
});

var myApp = angular.module('myApp', []);
	
	var mouseHandler = function($document, scope, element, data, xName, yName){
	  var startX = data[xName]; 
	  var startY = data[yName];
	  
	  element.on('mousedown', function(event) {
			console.log(event.target);

          // Prevent default dragging of selected content
          event.preventDefault();
          startX = event.pageX - data[xName];
          startY = event.pageY - data[yName];
          $document.on('mousemove', mousemove);
          $document.on('mouseup', mouseup);
        });

        function mousemove(event) {
		  scope.$apply(function () {
			data[xName] = event.pageX - startX;
			data[yName] = event.pageY - startY;
		  });
        }

        function mouseup() {
          $document.off('mousemove', mousemove);
          $document.off('mouseup', mouseup);
        }
		
		var originalStroke = data.stroke;
		var originalFill = data.fill;
				
		var overStroke = '#0b9bc5';
		var overFill = '#0082a8';
		
		element.on('mouseenter', function(event) {
		  originalStroke = data.stroke;
		  originalFill = data.fill;
          scope.$apply(function () {
			data.stroke = overStroke;
			data.fill = overFill;
		  });
        });
		
		element.on('mouseleave', function(event) {
          scope.$apply(function () {
			data.stroke = originalStroke;
			data.fill = originalFill;
		  });
        });
	};
			
	myApp.shapes = [{'tag': 'g', 'children': [
				{'tag': 'circle', 'cx': 100, 'cy': 50, 'r':30, 'fill':'orange', 'stroke':'green', 'children': []},
				{'tag': 'rect', 'x': 200, 'y': 50, 'width':30, 'height':30, 'fill':'orange', 'stroke':'yellow', 'children': []},
				{'tag': 'circle', 'cx': 200, 'cy': 50, 'r':30, 'fill':'orange', 'stroke':'yellow', 'children': []},
				{'tag': 'g', 'children': [{'tag': 'circle', 'cx': 100, 'cy': 150, 'r':20, 'fill':'orange', 'stroke':'red', 'children': []}]}
				]}
			];
			
			
	myApp.circleShape = {'tag': 'circle', 'cx': 100, 'cy': 50, 'r':30, 'fill':'orange', 'stroke':'green', 'children': []};
	myApp.radiusCtrl = {'tag': 'circle', 'cx': 100, 'cy': 20, 'r':4, 'fill':'yellow', 'stroke':'green', 'children': []};
			
	myApp.factory('RecursionHelper', ['$compile', function($compile){
		var RecursionHelper = {
			compile: function(element){
				var contents = element.contents().remove();
				var compiledContents;
				return function(scope, element){
					if(!compiledContents){
						compiledContents = $compile(contents);
					}
					compiledContents(scope, function(clone){
						element.append(clone);
					});
				};
			}
		};

		return RecursionHelper;
	}]);
	
	myApp.directive('mySvgCircle', ['$document', function($document) {
		  return {
				restrict: 'A',
				templateUrl: "./mySvgCircle.html"
		  };
	}]);
	
	myApp.computeRadius = function(){
	    var dx = myApp.radiusCtrl.cx - myApp.circleShape.cx;
		var dy = myApp.radiusCtrl.cy - myApp.circleShape.cy;
		return Math.sqrt( dx * dx + dy * dy);
	}
	
	myApp.directive('mainCircle', ['$document', function($document) {
		  return {
				restrict: 'A',
				link: function (scope, element, attrs) {
				    scope.radiusCtrl = myApp.radiusCtrl;
				    scope.circleShape = myApp.circleShape;
					scope.computeRadius = myApp.computeRadius;
				  // manipulation du DOM et événements
					mouseHandler($document, scope, element, scope.circleShape, 'cx', 'cy');  
					mouseHandler($document, scope, element, scope.radiusCtrl, 'cx', 'cy'); 
				}
		  };
	}]);
	
	myApp.directive('circleCtrl', ['$document', function($document) {
		  return {
				restrict: 'A',
				link: function (scope, element, attrs) {
					scope.radiusCtrl = myApp.radiusCtrl;
					scope.circleShape = myApp.circleShape;
				  // manipulation du DOM et événements
					mouseHandler($document, scope, element, scope.radiusCtrl, 'cx', 'cy');  
				}
		  };
	}]);
		
	myApp.directive('mySvg', function() {
		  return {
				restrict: 'A',
				templateUrl: "./mySvg.html",
				controller: function($scope) {
						$scope.children = myApp.shapes;
				},
				controllerAs: "ctrl"
		  };
	});
	
	myApp.directive('myShapes', function(RecursionHelper) {
		  return {
				restrict: 'A',
				scope: {shape: '='},
				templateUrl: "./myShapes.html",
				controller: function($scope) {
					//console.log($scope.shape);
					//console.log($scope.shape.children);
					
					$scope.log = function(obj){
						console.log('----', obj);
					};					
				},
				compile: function(element) {
					return RecursionHelper.compile(element);
				},
				controllerAs: "ctrl"
		  };
	});
	
	myApp.gStr = function(){
		return '<g ng-switch="shape.tag" ng-init="log(shape.children)">'
							+'    <g ng-switch-when="g">'
							+'          <g ng-repeat="child in (shape.children)">'
							+'              <g shape="child" my-g=""></g>'
							+'          </g>'
							+'    </g>'
							+'<circle ng-switch-when="circle"' 
							+' ng-attr-cx="{{shape.cx}}"' 
							+' ng-attr-cy="{{shape.cy}}"' 
							+' ng-attr-r="{{shape.r}}"' 
							+' ng-attr-id="{{shape.id}}"'  
							+'			ng-attr-fill= "{{shape.fill}}"'
							+'			ng-attr-stroke= "{{shape.stroke}}"'
							+'			stroke-width="2"'
							+'			bob=""'						
							+'></circle>'
							+'		<rect ng-switch-when="rect"'
							+'			ng-attr-x="{{shape.x}}" '
							+'			ng-attr-y="{{shape.y}}" '
							+'			ng-attr-width= "{{shape.width}}"'
							+'			ng-attr-height= "{{shape.height}}"'
							+' ng-attr-xmlbase="{{shape.xmlbase}}"' 
							+' ng-attr-requiredExtensions="{{shape.requiredExtensions}}"' 
							+'			bob=""'
							+'		></rect>'
							+'      <g ng-switch-default=""></g>'
							+'</g>';
	}
	
	myApp.directive('myG', function(RecursionHelper) {
		  return {
				restrict: 'A',
				scope: {shape: '='},
				template: myApp.gStr(),
				controller: function($scope) {
					$scope.log = function(obj){
						console.log('----', obj);
					};	
				},
				compile: function(element) {
					return RecursionHelper.compile(element);
				},
				controllerAs: "ctrl"
		  };
	});
	
	myApp.directive('bob', ['$document', function($document) {
		  return {
			restrict: 'A',
			link: function (scope, element, attrs) {
			  // manipulation du DOM et événements
			  if(scope.shape.tag==='circle'){
				mouseHandler($document, scope, element, scope.shape, 'cx', 'cy');  
			  } else{
				mouseHandler($document, scope, element, scope.shape, 'x', 'y');  
			  }
			}
		  };
	}]);


	
	