// 更新日期：2019-06-25

let vm = null;	//vue实例
var countTimer = null;	//测试题-计算做题定时器
let common = {
	//获取地址参数值
	GetQueryStringFn:(name) => {
		 var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
		 var r = window.location.search.substr(1).match(reg);
		 if(r!=null)return decodeURIComponent(r[2]); return null;
	},
	//判断手机系统
	isSystem:()=>{
		var u = navigator.userAgent;
		var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
    	var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
		var resultTxt = '';
		if(isAndroid){
			resultTxt = 'android';
		}else if(isiOS){
			resultTxt = 'ios';
		}
		return resultTxt;
	},
	//时间戳转时间
	getDate(timestamp) {
	  //shijianchuo是整数，否则要parseInt转换 
	  var time = new Date(timestamp);
	  var y = time.getFullYear();
	  var m = time.getMonth() + 1;
	  var d = time.getDate();
	  var h = time.getHours();
	  var mm = time.getMinutes();
	  var s = time.getSeconds();
	  return y + '-' + common.add0(m) + '-' + common.add0(d) + ' ' + common.add0(h) + ':' + common.add0(mm) + ':' + common.add0(s);
	},
	add0(m){ return m < 10 ? '0' + m : m },
	
	isTest:false,	//是否测试环境
	shareId : null,	//记录是否是分享页面，是的话就不用获取sessionid
	apiUrl : location.protocol+'//'+location.host,	//接口前缀
	apiTestUrl : 'https://test.5ideachinese.com',	//接口前缀
	//apiTestUrl : 'http://192.168.0.244:8090',	//接口前缀
	//apiUrl : 'http://192.168.0.244:8090',	//接口前缀
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
		var lang = lang.toLowerCase();
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
				callback && callback(res);
			},
			error:()=>{
				console.log('失败');
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
				"isIos" : common.isSystem()=='ios',	//是否是苹果系统
				"isAndroid" : common.isSystem()=='android',	//是否是安卓系统
				"isPc":common.isSystem()=='',	//是否是Pc
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
				"downloadIsShow":true,
				//查询口语课分享信息
				"checkSpoken":{
					"chapterName" : {}
				},	
				"shareMediaUrl":'',	//当前播放的音频地址
				//查询配音课分享信息
				"checkShareData":{
					"chapterName" : {}
				},
				reportData:[],	//测试报告 结果列表
				
				/*---------------- 测试题_S ---------------*/
				startPop:true,	//开始弹窗是否显示
				subjectIsShow:false,	//题目是否显示
				submitStatus:false,	//是否处于提交状态（防止提交中多点选项）
				isPauseSubject:false,	//是否点击暂停做题
				examStatus:false,	//判断是否在做题状态
				isPlayStatus:false,	//是否在播放状态
				remainingTime:10000,	//做题剩余时间
				subjectData:{},	//测试题数据
				subjectItem:{},	//当前测试题数据
				subjectIndex:0,	//当前测试题索引
				subjectStore:3,	//当前级别分数
				currentAudioList:[],	//当前播放音频列表
				currentaudioIndex:0,	//当前播放音频的索引
				currentAudioUrl:'',	//当前的音频地址
				isFirstPlay:true,	//题目是否第一次播放
				choiceAnswer:'',
				resultData:{},		//测试题结果页数据
				downloadPopShow:false,	//测试题结果页下载弹窗
				tjData:{},		//统计字段
				
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
				//隐藏顶部下载提示
				closeDownloadFn(){
					vm.downloadIsShow = false;
				},
				
				//点击播放音频段落
				playAudio(type,index){
					var spokenAudio = $('#spokenAudio').get(0);
					var audioData = vm.checkShareData.paraList[index];
					
					//关闭视频播放
					if($('#video').length>0){	
						var videoObj = $('#video').get(0);
						var audioObj = $('#userAudio').get(0);
						videoObj.pause(); 
						audioObj.pause();
					}
					
					//视频播放
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
							vm.shareMediaUrl = audioData.paraAudio;
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
					vm.startPop = false;	//开始弹窗关闭
					vm.subjectIsShow = true;	//题目显示
					
					//开始播放录音
					setTimeout(()=>{
						_this.subjectPlayAudio(vm.subjectItem.audioList);
					},1000);
					
					//监听进度条css3动画结束
					cirqueBox.addEventListener("animationiteration", function(){
						vm.examStatus = false;
					});
					
					//监听播放结束事件
					var subjectAudioObj = $('#subjectPlayAudio').get(0);
					subjectAudioObj.addEventListener("ended",function(){
						
						vm.isPlayStatus = false;
						var audioIndex = vm.currentaudioIndex;
						var audioList = vm.currentAudioList;
						if(audioList.length==1){
							if(!vm.isFirstPlay){return;}
							vm.examStatus = true;
							vm.isFirstPlay = false;
							_this.countTime();
							return;
						};
						audioIndex++;
						vm.currentaudioIndex = audioIndex;
						if(audioIndex < audioList.length){ 
							vm.subjectItem.options[audioIndex-1].isPlayAudio = true;
						   	vm.currentAudioUrl = audioList[audioIndex];
							var timer = setTimeout(()=>{
								if(!vm.isPauseSubject && !vm.submitStatus){
									clearTimeout(timer);
									subjectAudioObj.play();  
								}
							},1000);
						}else{
							if(!vm.isFirstPlay){return;}
							vm.currentaudioIndex = 0;
							vm.examStatus = true;
							vm.isFirstPlay = false;
							_this.countTime();
						}
					},false);
				},
				
				//暂停/开始做题(是否播放)
				pauseSubject(){
					var _this = this;
					var subjectAudioObj = $('#subjectPlayAudio').get(0);
					if(vm.isPauseSubject){
						
						vm.isPauseSubject = false;
						if(vm.isPlayStatus){ 
							subjectAudioObj.play(); 
						}
						if(vm.remainingTime<10000){ 
							vm.examStatus = true;
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
							vm.remainingTime -= 100;
						}
					},100);
				},
				
				//测试题播放音频
				subjectPlayAudio(audioUrl,event){
					if(vm.isFirstPlay && event){return;}	//播放状态不能重新播放
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
						if(subjectItem.contentNum>=subjectItem.contentArr.length-1){
							
						   var  contentArr = subjectItem.contentArr.filter((item,index,arr)=>{
							   return  index<arr.length-1;
						   });
							vm.choiceAnswer=contentArr.map((item,index)=>{
								return subjectItem.options[item.answerIndex].optionCode;
							}).join(',');
						}
					}
					
					//选择排序题
					if(subjectType == 7){
						subjectItem.answerArr.push(cIndex);
						vm.subjectItem = subjectItem;
						if(subjectItem.answerArr.length == subjectItem.options.length){
						   vm.choiceAnswer = subjectItem.answerArr.map(item=>{
							   return subjectItem.options[item].optionCode;
						   }).join(',');
						}
					}
					
					if(subjectType == 1 || subjectType == 4 || subjectType == 6){
						vm.choiceAnswer = subjectItem.options[cIndex].optionCode;
						this.affirmAnswer();
					}
					
				},
				
				//判断答案是否正确(选择的选项，正确的选项)
				affirmAnswer(callback){
					
					var subjectAudioObj = $('#subjectPlayAudio').get(0);
					var subjectStore = vm.subjectStore;
					console.log('answer:',vm.choiceAnswer,vm.subjectItem.answer)
					if(vm.choiceAnswer == vm.subjectItem.answer){
						subjectStore = subjectStore + 0.4;
					}else{
						subjectStore = subjectStore - 0.6;
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
					this.getStatisticsFn(vm.tjData.shareid,vm.tjData.uniqueNums)
					var subjectAudioObj = $('#subjectPlayAudio').get(0);
					subjectAudioObj.pause();
					var subjectStore = vm.subjectStore;
					console.log('subjectStore',subjectStore);
					//判断是否最后一题
					if(vm.subjectIndex == 4){
						setTimeout(function(){
							
							var level = parseInt(subjectStore);
							window.location.href = `subject-result.html?shareid=1&level=${level}`;
						},1000);
					   	return;
					}
					
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
						vm.isFirstPlay = true;
						vm.currentaudioIndex = 0;
						clearInterval(countTimer);
						vm.remainingTime = 10000;
						setTimeout(()=>{
							_this.subjectPlayAudio(vm.subjectItem.audioList);	//播放音频
						},1000);
					},1000);
				},
				
				//统计完成率
				getStatisticsFn(shareid,uniqueNums){
					common.ajaxFn({
						url:`/api/shareInfo/operate/${shareid}`,
						data:{
							uniqueNums : uniqueNums
						},
						success:(res) => {
							console.log('统计完成率')
						}
					})
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
				},
				
				//统计点击下载页面
				tjDownLoad(shareid,uniqueNums,callback){
					common.ajaxFn({
						url:`/api/shareInfo/reach/${shareid}`,
						data:{
							uniqueNums : uniqueNums
						},
						success:(res) => {
							callback && callback();
							console.log('统计结果页：',res)
						},
						error:()=>{
							callback && callback();
						}
					})
				},
				
				//测试结果页打开关闭下载弹窗
				downlaodPopFn(){
					if(vm.isIos){
						var url = vm.langData.shareData.downloadAppleUrl;
						this.tjDownLoad(vm.tjData.shareid,vm.tjData.uniqueNums,()=>{
							window.location.href = url;
						})
						return;
					}
					
					var downloadPopShow = vm.downloadPopShow;
					vm.downloadPopShow = !downloadPopShow;
				},
				
				//跳转到下载页
				gotoDownload(gotoUrl){
					this.tjDownLoad(vm.tjData.shareid,vm.tjData.uniqueNums,()=>{
						window.location.href = gotoUrl;
					})
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
			common.currentLang = common.getSystemLang();
			//common.currentLang = 'en';
			common.langTag(common.currentLang?common.currentLang:'en',function(){
				common.vueExample();	//加载vue实例
			});
		}
		
	}
};

common.init();


//点击:active效果
document.addEventListener("touchstart", function(){}, true);






