(function(ns){
	ns.register('module_search', function(sandbox){
		var $this, args;
		var Method = {
			moduleInit:function(){
				$this = $(this);
				args = arguments[0];

				var $btn = $this.find('.btn');
				var $msg = $this.find('.msg');
				var textfieldComponent = sandbox.getComponents('component_inputtextfield', {context:$this}, function(i){
					this.addEvent('inputFocusOut', function(val){
						console.log(this);
						console.log(val);
					});
				});

				$btn.click(function(e){
					e.preventDefault();
					if(textfieldComponent.getValue() !== ''){
						sandbox.promise({
							url:args.api,
							type:'GET',
							data:{'q':textfieldComponent.getValue()}
						}).then(function(data){
							console.log(data);
						}).fail(function(msg){
							console.log(msg);
						});
					}else{
						alert(args.errMsg);
					}
				});
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
