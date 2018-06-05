(function(ns){
	'use static';

	var $input;
	var setting = {
		selector:'[data-component-inputtextfield]'
	}
	var InputTextField = function(){
		var Closure = function(){};
		Closure.prototype.setting = function(){
			var opt = Array.prototype.slice.call(arguments).pop();
			$.extend(setting, opt);
			return this;
		}
		Closure.prototype.init = function(){
			var _self = this;
			args = arguments[0];
			$input = $(setting.selector);
			$input.on({
				'focusout':function(){
					_self.fireEvent('inputFocusOut', this, [$(this).val()]);
				}
			});
			return this;
		}
		Closure.prototype.getValue = function(){
			return $input.val();
		}
		ns.Observer.applyObserver(Closure);
		return new Closure();
	}

	ns.Components['component_inputtextfield'] = {
		constructor:InputTextField,
		reInit:false,
		attrName:'data-component-inputtextfield'
	}
})(Core);
