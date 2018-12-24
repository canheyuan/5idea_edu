let common = {
	apiUrl : 'http://192.168.0.244:8090',	//接口前缀
	tipShow: true,	//是否显示打印消息
	//通用的ajax调用
	ajaxFn : (options) => {
		let opt = options ? options : null;
		let opt_default = {
		  isLoading:true,
		  isCloseLoad:true,
		  loadTitle: '数据加载中',
		  url: '', //前缀不用写
		  processData: 'application/json', //另一种（application/x-www-form-urlencoded）
		  type: 'GET',
		  data: {},
		  dataType: 'json',
		  jsonp:null,
		  jsonpCallback:null,
		  async : true,	//是否异步加载
		  success: null,  //成功回调函数
		  error: null,     //失败回调函数
		  complete: null   //调用接口完回调函数
		};
		opt = opt ? Object.assign(opt_default, opt) : opt_default;	//合并两个对象
		
		if(opt.isLoading){ $('#loading').show(); }
		$.ajax({
			url : common.apiUrl + opt.url,
			data: opt.data,
			type: opt.type,
			dataType: opt.dataType,
			async: opt.async,
			processData: opt.processData,
			success: (res)=>{
				if(opt.isCloseLoad){$('#loading').hide();}
				if(res.code == 0){
					
				  	opt.success && opt.success(res);	//成功执行
					
				 }else{
					 
					 common.addTocarTips(res.msg);
					 
				 }
			},
			error: (res) =>{
				//获取数据失败
				$('#loading').hide();
				common.addTocarTips(res.msg);
				opt.error && opt.error(res);
			},
			complete: (res) =>{
				//不管成功与否都执行
				opt.complete && opt.complete();
			}
		});
	},
	
	//提示信息弹出
	addTocarTips: (txt, speed) => {
		var _id = $('<div id="J-tips"></div>'), speed = speed || 3000, timer, txt = txt || '';
		_id.html(txt).css({
			'fontSize': '0.3rem', 'width': '70%', 'padding': '0.3rem 0rem', 
			'background': 'rgba(0,0,0,0.6)', 'color': '#fff', 'position': 'fixed',
			'top': '50%','borderRadius':'6px','textAlign': 'center', 'left': '15%', 'zIndex':9999, 'display': 'none'
		});
		 _id.appendTo($('body')).css('display','block') ;
		setTimeout(function(){ _id.remove(); },speed);
	},
	
	loading:(b)=>{
		var html = `<div class="loading" id="loading" style="display:none;">
					  <div class="spinner-container container1">
						<div class="circle1"></div>
						<div class="circle2"></div>
						<div class="circle3"></div>
						<div class="circle4"></div>
					  </div>
					  <div class="spinner-container container2">
						<div class="circle1"></div>
						<div class="circle2"></div>
						<div class="circle3"></div>
						<div class="circle4"></div>
					  </div>
					  <div class="spinner-container container3">
						<div class="circle1"></div>
						<div class="circle2"></div>
						<div class="circle3"></div>
						<div class="circle4"></div>
					  </div>
					</div>`;
		$('body').append(html);
	},
	
	//验证手机号
	phoneregFn : (phone) => {
	  const reg = /^(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/;
	  return reg.test(phone);
	},
	init:()=>{
		common.loading();
	}
};
common.init();

//点击:active效果
document.addEventListener("touchstart", function(){}, true);






