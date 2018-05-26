var dappAddress = "n1uZBDzoc1aQiCXRKXV52KiE19zLqmtAxUJ";
$(function(){	
	
	
	$("#savebutton").click(function(){
		var amount = $("#amount").val().trim();
		var expiredDate = new Date($("#datepicker").val().trim());
		var remark = $("#remark").val().trim().replace(/\n/g,"<br>");
		
		if(!amount){
			alert("请输入要锁仓的NAS数量");
			return;
		}
		
		if(isNaN(amount)){
			alert("NAS数量必须是数字");
			return;
		}
		
		amount = Number(amount);
		
		if(!expiredDate){
			alert("请输入解锁日期");
			return;
		}
		
		var currentDate = new Date();
		var currentDateTimestamp = Date.parse(currentDate)/1000;
		expiredDate = Date.parse(expiredDate)/1000;
		if(currentDateTimestamp >= expiredDate){
			alert("解锁日期必须是未来日期");
			return;
		}
		
		var NebPay = require("nebpay"); //https://github.com/nebulasio/nebPay
		var nebpay = new NebPay();
		var to = dappAddress;
        var value = amount;
        var callFunction = "save";
        var callArgs = '[' + amount + ',' + expiredDate + ',"' + remark + '"]';
        nebpay.call(to, value, callFunction, callArgs, {
            listener: function(resp) {
                console.log(JSON.stringify(resp));
				alert("操作成功，请到锁仓记录页面查看你的锁仓");
            }
        });
	});
	
	

	
	loadRecords();
	

});

function unlock(key){
		if(isNaN(key)){
			alert("操作失败。");
			return;
		}
		
		var NebPay = require("nebpay"); //https://github.com/nebulasio/nebPay
		var nebpay = new NebPay();
		var to = dappAddress;
        var value = "0";
        var callFunction = "unlock";
        var callArgs = '[' + key + ']';
        nebpay.call(to, value, callFunction, callArgs, {
            listener: function(resp) {
                console.log(JSON.stringify(resp));
				alert("请到钱包查看NAS是否到账。");
				loadRecords();
            }
        });
	};
	
	
function loadRecords(){
		var NebPay = require("nebpay"); //https://github.com/nebulasio/nebPay
		var nebpay = new NebPay();

        var to = dappAddress;
        var value = "0";
        var callFunction = "get";
        var callArgs = "[]";
        nebpay.simulateCall(to, value, callFunction, callArgs, {
            listener: function(resp) {
                //console.log(JSON.stringify(resp.result));
                var result = JSON.parse(JSON.parse(resp.result));

                var str = "";
				if(result.length > 0){
					$("#walletdispaly").html("注意：只有在锁仓日期到了之后，才能解锁。解锁时，NAS会返回到锁仓时所用的钱包。<br>钱包："+result[0].walletAddress);
				}
                for(var i =0; i< result.length; i++){
					var obj = result[i];
					str += '<tr> ';
					str += '<td class="body-item mbr-fonts-style display-7">';
					str += i+1;
					//str += '</td><td class="body-item mbr-fonts-style display-7">';
					//str += obj.walletAddress;
					str += '</td><td class="body-item mbr-fonts-style display-7">';
					str += new Date(obj.createdDate * 1000).toLocaleString();
					str += '</td><td class="body-item mbr-fonts-style display-7">';
					str += obj.amount;
					str += '</td><td class="body-item mbr-fonts-style display-7">';
					str += new Date(obj.expiredDate * 1000).toLocaleString();
					str += '</td><td class="body-item mbr-fonts-style display-7">';
					str += obj.remark;
					str += '</td><td class="body-item mbr-fonts-style display-7">';
					if(obj.itemStatus == "0"){
						str += "等待解锁";
						var currentDate = new Date();
						var currentDateTimestamp = Date.parse(currentDate)/1000;
						
						if(currentDateTimestamp >= obj.expiredDate){
							str += '<span class="input-group-btn" ><input value="解锁" style="background-color:#068587" type="button" class="btn btn-form btn-white-outline display-4" onclick="unlock('+obj.key+')"/></span>';							
						}else{
							str += '<span class="input-group-btn" ><input value="解锁" style="background-color:#068587" type="button" class="btn btn-form btn-white-outline display-4" onclick="alert(' + "'未到解锁日期。'" + ');return;"/></span>';
						}
						
					}else{
						str += "已经解锁";
					}					

					str += '</td></tr>';						
							
				}
						
				$("#lockresult").html(str);
                //console.log(tempStr);
                
            }
        });
	};