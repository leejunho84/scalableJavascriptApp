## 대규모 웹어플리케이션 개발을 위한 자바스크립트 구조

### 1.시작하며
확장성있는 개발은 코드의 재사용성을 높이는 동시에 운영 cost를 줄이는 일이기도 하다. Nicholas Zakas는 확장성있는 개발을 위해 몇가지 규칙을 제시 하였는데 그가 말하는 내용을 토대로
구축과 운영에 꼭 필요한 확장성있는 웹어플리케이션 개발방법을 공유하고자한다. 이것은 정답이 아닌 구축과 운영의 결과물이다.

참고자료 Nicholas Zakas의 [JavaScript Application Architecture](https://www.slideshare.net/nzakas/scalable-javascript-application-architecture)

### 2.확장성있게 개발하기
확장성있게 개발하기 위해서는 아래 3가지의 규칙은 따라야한다고 한다.
- 자신의 범위 밖의 DOM element에 접근하지 마라
- 전역객체를 생성/참조하지 마라
- 다른 모듈에 직접 접근하지 마라

모듈의 사전적 정의는 어플리케이션의 전체구조 일부의 독립적인 기능단위이다. 서비스마다 필요한 모듈의 조합으로 만들어 질수있는데 모듈이 강하게 결합되어 있다면 각각의 모듈이 서비스로서 수행되기 위해 재사용되는 어려움이 있다. 그래서 모듈간 의존성을 관리해주어야 한다. 즉 무분별한 전역객체 생성으로 오염을 방지하고, 모듈간 느슨한 참조위해 각각 자신의 sandbox(IF)가지며, 모듈의 생명주기를 중앙에서 관리를 해야한다는 말과 같다. 우리는 그것을 줄이기위해 노력해 왔지만 어떠한 규칙없이 개발을 하다보면 처음의 의도와는 다르게 다른방향으로 개발이 진행될 가능성이 높다. 따라서 아래의 다이어그램을 보면서 규칙을 정하고 그 규칙대로 어플리케이션 개발을 진행하겠다.

![Alt text](/architecture.png "sandbox architecture")

다이어그램이 말하는 메시지중 중요한것은 module은 sandbox를 가지고 있다는 점인데 이것을 어떻게 구현을 해야할지는 각자가 해석하는 방향에따라 달라질 수 있을것이다. 필자는 module에 sandbox(IF)를 파라미터로 보내 sandbox를 참조할수있게 하였으며 module단위 개발을 하되 module의 하위로 component를 추가하였다.

module은 sandbox(IF)를 가지고 base Library를 참조할수 있으며 여러개의 component를 가질수 있다. 또한 component의 이벤트를 받아 다른 component의 값을 전달하거나 다른 module의 상태를 sandbox(IF)를 통해 변경할수 있다.

component는 `input, label, button` 처럼 엘리먼트의 가장 작은단위 또는 **container Component** 로 이벤트 및 현재상태를 상위 component 및 module에 전달하는 역할을 한다.

> **container Component** 컴포넌트의 집합.

이 규칙을 가지고 sandbox, application Core, module, component를 정의 해보도록 해보자.

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
sandbox는 interface를 제공하여 module간 의존성을 느슨하게 만들어 독립성을 보장해 주는 역할을 한다.

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

Core.price = function(price){},
Core.ajax = function(url, method, data, callback){},
Core.promise = function(opt){},
...
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
module은 항상 sandbox를 통해 다른 module을 참조하거나 library를 사용할수있다.
- **module name** module을 식별값를 입력 한다.
- **attrName** 모듈의 attribute값을 가져온다 단일 및 배열을 넣을수 있다.
- **handler** 모듈의 초기 설청 {context:'바인드될 this', method:'초기화 함수'}
- **initial function** 모듈 초기화 함수

#### Component
```javaScript
(function(ns){
	'use static';

	var setting = {
		selector:'[data-component-component name]'
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

	ns.Components['component_component name'] = {
		constructor:Component,
		reInit:false,
		attrName:'data-component-컴포넌트이름'
	}
})(Core);
```
- **setting** component의 재사용성을 위해 내부에서는 setting값을 참조한다.
- **Closure** 상위 module 및 component에서 참조할수 있도록 prototype 상속한다.
- **컴포넌트이름** Core에 component를 등록/참조 하기위한 ID 값
- **constructor** 인스턴스될 대상 함수 반환
- **reInit** 상위 관리권한 여부 ( 즉시 실행해야하는 경우가 있기에 추가 )
- **attrName** DOM 엘리먼트에서 component를 식별하기 위한 값
- **fireEvent** component는 fireEvent로 상위 module 및 component에 사용자 정의 이벤트를 던질수 있다.

운영중에 나타난 상황중 component는 작은단위(input, button, label)로 나눌수록 수정이 용이하였고 component 내에 비지니스로직이 있을경우 재사용하는데에 여려움이 있었다.
따라서 작은단위의 컴포넌트 일수록 상위component로 이벤트를 던지는 기능을 가질뿐 그외에 로직추가를 지양해야한다. 그외에 로직을 추가 해야한다면 하위component를 가지는 **container component**를 만들어 사용하는것이 좋다.

자 이제 **Application Core, sandbox, module, component**이 어떻게 적용되는지 Search 어플리케이션 개발을 통해서 자세하게 알아보도록 하자.

### 3.Search 어플리케이션 개발
오픈소스 도로명주소 API [postcodify](https://www.poesis.org/postcodify/)를 이용하여 주소검색모듈을 개발을 해보면서 좀더 디테일한 개발 방법을 설명하겠다.

##### /dist/index.html
```html
<div class="container">
	<!--/* search module */-->
	<div class="search-container" data-module-search="{api://api.poesis.kr/post/search.php, errMsg:주소를 입력해주세요}">
		<h5>module-search</h5>
		<div class="input-group mb-3" data-component-inputtextfield="">
			<input type="text" class="form-control" placeholder="예) 문래동 강서타워, 선유로 82">
			<div class="input-group-append">
				<button class="btn btn-outline-secondary" type="button">Button</button>
			</div>
		</div>
	</div>

	<!--/* searchList module */-->
	<h5>module-searchlist</h5>
	<div id="search-list" class="search-list-container" data-module-searchlist="{target:#search-list}">
		<template v-if="items.length > 0">
			<a v-for="item in items"
				v-bind:item="item"
				v-on:click="itemselect"
				href="#" class="list-group-item list-group-item-action">
				<span class="zip-code">{{item.postcode5}}({{item.postcode6}})</span>
				<span class="doro">{{item.ko_doro}} {{item.en_doro}}</span>
				<span class="jibeon">{{item.ko_jibeon}} {{item.en_jibeon}}</span>
			</a>
		</template>
		<template v-else>
			<div>no result...</div>
		</template>
	</div>
</div>
```
![Alt text](/module-diagram.png "search module diagram")

**module-search**에서 **component-inputtextfield**를 관리하고 있고, **module-search**에서 **sandbox**를 통해 **module-searchlist** 검색된 주소리스트를 보내고 처리한다.

##### /modules/_search.js
```javascript
(function(ns){
	ns.register('module_search', function(sandbox){
		var $this, args;
		var Method = {
			moduleInit:function(){

				//바인드된 this는 DOM Object
				$this = $(this);

				//data-module-search attribute 값
				args = arguments[0];

				var $btn = $this.find('.btn');
				var $msg = $this.find('.msg');

				//component_inputtextfield 컴포넌트선언
				//getComponents('컴포넌트이름', 'setting', 'collbackFunc')
				//setting은 컴포넌트에 선언된 setting값을 override한다.
				var textfieldComponent = sandbox.getComponents('component_inputtextfield', {context:$this}, function(i){

					//컴포넌트에서 선언된 fireEvent를 구독한다.
					//예) fireEvent('customClick', this, [param0, ...]);
					/*this.addEvent('customClick', function(param0){
						console.log(this); --> fireEvent에서 적용한 this가 바인딩된다.
						...
					});*/
					this.addEvent('submitKeyword', function(val){
						if(val === ''){
							alert('검색어를 입력해주세요');
							return false;
						}

						//도로명주소 api 호출
						sandbox.promise({
							url:args.api,
							method:'GET',
							data:{'q':val}
						}).then(function(data){
							//sandbox를 통해 다른 모듈의 홤수를 호출할 수 있다.
							//searchclist 모듈의 rendering에 주소리스트를 보낸다.
							sandbox.getModule('module_searchlist').rendering(data);
						}).fail(function(data){
							console.log(data)
						});
					});
				});
			}
		}

		return {
			//모듈 초기화
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-search]', //모듈의 최상위 컨테이너
					attrName:'data-module-search',	//attribute 선언 string or Array ( ['data-module-search', 'data-opt-search'] )
					moduleName:'module_search', //모듈 이름
					handler:{context:this, method:Method.moduleInit} //Method.moduleInit의 this는 context:this다.
				});
			},
			//모듈 해제
			distroy:function(){}
		}
	});
})(Core);
```
module-search에서 하는 일은 inputtextfield에서 받은 값을 가지고 주소API를 통해 받은 주소목록을 module-searchlist에 보내는 간단한 일을 한다.
또한 module은 정의된 attribute값( {api://api.poesis.kr/post/search.php, errMsg:주소를 입력해주세요} )을 argument로 받아 사용할수 있다.

##### /modules/_searchList.js
```javaScript
(function(ns){
	ns.register('module_searchlist', function(sandbox){
		var $this, args, searchItems = {};
		var Method = {
			moduleInit:function(){
				$this = $(this);
				args = arguments[0];
				searchItems = {
					items:[]
				}

				//vue 컴포넌트
				var searchListComponent = new Vue({
					el:args.target,
					data:searchItems,
					methods:{
						itemselect:function(e){
							console.log(this);
							console.log(this.$el);
						}
					}
				});
			},
			//search 모듈에서 보낸 주소목록을 갱신한다.
			render:function(data){
				searchItems.items = data.results;
			}
		}

		return {
			init:function(){
				sandbox.uiInit({
					selector:'[data-module-searchlist]',
					attrName:'data-module-searchlist',
					moduleName:'module_searchlist',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			//모듈의 기능에 따라 외부접근을 허용하는 함수를 추가
			rendering:function(data){
				Method.render(data);
			},
			distroy:function(){}
		}
	});
})(Core);
```
module-searchlist은 module-search에서 보낸 주소목록을 받아서 자신이 관리하는 component 및 DOM Object를 갱신하는 일을 한다.

##### /components/_inputTextField.js
```javaScript
(function(ns){
	'use static';

	var $this, $input, $btn;

	//기본 초기화 세팅 값
	//상위모듈 및 컴포넌트에서 해당 값을 override하면 그 값에 따라 변경된 상태로 세팅이 가능하다.
	var setting = {
		selector:'[data-component-inputtextfield]',
		textField:'input',
		btn:'.btn'
	}
	var InputTextField = function(){

		//
		var Closure = function(){};
		Closure.prototype.setting = function(){
			var opt = Array.prototype.slice.call(arguments).pop();
			$.extend(setting, opt);
			return this;
		}
		Closure.prototype.init = function(){
			//컴포넌트 초기화
			var _self = this;
			args = arguments[0]; //컴포넌트 attribute값을 받는다.
			$this = $(setting.selector);
			$input = $(setting.textField);
			$btn = $(setting.btn);

			//이벤트 선언
			//컴포넌트는 상위 모듈 및 컴포넌트에 이벤트를 전달하는 역할을 하는데
			//core의 appliyObserver로 prototype 상속받은 fireEvent를 사용한다.
			$input.on({
				'focusout':function(){
					//inputFocusOut 이벤트 등록 this는 $input이고 $input.val()값을 보내고 있다.
					_self.fireEvent('inputFocusOut', this, [$(this).val()]);
				},
				'keyup':function(e){
					if(e.keyCode === 13){
						$btn.trigger('click');
					}
				}
			});

			$btn.click(function(e){
				e.preventDefault();
				//submitKeyword 이벤트 등록 this는 $btn이고 $input.val()값을 보내고 있다.
				_self.fireEvent('submitKeyword', this, [$input.val()]);
			});

			return this;
		}
		Closure.prototype.getValue = function(){
			return $input.val();
		}

		//Core.Observer를 통해 addEvent, fireEvent, removeEvent, applyObserver를 상속받는다.
		ns.Observer.applyObserver(Closure);
		return new Closure();
	}

	ns.Components['component_inputtextfield'] = {
		constructor:InputTextField, //컴포넌트 생성자 함수
		reInit:false, //reInit은  
		attrName:'data-component-inputtextfield' //attribute 값, 배열로도 넘길수 있다.
	}
})(Core);
```
component의 fireEvent는 module 및 상위 container component와 1:n의 관계를 가질 수 있어 등록한 모두에게 이벤트가 전달된다.
단, 1:n의 관계는 `자신의 범위 밖의 DOM element에 접근하지 마라` 및 `다른 module에 직접 접근하지 마라`의 두가지 규칙에 어긋나는 형태이므로 지양한다. 원칙적으로 해당 component를 관리하는 module의 sandbox를 통해 받아야한다.

### 4.디렉터리 구조
```
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
│   │    ├── vue
│   │            .
│
└── css
    ├── search.scss
    ├── postlist.scss
        .
        .
```

### 5.정리하며
module은 sandbox를 통해 하위 component와 다른 module을 참조할수 있으며 component는 상위 module 및 component에 이벤트를 전달하는 역할을 한다. 또한 비지니스로직이 들어가야 되지만 component는 이벤트를 던지는 기능외에 로직이 들어갈경우 재사용성이 떨어지기때문에 하위component를 가지는 **container component**를 만들어 재사용성을 높이는 일이 필요하다.

앞으로 운영을 하면서 발견되는 불편함 그리고 버그들을 수정하면서 앞으로 발전방향에 대해 고민을 해본다. 그중 어플리케이션이 점점 커지게 되어 모듈이 수천가지가 되었을때 하나의 파일로 묶인 커다란 js파일을 받는것은 너무나 비효율적일 것이다. 따라서 Code Splitting 통해 필요한 모듈만 비동기로 처리되는 방식이 필요하다. 앞으로 이러한 기능들이 추가되고 수정되면서 지금보다 더 발전되는 모습을 기대해본다.
