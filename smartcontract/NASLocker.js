"use strict";

var NASLocker = function () {
	LocalContractStorage.defineProperty(this, "size");
    LocalContractStorage.defineMapProperty(this, "repo");
	LocalContractStorage.defineMapProperty(this, "myRepo");
};

NASLocker.prototype = {
    init: function () {
        this.size = 0;
    },

    save: function (amount, expiredDate, remark) {
		
		//锁仓金额检查，必须是数字
		if(isNaN(amount)){
			throw new Error("error amount");
		}
		//金额必须大于0
		if(amount <= 0){
			throw new Error("amount value error");
		}
		
		//解锁日期检查
		if(isNaN(expiredDate)){
			throw new Error("error expiredDate");
		}
		
		remark = remark.trim();

        var from = Blockchain.transaction.from;
		var createdDate = Blockchain.transaction.timestamp;
		
		//新建一条锁仓记录
		var item = new Object();
		item.key = this.size;
		item.walletAddress = from;
		item.amount = amount;
		item.createdDate = createdDate;
		item.expiredDate = expiredDate;
		item.remark = remark;
		item.itemStatus = "0";//0等待解锁，1已经解锁
		//保存一条锁仓记录到链上
		
		this.repo.put(this.size, JSON.stringify(item));
		
		//保存该地址对应的锁仓记录的key数组
		var myRepoArr = [];
		var myRepoStr = this.myRepo.get(from);
		if(myRepoStr){
			myRepoArr = JSON.parse(myRepoStr);
		}
		myRepoArr.push(this.size);
		this.myRepo.put(from, JSON.stringify(myRepoArr));
		
		//size加1
		this.size += 1;		
    },

    get: function () {
        var from = Blockchain.transaction.from;
		//取出该地址对应的所有锁仓记录的key
		var myRepoArr = [];
		var myRepoStr = this.myRepo.get(from);
		if(myRepoStr){
			myRepoArr = JSON.parse(myRepoStr);
		}
		
		//遍历key数组，取出该钱包对应的所有锁仓记录
		var resultArr = [];
		for(var i=0; i<myRepoArr.length; i++){
			resultArr.push(JSON.parse(this.repo.get(myRepoArr[i])));
		}
        return JSON.stringify(resultArr);
    },
	
	unlock: function(key){
		var from = Blockchain.transaction.from;
		var currentTimestamp = Blockchain.transaction.timestamp;
		//检查key是否存在
		var itemStr = this.repo.get(key);
		if(!itemStr){
			throw new Error("item doesn't exist");
		}
		
		var item = JSON.parse(itemStr);
		//只有原钱包可以执行解锁
		if(from != item.walletAddress){
			throw new Error("only the original wallet can perfrom the unlock operation");
		}
		
		//记录状态必须是“0”，即等待解锁状态
		if(item.itemStatus != "0"){
			throw new Error("status error");
		}
		
		//必须过了设定的解锁日期，才能解锁
		if(currentTimestamp < item.expiredDate){
			throw new Error("can not unlock before the expiredDate");
		}
		
		//改变锁仓记录的状态，并存入链中
		item.itemStatus = "1";
		this.repo.put(item.key, JSON.stringify(item));
		
		//转解锁的NAS数量给原钱包
		var result = Blockchain.transfer(item.walletAddress, item.amount*1000000000000000000);
		if (!result) {
		  throw new Error(JSON.stringify(result));
		}
		Event.Trigger("NASLocker", {
		  Transfer: {
			from: Blockchain.transaction.to,
			to: item.walletAddress,
			value: item.amount*1000000000000000000
		  }
		});
		
		
	}
};
module.exports = NASLocker;