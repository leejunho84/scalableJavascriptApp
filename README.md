# 대규모 웹어플리케이션 개발을 위한 자바스크립트 구조

## 시작하며
구축과 운영에 꼭 필요한 확장성있는 웹어플리케이션을 구축하는 방법을 공유하고자한다. 이것은 정답이 아닌 구축과 운영의 결과물이며,
커머스 플랫폼을 개발완료와 1년 반의 운영에 대한 회고이다.

## 확장성있게 개발하기
웹어플리케이션을 개발하기에 앞서 Nicholas Zakas의 [JavaScript Application Architecture](https://www.slideshare.net/nzakas/scalable-javascript-application-architecture)보고 모듈을 정의 하였다.

Nicholas Zakas는 확장성있는 개발을 위해 몇가지 규칙을 제시 했다.
- 자신의 범위 밖의 DOM element에 접근하지 마라
- 전역객체를 생성/참조하지 마라
- 다른 모듈에 직접 접근하지 마라

즉 무분별한 전역객체 생성으로 오염을 막고, 모듈간 느슨한 참조를 통해 개발하여야한다.
아래의 다이어그램처럼 모듈은
- **각자 자신의 sandbox(IF)를 가지 있다.**
- **모듈의 생몀주기를 관리하는 Core application이 있다.
![Alt text](/architecture.png "sandbox architecture")



플랫폼을 어떻게 개발 해야할지가 중요했다. 플랫폼은 여러다양한 사람들이 
내가 운영을 했었던 프로젝트들중 프레임워크를 사용한 프로젝트를 제외한 여러 라이브러리를 사용한 프로젝트에서는 코드의 재사용성이라는 것 자체가 불가능했다. 물론 자기가 개발한 코드들에서는 재사용을 하기 위해 짜겠지만 
컴포넌트는 아주 작은 단위로 쪼개어 질때 가장 재사용이 가능한 상태로 



Nicholas Zakas의 sandbox design pattern을 보고 모듈과 컴포넌트의 관계를 정의 하였다.


### sandbox

샌드박스는 정해진 규칙으로 모듈과 모듈간 통신을 할수있게 통로역할을 하며 정적함수를 제공한다. 

```javascript

var Sandbox = function(){

    return {
        rtnJson:function(data, notevil){
            return UI.Utils.strToJson(data, notevil || true);
        },
        promise:function(){
            //로직
        }

```


### components

컴포넌트는 input, label, button 처럼 엘리먼트의 가장 작은단위 까지 쪼개서 . 최소단위는 재사용가능한 기능단위로 Atomic design과 같이 분자 단위이고 분자의 조합으로 유기체로 만들수도 있다. 

1. 이처럼 인풋컴포넌트와 버튼컴포넌트 그리고 검색api로 검색기능컴포넌트를 만들수 있다.

예) inputText.js - focusIn, focusOut 을 가진 컴포넌트
    button.js - click 이벤트를 가진 컴포넌트
    search.js - inputText 기능 + button 기능 + api


2. 컴포넌트들은 상위 모듈 및 컴포넌트에 이벤트와 자신의 현 상태를 보낼 수 있는 기능이 필요하여 사용자정의 이벤트를 각 컴포넌트에 주입하였다.

```javascript

_self.fireEvent('사용자정의 이벤트 이름', '바인드될 this' , '상태');

```


기본적인 컴포넌트 구조는 다음과 같다 :

```javascript

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
│   │    ├── header.js
│   │    ├── footer.js
│   │            
│   ├── components
│   │    ├── input.js
│   │    ├── radio.js
│   │    ├── select.js
│   │            
│   ├── vendor
│   │    ├── jquery
│   │    ├── bootstrap
│   │    ├── handlebars
│   │            .
│
└── css
    ├── layout.scss
    ├── contents.scss
    ├── header.scss
        .
        .


## 맷음말
2017년 겨울 커머스플렛폼을 개발하는 프로젝트에 참여하게 되었다. 무의 상태에서 새롭게 시작할 수 있는 아주 좋은 프로젝트였다.
