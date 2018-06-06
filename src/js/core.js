(function(Core){
	'use strict';

	if(typeof define === "function" && define.amd) {
		define("Core", [], function(){
			return Core();
		});
	}else{
		window['Core'] = Core();
	}
})(function(){
	'use strict';

	var UI = {}; // Core;
	var moduleData = {}; //module
	var moduleSelector = {};
	var Sandbox = function(){
		var args = Array.prototype.slice.call(arguments);
		var callback = args.pop();
		var modules = (args[0] && typeof args[0] === 'string') ? args:args[0];

		return {
			rtnJson:function(data, notevil){
				return UI.strToJson(data, notevil || true);
			},
			uiInit:function(data){
				return UI.moduleBehavior(data);
			},
			getModule:function(moduleID){
				return UI.getModule(moduleID);
			},
			getComponents:function(componentID, setting, callback){
				return UI.getComponents(componentID, setting, callback);
			},
			moduleEventInjection:function(strHtml, defer){
				UI.moduleEventInjection(strHtml, defer);
			},
			promise:function(opt){
				return UI.promise(opt);
			}
		}
	}

	UI.register = function(moduleID, creator){
		moduleData[moduleID] = {
			creator:creator,
			instance:null
		}
	}

	UI.init = function(moduleID){
		moduleData[moduleID].instance = moduleData[moduleID].creator(new Sandbox(this));
		moduleData[moduleID].instance.init();
		/*if(moduleData[moduleID].instance !== undefined && moduleData[moduleID].instance.init !== undefined && typeof moduleData[moduleID].instance.init == 'function'){

		}*/
	}

	UI.destroy = function(moduleID){
		var data = moduleData[moduleID];
		if(data.instance && moduleData[moduleID].instance.destroy !== undefined && typeof moduleData[moduleID].instance.destroy == 'function'){
			data.instance.destroy();
			delete data.instance;
		}
	}

	UI.initAll = function(){
		for(var moduleID in moduleData){
			if(moduleData.hasOwnProperty(moduleID)){
				this.init(moduleID);
			}
		}
	}

	UI.destroyAll = function(){
		for(var moduleID in moduleData){
			if(moduleData.hasOwnProperty(moduleID)){
				this.destroy(moduleID);
			}
		}
	}

	UI.getModule = function(moduleID){
		try{
			return moduleData[moduleID].instance;
		}catch(e){
			console.log(moduleID + ' - This module is not defined');
		}
	}

	UI.moduleBehavior = function(data){
		if($(data.selector).length <= 0) return;
		$(data.selector).each(function(i){
			if(data.hasOwnProperty('attrName')){
				if(data.attrName instanceof Array){
					data.handler.method.call(this, (function(){
						var obj = {};
						for(var i in data.attrName){
							obj[data.attrName[i]] = UI.strToJson($(this).attr(data.attrName[i]), true);
						}
						return obj;
					}.bind(this))());
				}else{
					data.handler.method.call(this, UI.strToJson($(this).attr(data.attrName), true));
				}
			}
		});
	}

	UI.getComponents = function(componentID, setting, callback){
		try{
			var _self = this;
			var component = this.Components[componentID];
			var $context = (setting && setting.context) ? setting.context : $('body');
			var attrName = (component.attrName instanceof Array) ? component.attrName[0] : component.attrName;
			var selector = (setting && setting.selector) ? setting.selector : '['+ attrName +']';
			var setting = (setting) ? setting : {};
			var arrComponent = [];
			var reInitIS = component.hasOwnProperty('reInit');

			if(component.hasOwnProperty('constructor') && component.hasOwnProperty('attrName')){
				$context.find(selector).each(function(i){
					var instance;
					var context = $(this).context;
					var indexOf = _self.CurrentComponentsContext.indexOf(context);
					setting['selector'] = this;

					if(indexOf > -1){
						instance = _self.CurrentComponents[indexOf].setting(setting);
					}else{
						instance = component.constructor().setting(setting).init((function(){
						    if(component.attrName instanceof Array){
						        var obj = {};
        						for(var i in component.attrName){
        							obj[component.attrName[i]] = _self.strToJson($(this).attr(component.attrName[i]), true);
        						}
        						return obj;
						    }else{
						        return _self.strToJson($(this).attr(component.attrName), true);
						    }
						}.bind(this))());
						_self.CurrentComponentsContext.push(context);
						_self.CurrentComponents.push(instance);
					}

					if(callback && typeof callback === 'function'){
						callback.call(instance, i, this);
					}

					arrComponent.push(instance);
				});
				return (arrComponent.length > 1) ? arrComponent : arrComponent[0];
			}else{
				component = null;
				setting = null;
				console.log(componentID + ' - constructor is not defined.');
			}

		}catch(e){
			console.log(e);
		}
	}

	UI.moduleEventInjection = function(strHtml, defer){
		if(!strHtml) return;
		var _self = this;
		var ID = this.arrSameRemove(strHtml.match(/data-(?:module|component)-+(?:\w|-)*/g)).sort();
		for(var i=0; i<ID.length; i++){
			var name = ID[i].replace(/data-/g, '').replace(/-/g, '_');
			var type = name.replace(/\_\w*/g, '');

			if(type === 'module'){
				try{
					if(this.getModule(name)){
						if(this.getModule(name).hasOwnProperty('destroy')){
							this.getModule(name).destroy();
							moduleData[name].instance = null;
							console.log(name, moduleData[name].instance);
						}
					}

					this.init(name);
					if(defer && this.getModule(name).hasOwnProperty('setDeferred')){
						this.getModule(name).setDeferred(defer);
					}

				}catch(e){
					console.log(e);
				}
			}else if(type === 'component'){
				try{
					var component = this.Components[name];
					if(component.hasOwnProperty('constructor') && component.hasOwnProperty('reInit') && component.reInit){
						_self.getComponents(name);
					}else{
						component = null;
					}
				}catch(e){
					console.log(e);
				}

			}
		}
	}

	UI.Components = {};
	UI.CurrentComponentsContext = [];
	UI.CurrentComponents = [];
	UI.Observer = {
		eventID:0,
		addEvent:function(type, handler){
			if(!this.listeners) this.listeners = {};
			if(!this.listeners[type]) this.listeners[type] = {};

			var eventID = this.eventID++;
			this.listeners[type][eventID] = handler;
			return eventID;
		},
		fireEvent:function(type){
			if(!this.listeners || !this.listeners[type]) return false;
			var handlers = this.listeners[type];
			var eventID;
			var args =  Array.prototype.slice.call(arguments);

			if(handlers.stop) return false;

			args.shift();
			for(eventID in handlers) {
				if(handlers.hasOwnProperty(eventID)){
					if(eventID !== "stop"){
						if(!handlers[eventID].stop){
							handlers[eventID].apply(args[0], args[1]);
						}
					}
				}
			}
		},
		removeEvent:function(type, hnd){
			if(!this.listeners || !this.listeners[type]) return -1;
			var handlers = this.listeners[type];
			if(typeof hnd === "function"){
				for(eventID in handlers) if(handlers.hasOwnProperty(f)){
					if(handlers[eventID] === hnd){
						delete handlers[eventID];
						break;
					}
				}
				return !handlers[eventID];
			}else{
				if(handlers[hnd]) delete handlers[hnd]
					return !handlers[hnd];
			}
		},
		applyObserver:function(tclass){
			for(var p in this){
				tclass.prototype[p] = this[p];
			};

			return true;
		}
	}

	UI.strToJson = function(str, notevil){
		try{
			// json 데이터에 "가 있을경우 변환할필요가 없으므로 notevil을 false로 변경
			if(str.match(/"/,'g') !== null) notevil = false;
			if(notevil) {
				return JSON.parse(str
					// wrap keys without quote with valid double quote
					.replace(/([\$\w]+)\s*:+([`~!@#$%^&*?():|_+=\/\w-#().\s가-힣/\[/\]]*)/g, function(_, $1, $2){
						if($2 !== ''){
							return '"'+$1+'":"'+$2+'"';
						}else{
							return '"'+$1+'":';
						}
					})
					//.replace(/([\$\w]+)\s*:+([`~!@#$%^&*()_=+|{};:,.<>?\s\w가-힣]*)/g, function(_, $1, $2){return '"'+$1+'":"'+$2+'"';})
					//replacing single quote wrapped ones to double quote
					.replace(/'([^']+)'/g, function(_, $1){return '"'+$1+'"';}));
			} else {
				return (new Function("", "var json = " + str + "; return JSON.parse(JSON.stringify(json));"))();
			}
		}catch(e){
			return false;
		}
	}

	UI.promise = function(opts){
		if(!opts.url) return false;

		var defer = $.Deferred();
		var promise = $.ajax({
			url:opts.url,
			type:opts.method || 'GET',
			data:opts.data || {},
			success:function(data){
				console.log(data);
				/*if(data.hasOwnProperty('result')){
					if(data.result){
						defer.resolve(data);
					}else{
						defer.reject(data.errorMessage);
					}
				}else{
					defer.resolve(data);
				}
				*/
			},
			error:function(data){
				defer.reject(data.responseText);
			}
		});

		return defer.promise();
	}


	UI.ajax = function(url, method, data, callback){
			//$('.dim').addClass('active');
			if(!isLoadingBar) UI.Loading.show();
			$.ajax({
				url:url,
				type:method||'POST',
        		dataType:dataType||'json',
				data:data,
				complete:function(data){
					//$('.dim').removeClass('active');

					_.delay(function(data){

						if(!isLoadingBar) UI.Loading.hide();
						if(data.status == 200 && data.readyState === 4 || isCustom ){
							callback(data);
						}else{
							UIkit.notify('error : ' + data.status, {timeout:3000,pos:'top-center',status:'danger'});
						}
					},( delay || 100 ), data);
				}
			});
		},

	UI.arrSameRemove = function(arr){
		if(arr === null) return [];
		return arr.reduce(function(a,b){
			if (a.indexOf(b) < 0 ) a.push(b);
			return a;
		},[]);
	}

	return UI;
});

$(document).ready(function(){
	var initDocument = $('body').html();
	Core.moduleEventInjection(initDocument);
});
