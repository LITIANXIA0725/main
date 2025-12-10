// processed_data.js
// 广西各市GDP数据处理结果
// 数据来源：各市季度数据.pdf 和 广西GDP_2025年季度累计值_聚汇数据.pdf
// 处理时间：2024年5月

// ============ 数据说明 ============
// 本文件包含广西14个地级市2025年季度GDP数据
// 数据包括：GDP累计值（亿元）和累计增长率（%）
// 注：钦州市2025年一季度GDP数据在原始数据中缺失，已基于趋势进行合理估算

const GuangxiGDPData = {
    // 城市列表（按GDP总量排序）
    cities: [
        "南宁市", "柳州市", "桂林市", "玉林市", "百色市",
        "北海市", "梧州市", "贵港市", "崇左市", "河池市", 
        "防城港市", "来宾市", "贺州市", "钦州市"
    ],
    
    // 季度标签
    quarters: ["2025年一季度", "2025年二季度", "2025年三季度"],
    quarterShort: ["Q1", "Q2", "Q3"],
    
    // 各市2025年各季度GDP累计值（亿元）
    // 数据来源：广西GDP_2025年季度累计值_聚汇数据.pdf
    gdpData: {
        "南宁市": [1508.09, 3053.09, 4688.69],
        "柳州市": [720.03, 1456.63, 2230.99],
        "桂林市": [590.40, 1151.85, 1821.17],
        "玉林市": [562.77, 1108.10, 1752.39],
        "百色市": [484.66, 991.48, 1523.64],
        "北海市": [435.84, 917.92, 1409.89],
        "梧州市": [375.66, 785.89, 1206.41],
        "贵港市": [368.41, 727.04, 1169.00],
        "崇左市": [335.09, 650.73, 993.59],
        "河池市": [321.33, 669.91, 1036.14],
        "防城港市": [262.15, 573.13, 887.47],
        "来宾市": [230.34, 477.49, 758.12],
        "贺州市": [221.78, 451.71, 684.11],
        "钦州市": [417.37, 835.99, 1325.42]  // 注：一季度数据为估算值
    },
    
    // 各季度GDP累计增长率（%）
    // 数据来源：各市季度数据.pdf
    growthData: {
        "南宁市": [5.3, 3.7, 4.2],
        "柳州市": [4.6, 7.0, 6.7],
        "桂林市": [5.0, 4.8, 4.0],
        "玉林市": [6.3, 6.1, 6.0],
        "百色市": [6.2, 6.0, 6.3],
        "北海市": [6.4, 3.3, 5.3],
        "梧州市": [6.8, 6.8, 5.7],
        "贵港市": [5.0, 6.0, 5.4],
        "崇左市": [7.3, 7.2, 6.5],
        "河池市": [5.5, 4.4, 4.4],
        "防城港市": [7.3, 7.5, 7.0],
        "来宾市": [5.9, 6.3, 6.2],
        "贺州市": [7.4, 7.2, 5.1],
        "钦州市": [5.9, 6.3, 5.2]
    },
    
    // 数据统计摘要
    summary: {
        totalCities: 14,
        totalGDP2025Q3: 21487.03,  // 2025前三季度全区GDP总量（亿元）
        maxGrowthCity: "防城港市",  // 最高累计增长率城市
        maxGrowthRate: 7.5,         // 最高累计增长率（%）
        nanningGrowth: 4.2          // 南宁市前三季度增长率
    },
    
    // 数据处理说明
    dataProcessing: {
        source1: "各市季度数据.pdf - 包含各市GDP累计增长率数据",
        source2: "广西GDP_2025年季度累计值_聚汇数据.pdf - 包含各市GDP累计值数据",
        aiProcessing: "使用AI工具从PDF文件中提取表格数据",
        dataCleaning: "数据格式转换、缺失值处理、数据验证",
        estimationNote: "钦州市2025年一季度GDP数据缺失，基于其二季度数据和增长趋势估算为417.37亿元"
    },
    
    // 数据导出函数
    getCityGDPData: function(cityName) {
        return this.gdpData[cityName] || [];
    },
    
    getCityGrowthData: function(cityName) {
        return this.growthData[cityName] || [];
    },
    
    getAllCitiesGDP: function(quarterIndex) {
        const result = {};
        this.cities.forEach(city => {
            result[city] = this.gdpData[city][quarterIndex];
        });
        return result;
    },
    
    calculateQuarterGrowth: function(cityName) {
        const gdpData = this.gdpData[cityName];
        if (!gdpData) return [];
        
        const quarterGrowth = [];
        for (let i = 0; i < gdpData.length; i++) {
            if (i === 0) {
                quarterGrowth.push(null);
            } else {
                const growth = ((gdpData[i] - gdpData[i-1]) / gdpData[i-1] * 100).toFixed(1);
                quarterGrowth.push(parseFloat(growth));
            }
        }
        return quarterGrowth;
    },
    
    // 按GDP排序函数
    getCitiesSortedByGDP: function(quarterIndex) {
        return [...this.cities].sort((a, b) => 
            this.gdpData[b][quarterIndex] - this.gdpData[a][quarterIndex]
        );
    }
};

// 导出数据供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuangxiGDPData;
}

console.log("广西GDP数据加载完成");
console.log("城市数量:", GuangxiGDPData.summary.totalCities);
console.log("2025前三季度全区GDP总量:", GuangxiGDPData.summary.totalGDP2025Q3 + "亿元");