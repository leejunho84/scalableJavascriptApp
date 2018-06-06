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

> 즉 무분별한 전역객체 생성으로 오염을 방지하고, 모듈간 느슨한 참조위해 각각 자신의 sandbox(IF)가지며, 모든 모듈의 생명주기를 중앙에서 관리를 해야한다.

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
sandbox는 interface를 재공하여 모듈을 재사용성과 독립성을 보장해 주는 역할을 한다.

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
Core.utils = {
	price:function(price){},
	ajax:function(url, method, data, callback){},
	promise:function(){},
	...
}
```
Core는 모듈의 생명주기를 관할하고 custom library를 재공해준다.

#### module
```javascript
//함수를 즉시실행하여 Core에 등록한다.
(function(ns){
	ns.register('module_모듈이름', function(sandbox){
	    return {
	        init:function(){
				sandbox.uiInit({
					selector:'[data-module-모듈이름]',
					attrName:'data-module-모듈이름',
					moduleName:'module_모듈이름',
					handler:{context:this, method:'initial function'}
				});
			}, //start
	        destroy:function(){} //end
	    }
	});
})(Core);
```
모듈은 항상 sandbox를 통해 다른 모듈을 참조하거나
- ** 모듈이름 ** module을 식별값를 입력 한다.
- ** attrName ** 모듈의 attribute값을 가져온다 단일 및 배열을 넣을수 있다.
- ** handler ** Core 내부에서 모듈을 초기화에 쓰이는 this와 메서드 이다.
- ** initial function ** 모듈 초기화 함수

이와 같이 `sandbox`와 `Core`를 사용하여 `module`을 관리해야 확장가능한 어플리케이션이라 본다. 그리고 모듈은 독립적으로 실행가능한 상태가 되야 하므로 다른 모듈과 컴포넌트에 강한 결합을 지양해야하고 항상 자신의 sandbox에 요청하고 요청받은 내용을 처리해야한다.


#### Component
```javaScript
(function(ns){
	'use static';

	var setting = {
		selector:'[data-component-컴포넌트이름]'
	}
	var Component = function(){
		var Closure = function(){};
		Closure.prototype.init = function(){
			//component 초기화 로직
			this.fireEvent('init', this, ['param0', ...]);
		}
		ns.Observer.applyObserver(Closure);
		return new Closure();
	}

	ns.Components['component_컴포넌트이름'] = {
		constructor:Component,
		reInit:false,
		attrName:'data-component-컴포넌트이름'
	}
})(Core);
```
**setting** 컴포넌트의 재사용성을 위해 내부에서는 setting값을 참조한다.
**Closure** 상위 모듈 및 컴포넌트에서 참조할수 있도록 prototype 상속한다.
**컴포넌트이름** Core에 컴포넌트를 등록/참조 하기위한 ID 값
**constructor** 인스턴스될 대상 함수 반환
**reInit** 상위 관리권한 여부 ( 즉시 실행해야하는 경우가 있기에 추가 )
**attrName** DOM 엘리먼트에서 컴포넌트를 식별하기 위한 값
**fireEvent** 컴포넌트는 fireEvent로 상위 모듈 및 컴포넌트에 사용자 정의 이벤트를 던질수 있다.

하나의 모듈은 여러개의 컴포넌트를 가질수 있으며 각각의 컴포넌트를 관리한다.
컴포넌트는 `input, label, button` 처럼 엘리먼트의 가장 작은단위 또는 **container Component** 로 이벤트 및 현재상태를 상위 컴포넌트 및 모듈에 전달하는 역할을 한다.
그리고 모듈은 마크업과 강하게 결합되어 있기 때문에 모듈과 연결되어 있는 selector가 변경될 경우 모듈 자체도 수정해야하는 번거로움이 있기 때문에 컴포넌트를 적용하였다.
모듈은 컴포넌트의 이벤트를 받아 다른 컴포넌트의 값을 전달하거나 다른 모듈의 상태를 변경하는 있다.
> **container Component** 컴포넌트의 집합.

자 이제 **Application Core, sandbox, module, component**이 어떻게 적용되는지 Search 모듈 개발을 통해서 자세하게 알아보도록 하자.

### 3.Search 모듈개발
오픈소스 도로명주소 API [postcodify](https://www.poesis.org/postcodify/)를 이용하여 주소검색모듈을 개발을 해보면서 좀더 디테일한 개발 방법을 설명하겠다.

##### /dist/index.html
```html
<div class="input-group mb-3" data-module-search="{api://api.poesis.kr/post/search.php, errMsg:주소를 입력해주세요}">
	<input type="text" class="form-control" placeholder="예) 문래동 강서타워, 선유로 82" data-component-inputtextfield="">
	<div class="input-group-append">
		<button class="btn btn-outline-secondary" type="button">Button</button>
	</div>
</div>
<div class="list-group" data-module-searchlist="">
	<li class="list-group-item disabled">no result...</li>
</div>
```
마크업을 보면 **data-module-searchfield** 모듈에서 **data-component-inputTextField** 컴포넌트를 관리하고 있다.

##### /modules/_search.js
```javascript
(function(ns){
	ns.register('module_search', function(){
		var $this, args;
		var Method = {
			moduleInit:function(){
				$this = $(this);
				args = arguments[0];
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-search]',
					attrName:'data-module-search',
					moduleName:'module_search',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			distroy:function(){}
		}
	});
})(Core);
```

##### /modules/_searchList.js
```javaScript
(function(ns){
	ns.register('module_searchList', function(){
		var $this, args;
		var Method = {
			moduleInit:function(){
				$this = $(this);
				args = arguments[0];
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-searchList]',
					attrName:'data-module-searchList',
					moduleName:'module_searchList',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			distroy:function(){}
		}
	});
})(Core);
```

### 4.디렉터리 구조

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


## 회고
플랫폼을 어떻게 개발 해야할지가 중요했다. 플랫폼은 여러다양한 사람들이
내가 운영을 했었던 프로젝트들중 프레임워크를 사용한 프로젝트를 제외한 여러 라이브러리를 사용한 프로젝트에서는 코드의 재사용성이라는 것 자체가 불가능했다. 물론 자기가 개발한 코드들에서는 재사용을 하기 위해 짜겠지만
컴포넌트는 아주 작은 단위로 쪼개어 질때 가장 재사용이 가능한 상태로
2017년 겨울 커머스플렛폼을 개발하는 프로젝트에 참여하게 되었다. 무의 상태에서 새롭게 시작할 수 있는 아주 좋은 프로젝트였다.
