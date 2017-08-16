var user = require("./user.js");
// 载入模块
var Segment = require('segment');
// 创建实例
var segment = new Segment();
// 使用默认的识别模块及字典，载入字典文件需要1秒，仅初始化时执行一次即可
segment.useDefault();

//去重
function isRepeated(array,item) {
    for (var i in array){
        if (array[i].w === item.w){
            return true;
        }
    }
    return false;
}
//依权重排序
function orderByWeight(array) {
    for (var i = 1; i < array.length; ++i)
    {
        var j = i,
            value = array[i].weight;
        while (j > 0 && array[j - 1].weight< value)
        {
            array[j].weight = array[j - 1].weight;
            --j;
        }
        array[j].weight = value;
    }
    return array;
}
//分词
function splitText(text,convert/*Boolean*/) {
    //排序方式
    //人名|0x00000080|100,机构团体|0x00000020|80,外文字符0x00000010|70,其他专名0x00000008|70,名词 名语素|0x00100000|70;数量词0x00200000|60; 数词 数语素|0x00400000|60;地名|0x00000040|60;形容词 形语素|0x40000000|50,网址、邮箱地址0x00000001,0x00200000|70;
    //其他剔除
    var ordResult = [];
    //分配权重
    function allocateWeight(array) {
        array.forEach(function (t) {
            switch (parseInt(t.p)){
                //人名
                case 128:
                    t.weight?t.weight += 100:t.weight=100;
                    if(!isRepeated(ordResult,t)) ordResult.push(t);
                    break;
                //机构团体
                case 32:
                    t.weight?t.weight += 80:t.weight=80;
                    if(!isRepeated(ordResult,t)) ordResult.push(t);
                    break;
                //外文字符
                case 16:
                //其他专名
                case 8:
                //名词
                case 1048576:
                    t.weight?t.weight += 70:t.weight=70;
                    if(!isRepeated(ordResult,t)) ordResult.push(t);
                    break;
                //数量词
                case 2097152:
                //数词
                case 4194304:
                //地名
                case 64:
                    t.weight?t.weight += 60:t.weight=60;
                    if(!isRepeated(ordResult,t)) ordResult.push(t);
                    break;
                //形容词
                case 1073741824:
                    t.weight?t.weight += 40:t.weight=40;
                    if(!isRepeated(ordResult,t)) ordResult.push(t);
                    break;
                //网址邮箱
                case 1:
                    t.weight?t.weight += 40:t.weight=40;
                    if(!isRepeated(ordResult,t)) ordResult.push(t);
                    break;
            }
        });
    }
    //未转换
    var result = segment.doSegment(text);
    allocateWeight(result);
    if(convert){
        //转换
        result = segment.doSegment(text,{
            convertSynonym: true
        });
        allocateWeight(result);
    }
    return orderByWeight(ordResult);
}

//①全文匹配 权重1000
function allCompare(key,query,callback) {
    user
        .where(key,new RegExp(query))
        .exec(function (err,result) {
            if(err){
                callback(err,null);
            }else {
                result.forEach(function (t) {
                    t.weight?t.weight+=1000:t.weight=1000;
                    //记录匹配
                    t.keywords?t.keywords+=";"+query+";":t.keywords=query+";";
                });
                callback(err,result);
            }
        });
}
//②关键词匹配
function keyWordCompare(key,keywords,callback) {
    var i = 0;
    var arr = [];
    iterator(i);
    function iterator(i) {
        user
            .where(key,new RegExp(keywords[i].w))
            .exec(function (err,result) {
                if(err) {callback(err,null);}
                else{
                    result.forEach(function (t) {
                        t.weight?t.weight+=keywords[i].weight:t.weight=keywords[i].weight;
                        //记录每个匹配关键词
                        t.keywords?t.keywords+=";"+keywords[i].w+";":t.keywords=keywords[i].w+";";
                        for (var j in arr){
                            //可能需要修改比较条件-content耗时-仅做测试用
                            if(arr[j].content == t.content){
                                arr[j].weight += t.weight;
                                arr[j].keywords += ";"+t.keywords+";";
                                return;
                            }
                        }
                        arr.push(t);
                    });
                    i++;
                    if(i >= keywords.length) callback(err,arr);
                    else iterator(i);
                }
            });
    }
}

//控制器
function search(key,query,callback) {
    var list = [];var i = 0;
    //全文匹配
    allCompare(key,query,function (err,allResult) {
        if(err) callback(err,null);
        allResult.forEach(function (t) { list.push(t); });
        //分词-默认开启同义转换
        var keywords = splitText(query,true);
        keyWordCompare(key,keywords,function (err,keywordResult) {
            if(err) {callback(err,null);}
            else {
                keywordResult.forEach(function (t) {
                    for (var i in list){
                        //可能需要修改比较条件-content耗时-仅作测试用
                        if(list[i].content == t.content){
                            list[i].weight += t.weight;
                            //记录匹配的关键字
                            list[i].keywords += t.keywords;
                            return;
                        }
                    }
                    list.push(t);
                });
                // // 对所有结果进行排序
                list = orderByWeight(list);
                callback(err,list);
            }
        });
    })
}

//分页(页码从第一页始)
function pages(data,counts,pageNum) {
    var result = [],
        start = parseInt(counts*(pageNum-1)),
        to = counts*pageNum>=data.length?data.length:counts*pageNum;
    for (var i = start;i<to;i++){
        result.push(data[i]);
    }
    return result;
}

search("content","北京师范大学物理老师，有丰富的教学经验",function (err,result) {
    if(err) console.log(err);
    else {
        //每页两条数据，获取第二页
        result = pages(result,2,2);
        console.log(result.length);
        result.forEach(function (t) {
            console.log(t+"=>"+t.weight+"=>"+t.keywords);
        })
    }
});