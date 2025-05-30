
var arraysortlistlines = [];
var sortname = 'Time';
var sortdir = 'desc';

var maxNoCharts = 18;
var currentNoCharts = 0;

var ShowLines = GetCookie('ShowLines','string');
var ShowFill = GetCookie('ShowFill','string');

var DragZoom = true;
var ChartPan = false;

Chart.defaults.global.defaultFontColor = '#CCC';
Chart.Tooltip.positioners.cursor = function(chartElements,coordinates){
	return coordinates;
};

var dataintervallist = ['raw','hour','day'];
var metriclist = ['Offset','Drift'];
var measureunitlist = ['ms','ppm'];
var chartlist = ['daily','weekly','monthly'];
var timeunitlist = ['hour','day','day'];
var intervallist = [24,7,30];
var bordercolourlist = ['#fc8500','#ffffff'];
var backgroundcolourlist = ['rgba(252,133,0,0.5)','rgba(255,255,255,0.5)'];

/**----------------------------------------**/
/** Modified by Martinski W. [2025-Feb-20] **/
/**----------------------------------------**/
let databaseResetDone = 0;
var sqlDatabaseFileSize = '0 Bytes';
var jffsAvailableSpaceStr = '0 Bytes';
var jffsAvailableSpaceLow = 'OK';

function keyHandler(e)
{
	if(e.keyCode == 82){
		$(document).off('keydown');
		ResetZoom();
	}
	else if(e.keyCode == 68){
		$(document).off('keydown');
		ToggleDragZoom(document.form.btnDragZoom);
	}
	else if(e.keyCode == 70){
		$(document).off('keydown');
		ToggleFill();
	}
	else if(e.keyCode == 76){
		$(document).off('keydown');
		ToggleLines();
	}
}

$(document).keydown(function(e){keyHandler(e);});
$(document).keyup(function(e){
	$(document).keydown(function(e){
		keyHandler(e);
	});
});

function Draw_Chart_NoData(txtchartname,texttodisplay)
{
	document.getElementById('divLineChart_'+txtchartname).width='730';
	document.getElementById('divLineChart_'+txtchartname).height='500';
	document.getElementById('divLineChart_'+txtchartname).style.width='730px';
	document.getElementById('divLineChart_'+txtchartname).style.height='500px';
	var ctx = document.getElementById('divLineChart_'+txtchartname).getContext('2d');
	ctx.save();
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = 'normal normal bolder 48px Arial';
	ctx.fillStyle = 'white';
	ctx.fillText(texttodisplay,365,250);
	ctx.restore();
}

function Draw_Chart(txtchartname,txttitle,txtunity,bordercolourname,backgroundcolourname)
{
	var chartperiod = getChartPeriod($('#'+txtchartname+'_Period option:selected').val());
	var chartinterval = getChartInterval($('#' + txtchartname + '_Interval option:selected').val());
	var txtunitx = timeunitlist[$('#'+txtchartname+'_Period option:selected').val()];
	var numunitx = intervallist[$('#'+txtchartname+'_Period option:selected').val()];
	var zoompanxaxismax = moment();
	var chartxaxismax = null;
	var chartxaxismin = moment().subtract(numunitx,txtunitx+'s');
	var charttype = 'line';
	var dataobject = window[txtchartname+'_'+chartinterval+'_'+chartperiod];
	
	if(typeof dataobject === 'undefined' || dataobject === null){ Draw_Chart_NoData(txtchartname,'No data to display'); return; }
	if(dataobject.length == 0){ Draw_Chart_NoData(txtchartname,'No data to display'); return; }
	
	var chartLabels = dataobject.map(function(d){return d.Metric});
	var chartData = dataobject.map(function(d){return {x: d.Time,y: d.Value}});
	var objchartname = window['LineChart_'+txtchartname];
	
	var timeaxisformat = getTimeFormat($('#Time_Format option:selected').val(),'axis');
	var timetooltipformat = getTimeFormat($('#Time_Format option:selected').val(),'tooltip');
	
	if(chartinterval == 'day'){
		charttype = 'bar';
		chartxaxismax = moment().endOf('day').subtract(9,'hours');
		chartxaxismin = moment().startOf('day').subtract(numunitx-1,txtunitx+'s').subtract(12,'hours');
		zoompanxaxismax = chartxaxismax;
	}
	
	if(chartperiod == 'daily' && chartinterval == 'day'){
		txtunitx = 'day';
		numunitx = 1;
		chartxaxismax = moment().endOf('day').subtract(9,'hours');
		chartxaxismin = moment().startOf('day').subtract(12,'hours');
		zoompanxaxismax = chartxaxismax;
	}
	
	factor=0;
	if(txtunitx=='hour'){
		factor=60*60*1000;
	}
	else if(txtunitx=='day'){
		factor=60*60*24*1000;
	}
	if(objchartname != undefined) objchartname.destroy();
	var ctx = document.getElementById('divLineChart_'+txtchartname).getContext('2d');
	var lineOptions = {
		segmentShowStroke: false,
		segmentStrokeColor: '#000',
		animationEasing: 'easeOutQuart',
		animationSteps: 100,
		maintainAspectRatio: false,
		animateScale: true,
		hover: { mode: 'point' },
		legend: { display: false,position: 'bottom',onClick: null },
		title: { display: true,text: txttitle },
		tooltips: {
			callbacks: {
				title: function (tooltipItem,data){
					if(chartinterval == 'day'){
						return moment(tooltipItem[0].xLabel,'X').format('YYYY-MM-DD');
					}
					else{
						return moment(tooltipItem[0].xLabel,'X').format(timetooltipformat);
					}
				},
				label: function (tooltipItem,data){ return round(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].y,3).toFixed(3)+' '+txtunity;}
			},
			mode: 'point',
			position: 'cursor',
			intersect: true
		},
		scales: {
			xAxes: [{
				type: 'time',
				gridLines: { display: true,color: '#282828' },
				ticks: {
					min: chartxaxismin,
					max: chartxaxismax,
					display: true
				},
				time: {
					parser: 'X',
					unit: txtunitx,
					stepSize: 1,
					displayFormats: timeaxisformat
				}
			}],
			yAxes: [{
				gridLines: { display: false,color: '#282828' },
				scaleLabel: { display: false,labelString: txtunity },
				ticks: {
					display: true,
					callback: function (value,index,values){
						return round(value,3).toFixed(3)+' '+txtunity;
					}
				}
			}]
		},
		plugins: {
			zoom: {
				pan: {
					enabled: ChartPan,
					mode: 'xy',
					rangeMin: {
						x: chartxaxismin,
						y: getLimit(chartData,'y','min',false) - Math.sqrt(Math.pow(getLimit(chartData,'y','min',false),2))*0.1
					},
					rangeMax: {
						x: zoompanxaxismax,
						y: getLimit(chartData,'y','max',false)+getLimit(chartData,'y','max',false)*0.1
					},
				},
				zoom: {
					enabled: true,
					drag: DragZoom,
					mode: 'xy',
					rangeMin: {
						x: chartxaxismin,
						y: getLimit(chartData,'y','min',false) - Math.sqrt(Math.pow(getLimit(chartData,'y','min',false),2))*0.1
					},
					rangeMax: {
						x: zoompanxaxismax,
						y: getLimit(chartData,'y','max',false)+getLimit(chartData,'y','max',false)*0.1
					},
					speed: 0.1
				},
			}
		},
		annotation: {
			drawTime: 'afterDatasetsDraw',
			annotations: [{
				//id: 'avgline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'y-axis-0',
				value: getAverage(chartData),
				borderColor: bordercolourname,
				borderWidth: 1,
				borderDash: [5,5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: 'sans-serif',
					fontSize: 10,
					fontStyle: 'bold',
					fontColor: '#fff',
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: 'center',
					enabled: true,
					xAdjust: 0,
					yAdjust: 0,
					content: 'Avg='+round(getAverage(chartData),3).toFixed(3)+txtunity
				}
			},
			{
				//id: 'maxline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'y-axis-0',
				value: getLimit(chartData,'y','max',true),
				borderColor: bordercolourname,
				borderWidth: 1,
				borderDash: [5,5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: 'sans-serif',
					fontSize: 10,
					fontStyle: 'bold',
					fontColor: '#fff',
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: 'right',
					enabled: true,
					xAdjust: 15,
					yAdjust: 0,
					content: 'Max='+round(getLimit(chartData,'y','max',true),3).toFixed(3)+txtunity
				}
			},
			{
				//id: 'minline',
				type: ShowLines,
				mode: 'horizontal',
				scaleID: 'y-axis-0',
				value: getLimit(chartData,'y','min',true),
				borderColor: bordercolourname,
				borderWidth: 1,
				borderDash: [5,5],
				label: {
					backgroundColor: 'rgba(0,0,0,0.3)',
					fontFamily: 'sans-serif',
					fontSize: 10,
					fontStyle: 'bold',
					fontColor: '#fff',
					xPadding: 6,
					yPadding: 6,
					cornerRadius: 6,
					position: 'left',
					enabled: true,
					xAdjust: 15,
					yAdjust: 0,
					content: 'Min='+round(getLimit(chartData,'y','min',true),3).toFixed(3)+txtunity
				}
			}]
		}
	};
	var lineDataset = {
		labels: chartLabels,
		datasets: [{data: chartData,
			borderWidth: 1,
			pointRadius: 1,
			lineTension: 0,
			fill: ShowFill,
			backgroundColor: backgroundcolourname,
			borderColor: bordercolourname
		}]
	};
	objchartname = new Chart(ctx,{
		type: charttype,
		data: lineDataset,
		options: lineOptions
	});
	window['LineChart_'+txtchartname] = objchartname;
}

function getLimit(datasetname,axis,maxmin,isannotation){
	var limit = 0;
	var values;
	if(axis == 'x'){
		values = datasetname.map(function(o){ return o.x } );
	}
	else{
		values = datasetname.map(function(o){ return o.y } );
	}
	
	if(maxmin == 'max'){
		limit=Math.max.apply(Math,values);
	}
	else{
		limit=Math.min.apply(Math,values);
	}
	if(maxmin == 'max' && limit == 0 && isannotation == false){
		limit = 1;
	}
	return limit;
}

function getAverage(datasetname){
	var total = 0;
	for(var i = 0; i < datasetname.length; i++){
		total += (datasetname[i].y*1);
	}
	var avg = total / datasetname.length;
	return avg;
}

function round(value,decimals){
	return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function ToggleLines(){
	if(ShowLines == ''){
		ShowLines = 'line';
		SetCookie('ShowLines','line');
	}
	else{
		ShowLines = '';
		SetCookie('ShowLines','');
	}
	for(var i = 0; i < metriclist.length; i++){
		for(var i3 = 0; i3 < 3; i3++){
			window['LineChart_'+metriclist[i]].options.annotation.annotations[i3].type=ShowLines;
		}
		window['LineChart_'+metriclist[i]].update();
	}
}

function ToggleFill(){
	if(ShowFill == 'false'){
		ShowFill = 'origin';
		SetCookie('ShowFill','origin');
	}
	else{
		ShowFill = 'false';
		SetCookie('ShowFill','false');
	}
	for(var i = 0; i < metriclist.length; i++){
		window['LineChart_'+metriclist[i]].data.datasets[0].fill=ShowFill;
		window['LineChart_'+metriclist[i]].update();
	}
}

function redrawAllCharts()
{
	for(var i = 0; i < metriclist.length; i++){
		Draw_Chart_NoData(metriclist[i],'Data loading...');
		for(var i2 = 0; i2 < chartlist.length; i2++){
			for(var i3 = 0; i3 < dataintervallist.length; i3++){
				d3.csv('/ext/ntpmerlin/csv/'+metriclist[i]+'_'+dataintervallist[i3]+'_'+chartlist[i2]+'.htm').then(SetGlobalDataset.bind(null,metriclist[i]+'_'+dataintervallist[i3]+'_'+chartlist[i2]));
			}
		}
	}
}

/**----------------------------------------**/
/** Modified by Martinski W. [2025-Feb-02] **/
/**----------------------------------------**/
function SetGlobalDataset(txtchartname,dataobject)
{
	window[txtchartname] = dataobject;
	currentNoCharts++;
	if (currentNoCharts == maxNoCharts)
	{
		document.getElementById('ntpupdate_text').innerHTML = '';
		showhide('imgNTPUpdate',false);
		showhide('ntpupdate_text',false);
		showhide('btnUpdateStats',true);
		showhide('databaseSize_text',true);
		for (var i = 0; i < metriclist.length; i++)
		{
			$('#'+metriclist[i]+'_Interval').val(GetCookie(metriclist[i]+'_Interval','number'));
			changePeriod(document.getElementById(metriclist[i]+'_Interval'));
			$('#'+metriclist[i]+'_Period').val(GetCookie(metriclist[i]+'_Period','number'));
			Draw_Chart(metriclist[i],metriclist[i],measureunitlist[i],bordercolourlist[i],backgroundcolourlist[i]);
		}
		AddEventHandlers();
		get_lastx_file();
	}
}

function getTimeFormat(value,format)
{
	var timeformat;
	
	if(format == 'axis'){
		if(value == 0){
			timeformat = {
				millisecond: 'HH:mm:ss.SSS',
				second: 'HH:mm:ss',
				minute: 'HH:mm',
				hour: 'HH:mm'
			}
		}
		else if(value == 1){
			timeformat = {
				millisecond: 'h:mm:ss.SSS A',
				second: 'h:mm:ss A',
				minute: 'h:mm A',
				hour: 'h A'
			}
		}
	}
	else if(format == 'tooltip'){
		if(value == 0){
			timeformat = 'YYYY-MM-DD HH:mm:ss';
		}
		else if(value == 1){
			timeformat = 'YYYY-MM-DD h:mm:ss A';
		}
	}
	
	return timeformat;
}

function GetCookie(cookiename,returntype){
	var s;
	if((s = cookie.get('ntp_'+cookiename)) != null){
		return cookie.get('ntp_'+cookiename);
	}
	else{
		if(returntype == 'string'){
			return '';
		}
		else if(returntype == 'number'){
			return 0;
		}
	}
}

function SetCookie(cookiename,cookievalue){
	cookie.set('ntp_'+cookiename,cookievalue,10 * 365);
}

function AddEventHandlers(){
	$('.collapsible-jquery').off('click').on('click',function(){
		$(this).siblings().toggle('fast',function(){
			if($(this).css('display') == 'none'){
				SetCookie($(this).siblings()[0].id,'collapsed');
			}
			else{
				SetCookie($(this).siblings()[0].id,'expanded');
			}
		})
	});
	
	$('.collapsible-jquery').each(function(index,element){
		if(GetCookie($(this)[0].id,'string') == 'collapsed'){
			$(this).siblings().toggle(false);
		}
		else{
			$(this).siblings().toggle(true);
		}
	});
}

$.fn.serializeObject = function(){
	var o = custom_settings;
	var a = this.serializeArray();
	$.each(a,function(){
		if(o[this.name] !== undefined && this.name.indexOf('ntpmerlin') != -1 && this.name.indexOf('version') == -1){
			if(!o[this.name].push){
				o[this.name] = [o[this.name]];
			}
			o[this.name].push(this.value || '');
		} else if(this.name.indexOf('ntpmerlin') != -1 && this.name.indexOf('version') == -1){
			o[this.name] = this.value || '';
		}
	});
	return o;
};

function setCurrentPage(){
	document.form.next_page.value = window.location.pathname.substring(1);
	document.form.current_page.value = window.location.pathname.substring(1);
}

function ErrorCSVExport(){
	document.getElementById('aExport').href='javascript:alert(\'Error exporting CSV,please refresh the page and try again\')';
}

function ParseCSVExport(data)
{
	var csvContent = 'Timestamp,Offset,Frequency,Sys_Jitter,Clk_Jitter,Clk_Wander,Rootdisp\n';
	for(var i = 0; i < data.length; i++){
		var dataString = data[i].Timestamp+','+data[i].Offset+','+data[i].Frequency+','+data[i].Sys_Jitter+','+data[i].Clk_Jitter+','+data[i].Clk_Wander+','+data[i].Rootdisp;
		csvContent += i < data.length-1 ? dataString+'\n' : dataString;
	}
	document.getElementById('aExport').href='data:text/csv;charset=utf-8,'+encodeURIComponent(csvContent);
}

/**----------------------------------------**/
/** Modified by Martinski W. [2025-Feb-15] **/
/**----------------------------------------**/
function initial()
{
	setCurrentPage();
	loadCustomSettings();
	show_menu();
	$('#sortTableContainer').empty();
	$('#sortTableContainer').append(BuildLastXTableNoData());
	getConfigFile();
	d3.csv('/ext/ntpmerlin/csv/CompleteResults.htm').then(function(data){ParseCSVExport(data);}).catch(function(){ErrorCSVExport();});
	$('#Time_Format').val(GetCookie('Time_Format', 'number'));
	scriptUpdateLayout();
	getStatsTitleFile();
	showhide('databaseSize_text',true);
	showhide('jffsFreeSpace_text',true);
	showhide('jffsFreeSpace_LOW',false);
	showhide('jffsFreeSpace_WARN',false);
	showhide('jffsFreeSpace_NOTE',false);
	redrawAllCharts();
}

function scriptUpdateLayout()
{
	var localver = GetVersionNumber('local');
	var serverver = GetVersionNumber('server');
	$('#ntpmerlin_version_local').text(localver);
	
	if (localver != serverver && serverver != 'N/A')
	{
		$('#ntpmerlin_version_server').text('Updated version available: '+serverver);
		showhide('btnChkUpdate',false);
		showhide('ntpmerlin_version_server',true);
		showhide('btnDoUpdate',true);
	}
}

function reload(){
	location.reload(true);
}

function validateNumberSetting (forminput, upperlimit, lowerlimit)
{
	var inputname = forminput.name;
	var inputvalue = forminput.value*1;
	
	if (inputvalue > upperlimit || inputvalue < lowerlimit)
	{
		$(forminput).addClass('invalid');
		return false;
	}
	else
	{
		$(forminput).removeClass('invalid');
		return true;
	}
}

function formatNumberSetting (forminput)
{
	var inputname = forminput.name;
	var inputvalue = forminput.value*1;
	
	if (forminput.value.length == 0 || inputvalue == NaN)
	{
		return false;
	}
	else
	{
		forminput.value = parseInt(forminput.value);
		return true;
	}
}

/**----------------------------------------**/
/** Modified by Martinski W. [2025-Feb-08] **/
/**----------------------------------------**/
//Between 15 and 365 days, Default: 30//
const theDaysToKeepMIN = 15;
const theDaysToKeepDEF = 30;
const theDaysToKeepMAX = 365;
const theDaysToKeepTXT = `(between ${theDaysToKeepMIN} and ${theDaysToKeepMAX}, default: ${theDaysToKeepDEF})`;

//Between 5 and 100 results, Default: 10//
const theLastXResultsMIN = 5;
const theLastXResultsDEF = 10;
const theLastXResultsMAX = 100;
const theLastXResultsTXT = `(between ${theLastXResultsMIN} and ${theLastXResultsMAX}, default: ${theLastXResultsDEF})`;

function validateAll()
{
	var validationfailed = false;
	if (!validateNumberSetting (document.form.ntpmerlin_lastxresults, theLastXResultsMAX, theLastXResultsMIN))
	{ validationfailed = true; }
	if (!validateNumberSetting (document.form.ntpmerlin_daystokeep, theDaysToKeepMAX, theDaysToKeepMIN))
	{ validationfailed = true; }
	if (validationfailed)
	{
		alert('**ERROR**\nValidation for some fields failed.\nPlease correct invalid values and try again.');
		return false;
	}
	else
	{ return true; }
}

function getChartPeriod(period){
	var chartperiod = 'daily';
	if(period == 0) chartperiod = 'daily';
	else if(period == 1) chartperiod = 'weekly';
	else if(period == 2) chartperiod = 'monthly';
	return chartperiod;
}

function getChartInterval(layout){
	var charttype = 'raw';
	if(layout == 0) charttype = 'raw';
	else if(layout == 1) charttype = 'hour';
	else if(layout == 2) charttype = 'day';
	return charttype;
}

function changePeriod(e){
	value = e.value * 1;
	name = e.id.substring(0,e.id.indexOf('_'));
	if(value == 2){
		$('select[id="'+name+'_Period"] option:contains(24)').text('Today');
	}
	else{
		$('select[id="'+name+'_Period"] option:contains("Today")').text('Last 24 hours');
	}
}

function ResetZoom(){
	for(var i = 0; i < metriclist.length; i++){
		var chartobj = window['LineChart_'+metriclist[i]];
		if(typeof chartobj === 'undefined' || chartobj === null){ continue; }
		chartobj.resetZoom();
	}
}

function ToggleDragZoom(button){
	var drag = true;
	var pan = false;
	var buttonvalue = '';
	if(button.value.indexOf('On') != -1){
		drag = false;
		pan = true;
		DragZoom = false;
		ChartPan = true;
		buttonvalue = 'Drag Zoom Off';
	}
	else{
		drag = true;
		pan = false;
		DragZoom = true;
		ChartPan = false;
		buttonvalue = 'Drag Zoom On';
	}
	
	for(var i = 0; i < metriclist.length; i++){
		var chartobj = window['LineChart_'+metriclist[i]];
		if(typeof chartobj === 'undefined' || chartobj === null){ continue; }
		chartobj.options.plugins.zoom.zoom.drag = drag;
		chartobj.options.plugins.zoom.pan.enabled = pan;
		button.value = buttonvalue;
		chartobj.update();
	}
}

function update_status(){
	$.ajax({
		url: '/ext/ntpmerlin/detect_update.js',
		dataType: 'script',
		error:	function(xhr){
			setTimeout(update_status,1000);
		},
		success: function(){
			if(updatestatus == 'InProgress'){
				setTimeout(update_status,1000);
			}
			else{
				document.getElementById('imgChkUpdate').style.display = 'none';
				showhide('ntpmerlin_version_server',true);
				if(updatestatus != 'None'){
					$('#ntpmerlin_version_server').text('Updated version available: '+updatestatus);
					showhide('btnChkUpdate',false);
					showhide('btnDoUpdate',true);
				}
				else{
					$('#ntpmerlin_version_server').text('No update available');
					showhide('btnChkUpdate',true);
					showhide('btnDoUpdate',false);
				}
			}
		}
	});
}

function checkUpdate()
{
	showhide('btnChkUpdate',false);
	document.formScriptActions.action_script.value = 'start_ntpmerlincheckupdate'
	document.formScriptActions.submit();
	document.getElementById('imgChkUpdate').style.display = '';
	setTimeout(update_status,2000);
}

function doUpdate()
{
	document.form.action_script.value = 'start_ntpmerlindoupdate';
	document.form.action_wait.value = 10;
	showLoading();
	document.form.submit();
}

function update_ntpstats()
{
	$.ajax({
		url: '/ext/ntpmerlin/detect_ntpmerlin.js',
		dataType: 'script',
		error: function(xhr){
			setTimeout(update_ntpstats,1000);
		},
		success: function(){
			if(ntpstatus == 'InProgress'){
				setTimeout(update_ntpstats,1000);
			}
			else if(ntpstatus == 'GenerateCSV'){
				document.getElementById('ntpupdate_text').innerHTML = 'Retrieving data for charts...';
				setTimeout(update_ntpstats,1000);
			}
			else if(ntpstatus == 'Done'){
				document.getElementById('ntpupdate_text').innerHTML = 'Refreshing charts...';
				postNTPUpdate();
			}
		}
	});
}

function postNTPUpdate()
{
	currentNoCharts = 0;
	$('#Time_Format').val(GetCookie('Time_Format', 'number'));
	getStatsTitleFile();
	setTimeout(redrawAllCharts,3000);
}

/**----------------------------------------**/
/** Modified by Martinski W. [2025-Feb-02] **/
/**----------------------------------------**/
function updateStats()
{
	showhide('btnUpdateStats',false);
	showhide('databaseSize_text',false);
	document.formScriptActions.action_script.value='start_ntpmerlin';
	document.formScriptActions.submit();
	document.getElementById('ntpupdate_text').innerHTML = 'Retrieving timeserver stats';
	showhide('imgNTPUpdate',true);
	showhide('ntpupdate_text',true);
	setTimeout(update_ntpstats,5000);
}

/**----------------------------------------**/
/** Modified by Martinski W. [2025-Feb-02] **/
/**----------------------------------------**/
function saveConfig()
{
	if (validateAll())
	{
		document.getElementById('amng_custom').value = JSON.stringify($('form').serializeObject())
		document.form.action_script.value = 'start_ntpmerlinconfig';
		document.form.action_wait.value = 10;
		showLoading();
		document.form.submit();
	}
}

function GetVersionNumber(versiontype)
{
	var versionprop;
	if(versiontype == 'local'){
		versionprop = custom_settings.ntpmerlin_version_local;
	}
	else if(versiontype == 'server'){
		versionprop = custom_settings.ntpmerlin_version_server;
	}
	
	if(typeof versionprop == 'undefined' || versionprop == null){
		return 'N/A';
	}
	else{
		return versionprop;
	}
}

/**----------------------------------------**/
/** Modified by Martinski W. [2025-Feb-15] **/
/**----------------------------------------**/
function getConfigFile()
{
	$.ajax({
		url: '/ext/ntpmerlin/config.htm',
		dataType: 'text',
		error: function(xhr){
			setTimeout(getConfigFile,1000);
		},
		success: function(data)
		{
			let settingname, settingvalue;
			var configdata = data.split('\n');
			configdata = configdata.filter(Boolean);

			for (var indx = 0; indx < configdata.length; indx++)
			{
				if (configdata[indx].length === 0 || configdata[indx].match('^[ ]*#') !== null)
				{ continue; }  //Skip comments & empty lines//

				settingname = configdata[indx].split('=')[0];
				settingvalue = configdata[indx].split('=')[1].replace(/(\r\n|\n|\r)/gm,'');

				if (settingname.match(/^JFFS_MSGLOGTIME/) != null)
				{ continue; }  //Skip this config setting// 

				settingname = settingname.toLowerCase();
				eval('document.form.ntpmerlin_' + settingname).value = settingvalue;
			}
			document.getElementById('theDaysToKeepText').textContent = theDaysToKeepTXT;
			document.getElementById('theLastXResultsText').textContent = theLastXResultsTXT;
		}
	});
}

/**----------------------------------------**/
/** Modified by Martinski W. [2025-Feb-20] **/
/**----------------------------------------**/
function getStatsTitleFile()
{
	$.ajax({
		url: '/ext/ntpmerlin/ntpstatstext.js',
		dataType: 'script',
		error: function(xhr){
			setTimeout(getStatsTitleFile, 2000);
		},
		success: function()
		{
			SetNTPDStatsTitle();
			document.getElementById('databaseSize_text').textContent = 'Database Size: '+sqlDatabaseFileSize;

			if (jffsAvailableSpaceLow.match(/^WARNING[0-9]/) === null)
			{
				showhide('jffsFreeSpace_LOW',false);
				showhide('jffsFreeSpace_NOTE',false);
				showhide('jffsFreeSpace_WARN',false);
				document.getElementById('jffsFreeSpace_text').textContent = 'JFFS Available: ' + jffsAvailableSpaceStr;
			}
			else
			{
				document.getElementById('jffsFreeSpace_text').textContent = 'JFFS Available: ';
				document.getElementById('jffsFreeSpace_LOW').textContent = jffsAvailableSpaceStr;
				showhide('jffsFreeSpace_LOW',true);
				if (document.form.ntpmerlin_storagelocation.value === 'jffs')
				{ showhide('jffsFreeSpace_NOTE',false); showhide('jffsFreeSpace_WARN',true); }
				else
				{ showhide('jffsFreeSpace_WARN',false); showhide('jffsFreeSpace_NOTE',true); }
			}
			if (databaseResetDone === 1)
			{
				currentNoCharts = 0;
				$('#Time_Format').val(GetCookie('Time_Format', 'number'));
				redrawAllCharts();
				databaseResetDone += 1;
			}
			setTimeout(getStatsTitleFile, 4000);
		}
	});
}

function get_lastx_file()
{
	$.ajax({
		url: '/ext/ntpmerlin/lastx.htm',
		dataType: 'text',
		error: function(xhr){
			setTimeout(get_lastx_file,1000);
		},
		success: function(data){
			ParseLastXData(data);
		}
	});
}

function ParseLastXData(data){
	var arraysortlines = data.split('\n');
	arraysortlines = arraysortlines.filter(Boolean);
	arraysortlistlines = [];
	for(var i = 0; i < arraysortlines.length; i++){
		try{
			var resultfields = arraysortlines[i].split(',');
			var parsedsortline = new Object();
			parsedsortline.Time =  moment.unix(resultfields[0].trim()).format('YYYY-MM-DD HH:mm:ss');
			parsedsortline.Offset = resultfields[1].trim();
			parsedsortline.Drift = resultfields[2].trim();
			arraysortlistlines.push(parsedsortline);
		}
		catch{
			//do nothing,continue
		}
	}
	SortTable(sortname+' '+sortdir.replace('desc','↑').replace('asc','↓').trim());
}

function SortTable(sorttext){
	sortname = sorttext.replace('↑','').replace('↓','').trim();
	var sorttype = 'number';
	var sortfield = sortname;
	switch(sortname){
		case 'Time':
			sorttype = 'date';
		break;
	}
	
	if(sorttype == 'string'){
		if(sorttext.indexOf('↓') == -1 && sorttext.indexOf('↑') == -1){
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => (a.'+sortfield+' > b.'+sortfield+') ? 1 : ((b.'+sortfield+' > a.'+sortfield+') ? -1 : 0));');
			sortdir = 'asc';
		}
		else if(sorttext.indexOf('↓') != -1){
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => (a.'+sortfield+' > b.'+sortfield+') ? 1 : ((b.'+sortfield+' > a.'+sortfield+') ? -1 : 0));');
			sortdir = 'asc';
		}
		else{
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => (a.'+sortfield+' < b.'+sortfield+') ? 1 : ((b.'+sortfield+' < a.'+sortfield+') ? -1 : 0));');
			sortdir = 'desc';
		}
	}
	else if(sorttype == 'number'){
		if(sorttext.indexOf('↓') == -1 && sorttext.indexOf('↑') == -1){
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => parseFloat(a.'+sortfield+'.replace("m","000")) - parseFloat(b.'+sortfield+'.replace("m","000")));');
			sortdir = 'asc';
		}
		else if(sorttext.indexOf('↓') != -1){
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => parseFloat(a.'+sortfield+'.replace("m","000")) - parseFloat(b.'+sortfield+'.replace("m","000"))); ');
			sortdir = 'asc';
		}
		else{
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => parseFloat(b.'+sortfield+'.replace("m","000")) - parseFloat(a.'+sortfield+'.replace("m","000")));');
			sortdir = 'desc';
		}
	}
	else if(sorttype == 'date'){
		if(sorttext.indexOf('↓') == -1 && sorttext.indexOf('↑') == -1){
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => new Date(a.'+sortfield+') - new Date(b.'+sortfield+'));');
			sortdir = 'asc';
		}
		else if(sorttext.indexOf('↓') != -1){
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => new Date(a.'+sortfield+') - new Date(b.'+sortfield+'));');
			sortdir = 'asc';
		}
		else{
			eval('arraysortlistlines = arraysortlistlines.sort((a,b) => new Date(b.'+sortfield+') - new Date(a.'+sortfield+'));');
			sortdir = 'desc';
		}
	}
	
	$('#sortTableContainer').empty();
	$('#sortTableContainer').append(BuildLastXTable());
	
	$('.sortable').each(function(index,element){
		if(element.innerHTML.replace(/ \(.*\)/,'').replace(' ','') == sortname){
			if(sortdir == 'asc'){
				element.innerHTML = element.innerHTML+' ↑';
			}
			else{
				element.innerHTML = element.innerHTML+' ↓';
			}
		}
	});
}

function BuildLastXTableNoData(){
	var tablehtml='<table width="100%" border="1" align="center" cellpadding="4" cellspacing="0" bordercolor="#6b8fa3" class="sortTable">';
	tablehtml += '<tr>';
	tablehtml += '<td colspan="3" class="nodata">';
	tablehtml += 'Data loading...';
	tablehtml += '</td>';
	tablehtml += '</tr>';
	tablehtml += '</table>';
	return tablehtml;
}

function BuildLastXTable(){
	var tablehtml='<table width="100%" border="1" align="center" cellpadding="4" cellspacing="0" bordercolor="#6b8fa3" class="sortTable">';
	
	tablehtml += '<col style="width:150px;">';
	tablehtml += '<col style="width:280px;">';
	tablehtml += '<col style="width:280px;">';
	tablehtml += '<thead class="sortTableHeader">';
	tablehtml += '<tr>';
	tablehtml += '<th class="sortable" onclick="SortTable(this.innerHTML.replace(/ \\(.*\\)/,\'\'))">Time</th>';
	tablehtml += '<th class="sortable" onclick="SortTable(this.innerHTML.replace(/ \\(.*\\)/,\'\'))">Offset (ms)</th>';
	tablehtml += '<th class="sortable" onclick="SortTable(this.innerHTML.replace(/ \\(.*\\)/,\'\'))">Drift (ppm)</th>';
	tablehtml += '</tr>';
	tablehtml += '</thead>';
	tablehtml += '<tbody class="sortTableContent">';
	for(var i = 0; i < arraysortlistlines.length; i++){
		tablehtml += '<tr class="sortRow">';
		tablehtml += '<td>'+arraysortlistlines[i].Time+'</td>';
		tablehtml += '<td>'+arraysortlistlines[i].Offset+'</td>';
		tablehtml += '<td>'+arraysortlistlines[i].Drift+'</td>';
		tablehtml += '</tr>';
	}
	
	tablehtml += '</tbody>';
	tablehtml += '</table>';
	return tablehtml;
}

function changeChart(e){
	value = e.value * 1;
	name = e.id.substring(0,e.id.indexOf('_'));
	SetCookie(e.id,value);
	
	if(name == 'Offset'){
		Draw_Chart('Offset',metriclist[0],measureunitlist[0],bordercolourlist[0],backgroundcolourlist[0]);
	}
	else if(name == 'Drift'){
		Draw_Chart('Drift',metriclist[1],measureunitlist[1],bordercolourlist[1],backgroundcolourlist[1]);
	}
}

function changeAllCharts(e){
	value = e.value * 1;
	name = e.id.substring(0,e.id.indexOf('_'));
	SetCookie(e.id,value);
	for(var i = 0; i < metriclist.length; i++){
		Draw_Chart(metriclist[i],metriclist[i],measureunitlist[i],bordercolourlist[i],backgroundcolourlist[i]);
	}
}
