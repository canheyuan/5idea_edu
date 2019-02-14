/******************** Shell interface start ********************/
/*
iOS/Android外壳接口
Shell.init({funname1:arglength1,funname2:arglength2,...})
	初始化外壳方法，并将提供的方法名绑定到Shell上
	参数为方法列表，形式为 方法名:参数个数
Shell.call("funname",arg1,arg2...,callback)
	运行外壳的funname方法，参数arg1,arg2...，运行完毕的回调函数callback
	注意外壳方法可能是同步可能是异步执行，统一用回调函数来获取返回值callback(result)。如果不需要返回值则可省略callback
	有队列功能，多次call的话依次执行，前一个执行完了才会调用下一个
	本函数返回this，可链式调用
Shell.funname(arg1,arg2...,callback)
	外壳方法都绑定到Shell上 (除了跟上下几个“保留字”冲突的)
	相当于Shell.call("funname",arg1,arg2...,callback)的“快捷方式”
Shell.queue
	外壳正在执行的队列数组
Shell.executing
	外壳正在执行的方法名。无则空串
Shell.addListener(listener)
	添加外壳事件监听器，listener的形式为{event:"xxx",callback:function(){},scope:{}}
	其中event为事件名，callback为回调函数(可能带参数)，scope为调用callback的上下文(默认window)
	常用事件：
	EVENT_BACK_PRESSED		标题栏左侧按钮点击事件。如果100毫秒内没有调用 Shell.backHandled()，外壳会执行默认处理(通常是返回上个页面，或关闭)
	EVENT_ACTION_PRESSED	标题栏右侧按钮点击事件。
Shell.event(eventname,args...)
	提供给外壳的事件接口
Shell.getParameter(n)
	提供给外壳，获取参数n
Shell.done(result)
	提供给外壳的返回接口
*/
var Shell = new (function(){
	
	var isIOS = /(iPad|iPhone|iPod)/.test(navigator.userAgent);
	var isAndroid = /(Android|Silk)/.test(navigator.userAgent);
	
	var _this=this;
	this.queue=[];	//待执行方法的队列
	this.executing="";	//正在执行的方法名
	this.listeners={};	//监听器map，形式为{event1:[listener...],event2:[listener...]}
	var timer=null;
	
	var methods={	//外壳方法集合。形式为  方法名:参数个数
		checkNetworkStatus:0,
		closePage:0,
		backHandled:0,
		closeKeyboard:0,	//{arglength:0,isEnable:function(){return isAndroid}}
		getSessionId:0,
		setPageTitle:1,
		share:5,
		getLanguage:0	//当前语言
	};
	
	this.call=function(){
		if (arguments.length<1) return alert("Shell.call: method error");
		var method=arguments[0],methodInfo=methods[method],arglength;
		if (typeof method!="string"||method.length==0) return alert("Shell.call: method error");
		if (typeof methodInfo=="number")
			arglength=parseInt(methodInfo);
		else{
			arglength=parseInt(methodInfo.arglength);
			if (typeof methodInfo.isEnable=="function" && !methodInfo.isEnable()) return this;
		}
		if (isNaN(arglength)) return alert("Shell.call: method error");
		var i,args=[];
		for (i=1;i<arguments.length&&i<=arglength;i++)
			args.push(arguments[i]);
		var callback=arguments.length>arglength+1?arguments[arglength+1]:null;
		_this.queue.push({method:method,args:args,callback:callback});
		window.setTimeout(next,20);
		return this;
	};
	
	var next=function(){
		if (_this.executing!=""){
			if (timer) return;
			return timer=window.setTimeout(next,20);
		}
		if (timer){
			window.clearTimeout(timer);
			timer=null;
		}
		if (_this.queue.length)
			execute(_this.queue[0]);
	};
	
	var execute=function(op){
		_this.executing=op.method;
		if (isIOS){			//iOS
			var i,a=[];
			for (i=0;i<op.args.length;i++){
				a.push(escape(op.args[i].toString()));	//转为string然后escape
				if (a[i].length>30) a[i]="("+i+")";		//参数长度大于30则变为(i)形式，让外壳再去获取
			}
			location.href="objc://"+op.method+(i?":"+a.join(":"):"");
		}else{				//Android
			var res;
			try{
				res=window.Android[op.method].apply(window.Android,op.args);	//要求外壳返回 {"async":false,"result":xxx} 或者 {"async":true}
				res=JSON.parse(res);
			}catch(e){
				console.log(e);
				alert("此版本不支持，请安装最新版本。");
			}
			if (!res||typeof res.async!="boolean"){
				outQueue();
			} else if (!res.async){
				_this.done(res.result);		//外壳同步执行，这里手动调用done
			}
		}
	};
	
	this.getParameter=function(n){
		return _this.queue[0].args[n];
	};
	
	this.done=function(res){
		var op=outQueue();
		if (typeof op.callback=="function"){
			if ((isAndroid) && typeof res=="undefined")
				res=window.Android.getOperationResult();
			if (res&&typeof res=="string")
				try{res=JSON.parse(res);}catch(e){;}
			op.callback(res);
		}
	};
	
	var outQueue=function(){
		_this.executing="";
		var op=_this.queue.shift();
		if (_this.queue.length) window.setTimeout(next,50);	//延时执行，以免外壳嵌套调用
		return op;
	};
	
	this.event=function(eventname){
		var list=_this.listeners[eventname];
		if (!list) return;
		var args=[];
		for (i=1;i<arguments.length;i++)
			args.push(arguments[i]);
		for (var i in list)
			list[i].callback.apply(list[i].scope&&typeof(list[i].scope)=="object"?list[i].scope:window,args);
	};
	
	this.addListener=function(listener){
		if (!listener||!listener.event||typeof(listener.event)!="string"||!listener.callback||typeof(listener.callback)!="function"){
			return alert("Shell.addListener: argument error");
		}
		var list=_this.listeners[listener.event];
		if (!list) list=[];
		list.push(listener);
		_this.listeners[listener.event]=list;
	};
	
	this.init=function(methods2){
		//把参数的methods2合并到methods
		if (methods2&&typeof(methods2)=="object"){
			for (var m in methods2)
				methods[m]=methods2[m];
		}
		
		//添加外壳方法的“快捷方式”，把methods里的方法绑定到this上
		for (var m in methods){
			if (typeof this[m]=="undefined"){
				//this[m]=this.call.bind(this,m);	//手机浏览器不一定支持bind
				this[m]=(function(m){
					return function(){
						var i,args=[m];
						for (i=0;i<arguments.length;i++)
							args.push(arguments[i]);
						return _this.call.apply(_this,args);
					};
				})(m);
			}
		}
	};
	
})();
/******************** Shell interface end ********************/



/*
//初始化，可以添加外壳方法，形式为  {方法名:参数个数}
Shell.init();


//以下为调用例子：

//关闭软键盘
Shell.closeKeyboard();

//设置页面标题栏
var param = {
	name: "punch-card",
	title: "每日打卡",
	leftIcon: "back",		//or "close" ，缺省即back
	rightText: "如何打卡",		//不设此项则不显示右侧文字按钮
	rightTextColor: "#ff0000",
	rightTextIcon: "question",	//or "book"
	backgroundColor: "#ffffff"	//不设则默认白色
}
Shell.setPageTitle(JSON.stringify(param));

//获取用户sessionId，以回调函数的方式获取返回值
Shell.getSessionId(function(res){
	sessionId = res;
});

//分享
Shell.share(title, content, image, link, category);

//监听返回键事件
Shell.addListener({event:"EVENT_BACK_PRESSED",callback:function(){
	//do something
	Shell.backHandled();		//通知外壳，这次返回事件已经处理过了。一般而言返回事件在源生端有默认处理（返回上一页或关闭页面），js不需监听此事件处理。
}});

//监听标题栏右侧按键事件
Shell.addListener({event:"EVENT_ACTION_PRESSED",callback:function(){
	//do something
}});
*/