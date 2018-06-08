(function(ns){
	'use static';

	var $this, $input, $btn;
	var setting = {
		selector:'[data-component-inputtextfield]',
		textField:'input',
		btn:'.btn'
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
			$this = $(setting.selector);
			$input = $(setting.textField);
			$btn = $(setting.btn);

			$input.on({
				'focusout':function(){
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
				_self.fireEvent('submitKeyword', this, [$input.val()]);
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
