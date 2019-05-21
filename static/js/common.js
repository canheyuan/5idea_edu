
let vm = null;	//vue实例
var countTimer = null;	//测试题-计算做题定时器
let common = {
	//获取地址参数值
	GetQueryStringFn:(name) => {
		 var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
		 var r = window.location.search.substr(1).match(reg);
		 if(r!=null)return decodeURIComponent(r[2]); return null;
	},
	isTest:false,	//是否测试环境
	shareId : null,	//记录是否是分享页面，是的话就不用获取sessionid
	//apiUrl : location.protocol+'//'+location.host,	//接口前缀
	//apiTestUrl : 'http://192.168.0.244:8090',	//接口前缀
	apiUrl : 'http://192.168.0.244:8090',	//接口前缀
	sessionId : '',	//用户id
	currentLang : '',	//当前语言
	langDatas : null,	//当前语言的json文件
	tipShow : true,	//是否显示打印消息
	vueIsLoad : false,
	
	//通用的ajax调用
	ajaxFn : (options) => {
		let opt = options ? options : null;
		let opt_default = {
		  isLoading:true,
		  isCloseLoad:true,
		  isAddPrefix:true,
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
			url : (opt.isAddPrefix?common.apiUrl:'') + opt.url,
			headers:{
				'5idea-sid':common.sessionId
			},
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
	
	//加载loading
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
	
	//获取语言
	langTag : (lang,callback) => {
		var lang = lang.toUpperCase();
		$.ajax({
			url : `static/lang/${lang}.json`,
			type: 'get',
			dataType: "json",
			success: (res)=>{
				//若无加载到语言文件，就加载英文
				if(!res){
					common.currentLang = 'en';
					common.langTag('en',function(){
						callback && callback();
					})
					return;
				}
				common.langDatas = res;
				callback && callback();
			},
			error:()=>{
				//若无加载到语言文件，就加载英文
				common.currentLang = 'en';
				common.langTag('en',function(){
					callback && callback();
				})
			}
		});
	},
	
	//获取手机系统语言
	getSystemLang:()=>{
		var language = (navigator.appName == 'Netscape') ? navigator.language : navigator.browserLanguage;
		language = language?language:'en';
		var result;
		if(language.indexOf('zh') > -1){result = 'zh';}	//中国
		else if(language.indexOf('ar') > -1){result = 'ar';}	//阿拉伯
		else if(language.indexOf('ja') > -1){result = 'ja';}	//日本
		else if(language.indexOf('ko') > -1){result = 'ko';}	//韩国
		else if(language.indexOf('de') > -1){result = 'de';}	//德国
		else if(language.indexOf('es') > -1){result = 'es';}	//西班牙
		else if(language.indexOf('fr') > -1){result = 'fr';}	//法国
		else if(language.indexOf('ru') > -1){result = 'ru';}	//俄罗斯
		//其他语音一个一个列出来
		else{result = 'en';}
		return result;
	},
	
	//运行Vue实例
	vueExample:()=>{

		vm = new Vue({
			el: '#app',
			data: {
				"langData":common.langDatas,	//语言json数据
				"currentLang":common.currentLang,
				
				/*---------------- 打卡模块_S ---------------*/
				"punchCardPop":false,	//打卡成功弹窗
				"checkData":{}, 	//查询打卡信息
				"guideData":'',		//打卡指引
				"targetTimes":[
					{min:'5',bgColor:'#ffc10a'},
					{min:'10',bgColor:'#35afff'},
					{min:'15',bgColor:'#ff5555'},
					{min:'30',bgColor:'#39d9e4'},
					{min:'45',bgColor:'#f271ea'},
					{min:'60',bgColor:'#94d070'}
				],	//打卡目标时间
				targetTimeIndex:0,	//当前的打卡目标索引
				
				/*---------------- 分享_S ---------------*/
				//查询口语课分享信息
				"checkSpoken":{
					"chapterName" : {}
				},	
				"shareMediaUrl":'',	//当前播放的音频地址
				//查询配音课分享信息
				"checkShareData":{
					"chapterName" : {}
				},
				reportData:[],
				
				/*---------------- 测试题_S ---------------*/
				startPop:true,	//开始弹窗是否显示
				subjectIsShow:false,	//题目是否显示
				submitStatus:false,	//是否处于提交状态（防止提交中多点选项）
				isPauseSubject:false,	//是否点击暂停做题
				examStatus:false,	//判断是否在做题状态
				isPlayStatus:false,	//是否在播放状态
				remainingTime:10,	//做题剩余时间
				subjectData:{},	//测试题数据
				subjectItem:{},	//当前测试题数据
				subjectIndex:0,	//当前测试题索引
				subjectStore:3,	//当前级别分数
				currentAudioList:[],	//当前播放音频列表
				currentaudioIndex:0,	//前播放音频的所有
				currentAudioUrl:'',	//当前的音频地址
				
				
			},
			methods:{
				/*---------------- 打卡模块_S ---------------*/
				//打卡操作
				punchCardFn(checkData){
					if(checkData.status == 0 && checkData.studiedTime > checkData.targetTime){
						punchCard();
					}
				},
				//关闭打卡成功弹窗
				closePunchCardPopFn(){
					vm.punchCardPop = false;
					punchCheck();
				},

				//打卡目标
				changeTargetTimeFn(changeTime,index,ev){
					console.log('切换',changeTime,index,ev);	
					vm.checkData.targetTimeMinute = changeTime;
					vm.targetTimeIndex = index;
				},
				//改变每日提醒状态
				tipChangeFn(remind){
					var statusCode = (remind==0)?1:0;
					punchTipStatusFn(statusCode);
				},
				/*---------------- 打卡模块_End ---------------*/
				
				/*---------------- 分享_Start ---------------*/
				//点击播放音频段落
				playAudio(type,index){
					var spokenAudio = $('#spokenAudio').get(0);
					var audioData = vm.checkShareData.paraList[index];
					
					if(type == 'user'){
						if(!audioData.userAudio){return;};
					   	if(audioData.userAudio == vm.shareMediaUrl ){
						   if(audioData.isUserPlay){
								spokenAudio.pause();  
							}else{
								spokenAudio.play();  
							}
						   	audioData.isUserPlay = !audioData.isUserPlay;
					   	}else{
							vm.checkShareData.paraList.forEach(item=>{
								item.isUserPlay = false;
								item.isParaPlay = false;
							});
							
						   	vm.shareMediaUrl = audioData.userAudio;
						   	audioData.isUserPlay = true;
						   	setTimeout(function(){
								spokenAudio.play();
							},100)
					   	}
					}else if(type == 'para'){
						if(!audioData.paraAudio){return;}
						if(audioData.paraAudio == vm.shareMediaUrl ){
							if(audioData.isParaPlay){
								spokenAudio.pause();  
							}else{
								spokenAudio.play();  
							}
							audioData.isParaPlay = !audioData.isParaPlay;	
						}else{
							vm.checkShareData.paraList.forEach(item=>{
								item.isUserPlay = false;
								item.isParaPlay = false;
							});
							vm.spokenAudioUrl = audioData.paraAudio;
							audioData.isParaPlay = true;
							setTimeout(function(){
								spokenAudio.play();
							},100)
						}
					}
				},
				
				
				/*---------------- 测试题_S ---------------*/
				//开始做题
				startSubject(){
					var _this = this;
					var cirqueBox = $('#cirqueBox').get(0);
					vm.subjectItem = vm.subjectData.level2[0];
					setTimeout(()=>{
						_this.subjectPlayAudio(vm.subjectItem.audioList);
					},1000);
					vm.startPop = false;
					vm.subjectIsShow = true;
					cirqueBox.addEventListener("animationiteration", function(){
						vm.examStatus = false;
						console.log('监听css动画重新开始');
					});
					
					//监听播放结束事件
					var subjectAudioObj = $('#subjectPlayAudio').get(0);
					subjectAudioObj.addEventListener("ended",function(){
						vm.isPlayStatus = false;
						var audioIndex = vm.currentaudioIndex;
						var audioList = vm.currentAudioList;
						if(audioList.length==1){
							vm.examStatus = true;
							clearInterval(countTimer);
							vm.remainingTime = 10;
							_this.countTime();
							return;
						};
						audioIndex++;
						vm.currentaudioIndex = audioIndex;
						if(audioIndex < audioList.length){ 
							vm.subjectItem.options[audioIndex-1].isPlayAudio = true;
						   	vm.currentAudioUrl = audioList[audioIndex];
							var timer = setInterval(()=>{
								if(!vm.isPauseSubject){
									clearInterval(timer);
									subjectAudioObj.play();  
								}
							},1000);
						}else{
							clearInterval(countTimer);
							vm.currentaudioIndex = 0;
							vm.examStatus = true;
							vm.remainingTime = 10;
							_this.countTime();
						}
					},false);
				},
				
				//暂停/开始做题(是否播放)
				pauseSubject(){
					var _this = this;
					var subjectAudioObj = $('#subjectPlayAudio').get(0);
					if(vm.isPauseSubject){
						vm.examStatus = true;
						vm.isPauseSubject = false;
						if(vm.isPlayStatus){
							subjectAudioObj.play();
							_this.countTime();
						}
					}else{
						clearInterval(countTimer);
						subjectAudioObj.pause();
						vm.examStatus = false;
						vm.isPauseSubject = true;
					}
				},
				
				//计算做题时间
				countTime(){
					countTimer = setInterval(()=>{
						if(vm.remainingTime<=0){
							clearInterval(countTimer);
							this.skipNextSubject();	//超时进入下一题  
						}else{
							vm.remainingTime--;
						}
					},1000);
				},
				
				//测试题播放音频
				subjectPlayAudio(audioUrl){
					var _this = this;
					var subjectAudioObj = $('#subjectPlayAudio').get(0);
					var audioList = audioUrl.split(',');
					vm.currentAudioList = audioList;
					vm.currentAudioUrl = audioList[0];
					setTimeout(()=>{
						if(!vm.isPauseSubject){
							subjectAudioObj.play();
							vm.isPlayStatus = true;   
						 }
					},100);
					
				},
				
				//选择答案(点击选项的索引)
				subjectChoiceFn(cIndex){
					var subjectItem = vm.subjectItem;
					var subjectType = subjectItem.questionType;	//当前题目的类型
					var currentCheck = subjectItem.options[cIndex].isChecked;
					if(currentCheck || vm.submitStatus){
						return;
					}else{
						subjectItem.options[cIndex].isChecked = true;
					}
					
					//完型填空题，把选项添加到题目中
					if(subjectType == 5 ){
						var isFirst = true;	
					   	subjectItem.contentArr.forEach((item,index)=>{
						   if(item.answerIndex==='' && isFirst){
							  	item.answerIndex = cIndex;
							   	subjectItem.contentNum++;
								if(	subjectItem.contentNum >= subjectItem.contentArr.length-1 ){
								   vm.submitStatus = true;
								}
							  	isFirst = false;
							}
					   	});
						vm.subjectItem = subjectItem;
					}
					
					//选择排序题
					if(subjectType == 7){
						subjectItem.answerArr.push(cIndex);
						vm.subjectItem = subjectItem;
					}
					
					if(subjectType == 1 || subjectType == 4 || subjectType == 6){
						this.affirmAnswer();	   
					}
					
				},
				
				//判断答案是否正确
				affirmAnswer(a1,a2,callback){
					var subjectAudioObj = $('#subjectPlayAudio').get(0);
					var subjectStore = vm.subjectStore;
					if(a1 == a2){
						subjectStore = subjectStore + 0.4;
					}else{
						subjectStore = subjectStore - 0.7;
					}
					vm.subjectStore = subjectStore;
					subjectAudioObj.pause();
					clearInterval(countTimer);
					vm.submitStatus = true;
					vm.examStatus = false;
					vm.currentaudioIndex = 0;
					this.skipNextSubject();
				},
				
				//跳转下一题
				skipNextSubject(){
					
					var _this = this;
					//判断是否最后一题
					if(vm.subjectIndex == 4){
						setTimeout(function(){
							window.location.href = 'subject-result.html?shareid=1';
						},1000);
					   	return;
					}
					var subjectStore = vm.subjectStore;
					var subjectData = vm.subjectData;
					var subjectItem;
					if(subjectStore < 2){
						subjectItem = subjectData.level1[vm.subjectIndex+1];
					}else if(subjectStore > 2 && subjectStore < 3){
						subjectItem = subjectData.level2[vm.subjectIndex+1];
					}else{
						subjectItem = subjectData.level3[vm.subjectIndex+1];
					}
					
					vm.subjectIsShow = false;
					setTimeout(function(){
						vm.subjectIndex++;
						vm.subjectIsShow = true;
						vm.subjectItem = subjectItem;
						vm.submitStatus = false;
						setTimeout(()=>{
							_this.subjectPlayAudio(vm.subjectItem.audioList);	//播放音频
						},1000);
					},1000);
				},
				
				//完形填空移除答案
				removeAnswer(cIndex){
					var subjectItem = vm.subjectItem;
					var subjectType = subjectItem.questionType;	//当前题目的类型
					var answerIndex;
					if(subjectType == 5){
						answerIndex = subjectItem.contentArr[cIndex].answerIndex;
						subjectItem.contentArr[cIndex].answerIndex = '';
						subjectItem.contentNum--;
						vm.submitStatus = false;
					}
					
					if(subjectType == 7){
						answerIndex = subjectItem.answerArr[cIndex];
						subjectItem.answerArr.splice(cIndex,1);	//删除当前项
					}
					
					subjectItem.options[answerIndex].isChecked = false;
					vm.subjectItem = subjectItem;
				}
			},

			//vue实例加载完成后执行
			created:function(){
				
			},
			
			//el 被新创建的 vm.$el 替换
			mounted() {
				common.vueIsLoad = true;
				if(!common.isTest){
					if(!common.shareId){
					   common.sessionId && vmCreated && vmCreated();	//记得要加判断是否有sessionid
					}else{
						vmCreated && vmCreated();
					}
				   
				}else{
					vmCreated && vmCreated();
				}

			}
		});
	},
	
	//初始化函数
	init:()=>{

		common.loading();
		common.isTest = common.GetQueryStringFn('test')?true:false;
		common.shareId = common.GetQueryStringFn('shareid')?common.GetQueryStringFn('shareid'):null;
		if(!common.isTest){
			
			if(!common.shareId){
				
				//通过APP传输获取当前语言
				Shell.getLanguage(function(lang){

					common.currentLang = lang.toLowerCase();

					common.langTag(common.currentLang?common.currentLang:'en',function(){
						common.vueExample();	//加载vue实例
					});

				});

			}else{
				//通过分享的页面，获取当前手机的系统语言
				common.currentLang = common.getSystemLang();
				common.langTag(common.currentLang?common.currentLang:'en',function(){
					common.vueExample();	//加载vue实例
				});
			}
			
		}else{
			common.apiUrl = common.apiTestUrl;
			//没接到app里测试用的
			common.langTag('zh',function(){
				common.vueExample();	//加载vue实例
			});
		}
		
	}
};

common.init();


//点击:active效果
document.addEventListener("touchstart", function(){}, true);






