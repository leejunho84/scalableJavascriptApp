(function(ns){
	ns.register('module_searchlist', function(sandbox){
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
					selector:'[data-module-searchlist]',
					attrName:'data-module-searchlist',
					moduleName:'module_searchlist',
					handler:{context:this, method:Method.moduleInit}
				});
			},
			distroy:function(){}
		}
	});
})(Core);
