var mongoose = require('mongoose');
//配置数据库
var settings = {
    "url" : "mongodb://localhost/user",
    useMongoClient : {useMongoClient:true}
};
//连接数据库
var db = mongoose.createConnection(settings.url,settings.useMongoClient);
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("数据库链接成功");
});
module.exports = db;