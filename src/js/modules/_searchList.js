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
			rendering:function(data){
				Method.render(data);
			},
			distroy:function(){}
		}
	});
})(Core);
