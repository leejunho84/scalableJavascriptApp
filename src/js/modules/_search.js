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
					this.addEvent('submitKeyword', function(val){
						if(val === ''){
							alert('검색어를 입력해주세요');
							return false;
						}
						sandbox.promise({
							url:args.api,
							type:'POST',
							data:{'q':val}
						}).then(function(data){
							console.log(data);
						}).fail(function(data){
							//console.log(data)
						});
					});
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
