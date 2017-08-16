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

// user.create({
//     content: "中央民族大学研一，求初高中家教，大一开始一直兼职家教\n" +
//     "家教经验丰富，从大一开始就利用课余时间做兼职家教，初高中学生均辅导过，而且根据每个学生不\n" +
//     "同的学习基础来调节自己的讲课方法，\n" +
//     "学生收获很大，学习成绩进步很大。\n" +
//     "研一辅导一个初中男孩英语，他调皮贪玩，学习成绩很差，经常不及格，但是通过接触我发现他很聪\n" +
//     "明。根据他的情况，我选择放慢讲课速\n" +
//     "度，要求他每道题都要写清步骤，做题思路，帮他养成认真的好习惯，通过我一个月的辅导，他的学\n" +
//     "习成绩有了很大的进步。"
// });
//
// user.create({
//     content: "我的性格开朗，能够和孩子家长一同构建轻松愉悦的氛围，而且我的理科成绩一直是我高中的强项，不管是数学，物理，化学我都有自己独到的学习方法，并且我和乐意与孩子一同分享我高中，初中的学习经历，不单单回忆过去的往事，同时也是让我和孩子产生共鸣，拉近师生的关系，彼此达到一同进步的目的。"
// });
//
// user.create({
//     content: "授课经验：我在新东方工作8年任，教学组组长能够准确的把握，曾经多次开展讲座，曾参加过2011年高考英\n" +
//     "语阅卷，能够准确把握初高中英语的考点。\n" +
//     "      授课风格：课上幽默教学，和学生打成一片，但又不缺乏严格和严肃，收缩自如。擅长带的学生有三\n" +
//     "类：1，基础较差的学生    2，基础中等，想拔高的学生   3，厌学，调皮的学生。教学案例：1，有个学生A，基础\n" +
//     "很差，辅导前成绩60多分（满分150），对待学习没有兴趣，但又迫于高考的压力不得不补课，我先从完形开始，\n" +
//     "帮助他记忆高频词汇，原来孩子最多对4个，甚至有的时候成功避开所有正确答案，经过一段时间的辅导，他在期末\n" +
//     "考试当中，20个对了14个，从此信心大增，接着我给他细心讲解其他模块，在高考的时候考了97分，考上了北京\n" +
//     "理工大学。2，B学生基础很好，但是不稳定，有的时候考110，有的时候考90，造成这种现象的原因就是没有知识\n" +
//     "框架，存在漏洞，所以我帮她建立知识框架并查漏补缺，最终英语以140分的成绩进入北京外国语大学。交给我，\n" +
//     "您就\n" +
//     "落“放心”俩字，以\"专业\"。\n" +
//     "      收费标准：200---300元/小时。根据年级不同，收费不同，具体预约后电话详谈"
// });
//对关键词进行排序

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
                        for (var j in arr){
                            //可能需要修改比较条件-content耗时-仅做测试用
                            if(arr[j].content == t.content){
                                arr[j].weight += t.weight;
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
                        //可能需要修改比较条件
                        if(list[i].content == t.content){
                            list[i].weight += t.weight;
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

search("content","北京师范大学物理老师，有丰富的教学经验",function (err,result) {
    if(err) console.log(err);
    else {
        console.log(result.length);
        result.forEach(function (t) {
            console.log(t+"=>"+t.weight);
        })
    }
});