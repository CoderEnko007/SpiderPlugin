const rank_range_objs = {
    'BRONZE_THROUGH_GOLD': '青铜-黄金分段',
    'DIAMOND_FOUR_THROUGH_DIAMOND_ONE': '钻4-钻1分段',
    'DIAMOND_THROUGH_LEGEND': '钻石-传说分段',
    'LEGEND': '传说分段',
    'TOP_1000_LEGEND': '传说Top1000分段'
}

const rank_objs = {
    'Standard': '标准模式',
    'Wild': '狂野模式',
    'Arena': '竞技场', 
    'Duels': '对决模式'
}

function sleep(numberMillis) {
	var now = new Date();
	var exitTime = now.getTime() + numberMillis;
	while (true) {
		now = new Date();
		if (now.getTime() > exitTime) {
            return;
        }
	}
}

function dateFormat(fmt, date) {
    let ret;
    const opt = {
        "Y+": date.getFullYear().toString(),        // 年
        "m+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "M+": date.getMinutes().toString(),         // 分
        "S+": date.getSeconds().toString()          // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return fmt;
}

function firstUpperCase(str) {
    return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
}