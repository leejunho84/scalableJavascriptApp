## 대규모 웹어플리케이션 개발을 위한 자바스크립트 구조

### 1.시작하며
구축과 운영에 꼭 필요한 확장성있는 웹어플리케이션을 구축하는 방법을 공유하고자한다. 이것은 정답이 아닌 구축과 운영의 결과물이며,
커머스 플랫폼을 개발완료와 1년 반의 운영에 대한 회고이다.

참고자료 Nicholas Zakas의 [JavaScript Application Architecture](https://www.slideshare.net/nzakas/scalable-javascript-application-architecture)

### 2.확장성있게 개발하기
를 보면 확장성있는 개발을 위해 몇가지 규칙을 제시 했다.
- 자신의 범위 밖의 DOM element에 접근하지 마라
- 전역객체를 생성/참조하지 마라
- 다른 모듈에 직접 접근하지 마라

> 즉 무분별한 전역객체 생성으로 오염을 방지하고, 모듈간 느슨한 참조위해 sandbox(IF)가지고, 모든 모듈의 생명주기를 중앙에서 관리한다.

![Alt text](/architecture.png "sandbox architecture")

#### sandbox
```javascript
var sandbox = function(){
    //interface
	//샌드박스는 모듈의 간 연결할 통로(IF)를 제공한다.
    return {
        getModule:function(moduleName){
            return modules[moduleName];
        },
        ...

```

#### application core
```javascript
var Core = {}; // namespace 정의
var modules = {};  //모듈등록

//모듈을 등록하기 위해 모듈의 이름(moduleID)과 함수를 정의 한다.
Core.register = function(moduleID, creator){
	modules[moduleID] = {
		creator:creator,
		instance:null
	}
}
```

#### module
```javascript
//함수를 즉시실행하여 Core에 등록한다.
(function(ns){
	ns.register('module-name', function(sandbox){
	    return {
	        init:function(){}, //start
	        destroy:function(){} //end
	    }
	});
})(Core);
```

이와 같이 `sandbox`와 `Core`를 사용하여 모듈을 관리해야 한다. 이렇게 모듈단위의 개발을 기초로 두고 여기에 모듈의 하위로 `Component`를 추가 하였다.

하나의 모듈은 여러개의 컴포넌트를 가질수 있으며 각각의 컴포넌트를 관리한다.
컴포넌트는 `input, label, button` 처럼 엘리먼트의 가장 작은단위 또는 `container Component`로 이벤트 및 현재상태를 상위 컴포넌트 및 모듈에 전달하는 역할을 한다.
모듈은 컴포넌트의 이벤트를 받아 다른 컴포넌트의 값을 전달하거나 다른 모듈의 상태를 변경하는 있다.
> **container Component** 컴포넌트의 집합.

#### Component
```javaScript
(function(Core){
	var InputText = function(){
		'use strict';

		var $input;

		//기본컴포넌트 세팅이다.
		//컴포넌트의 selector, class, state 가 들어갈수 있다.  
		var setting = {
			selector:'[data-component-inputText]'
		}

		//InputText가 실행되고 외부참조가 가능하게 클로져를 리턴한다.
		var Closure = function(){}
		Closure.prototype.setting = function(){
			var opt = Array.prototype.slice.call(arguments).pop();
			$.extend(setting, opt);
			return this;
		}
		Closulre.prototype.init = function(){
				var _self = this;

				$input = $(setting.selector);
				$input.focusout(function(e){
					e.preventDefault();

					//컴포넌트의 focusout 이벤트를 상위 모듈 및 컴포넌트에 전달하기 위한
					//사용자정의 이벤트를 등록 한다.
					_self.fireEvent('inputFocusOut', _self, [$(this).val()]);
				});

				return this;
			}
		}
		Closure.prototype.getInputValue = function(){
			return $input.val();
		}

		Core.Observer.applyObserver(Closure);
		return new Closure();
	}

	//모듈과 마찬가지로 Core의 Components를 등록한다.
	Core.Components['component_inputText'] = {
		constructor:InputText,
		reInit:true || false, //즉시실행 || 상위 모듈 및 컴포넌트에서 관리
		attrName:'data-component-inputText'
	}
})(Core);
```

- ** setting ** 컴포넌트의 재사용성을 위해 내부에서는 setting값을 참조한다.
- ** Closure ** 상위 모듈 및 컴포넌트에서 참조할수 있도록 prototype 상속한다.
- ** reInit ** 상위 관리권한 여부 ( 즉시 실행해야하는 경우가 있기에 추가 )

### 3.Search 모듈개발
오픈소스 도로명주소 API [postcodify](https://www.poesis.org/postcodify/)를 이용하여 주소검색모듈을 개발을 해보면서 좀더 디테일한 개발 방법을 설명하겠다.

#### html
```html
<div class="search-field shipping-address" data-module-searchfield="{api://api.poesis.kr/post/search.php, errMsg:주소를 입력해주세요}">
	<span class="input-textfield width-max" data-component-inputText="{}">
		<label for="address.addressLine1">예) 문래동 강서타워, 선유로 82</label>
		<input type="text" name="address.addressLine1" autocomplete="off" />
		<span class="error-message"></span>
	</span>
	<button class="btn_search button width-fix">검색</button>
	<ul class="result-wrap"></ul>
</div>
```
#### javascript
```javascript
(function(ns){
	ns.register('module-name', function(sandbox){
	    return {
	        init:function(){}, //start
	        destroy:function(){} //end
	    }
	});
})(Core);
```


플랫폼을 어떻게 개발 해야할지가 중요했다. 플랫폼은 여러다양한 사람들이
내가 운영을 했었던 프로젝트들중 프레임워크를 사용한 프로젝트를 제외한 여러 라이브러리를 사용한 프로젝트에서는 코드의 재사용성이라는 것 자체가 불가능했다. 물론 자기가 개발한 코드들에서는 재사용을 하기 위해 짜겠지만
컴포넌트는 아주 작은 단위로 쪼개어 질때 가장 재사용이 가능한 상태로


### components



1. 이처럼 인풋컴포넌트와 버튼컴포넌트 그리고 검색api로 검색기능컴포넌트를 만들수 있다.

예) inputText.js - focusIn, focusOut 을 가진 컴포넌트
    button.js - click 이벤트를 가진 컴포넌트
    search.js - inputText 기능 + button 기능 + api


2. 컴포넌트들은 상위 모듈 및 컴포넌트에 이벤트와 자신의 현 상태를 보낼 수 있는 기능이 필요하여 사용자정의 이벤트를 각 컴포넌트에 주입하였다.

```javascript

_self.fireEvent('사용자정의 이벤트 이름', '바인드될 this' , '상태');

```

```javascript
기본적인 컴포넌트 구조는 다음과 같다 :

(function(Core){
    var TxtField = function(){
        'use strict';

        var setting = {
            //기본 템플릿에 정의된 TxtField 컴포넌트의 selector 및 class 등을 작성한다.
            selector:'[data-component-textfiled]',
            focuson:'.active'
        }

        var Closure = function(){}
        Closure.prototype.setting = function(){
            //컴포넌트의 재사용성을 위해 setting 값을 외부( module 및 component )에서 변경가능하도록 한다.
            var opt = Array.prototype.slice.call(arguments).pop();
            $.extend(setting, opt);
            return this;
        }

        Closure.prototype.init = function(){
            //인풋텍스트의 이벤트를 등록하거나
            //초기 컴포넌트의 상태를 지정한다.
            var $input = $(setting.selector);
            var _self = this;

            $input.on({
                focusIn:function(){
                    //상위 모듈 및 컴포넌트에 이벤트를 전달한다.
                    _self.fireEvent('customInputFocusIn', this);
                },
                focusOut:function(){
                    //상위 모듈 및 컴포넌트에 이벤트를 전달한다.
                    _self.fireEvent('customInputFocusOut', this, [$input.val()]);
                }
            });

            return this;
        }

        Core.Observer.applyObserver(Closure);
        return new Closure();
    }

    Core.Components['component_textfield'] = {
        constructor:TxtField,
        reInit:true,
        attrName:'data-component-textfield',
    }
})(Core);

```


### module






## 디렉터리 구조

hello-world
├── js
│   ├── core.js
│   ├── module
│   │    ├── search.js
│   │    ├── postlist.js
│   │            
│   ├── components
│   │    ├── input.js
│   │    ├── select.js
│   │            
│   ├── vendor
│   │    ├── jquery
│   │    ├── handlebars
│   │            .
│
└── css
    ├── search.scss
    ├── postlist.scss
        .
        .


## 맷음말
2017년 겨울 커머스플렛폼을 개발하는 프로젝트에 참여하게 되었다. 무의 상태에서 새롭게 시작할 수 있는 아주 좋은 프로젝트였다.
