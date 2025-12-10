/**
 * 异步数据加载器模块 - 改进版
 * 修复了错误处理和降级数据机制
 */

const DataLoader = (function() {
    // 私有变量
    let gdpData = null;
    let growthData = null;
    let citiesMeta = null;
    
    // 加载状态
    const loadStates = {
        gdp: { loaded: false, loading: false, error: null },
        growth: { loaded: false, loading: false, error: null },
        meta: { loaded: false, loading: false, error: null }
    };
    
    // 加载进度回调
    let progressCallback = null;
    
    // 降级数据
    const fallbackData = {
        gdp: {
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
            "钦州市": [417.37, 835.99, 1325.42]
        },
        growth: {
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
        meta: {
            cities: [
                "南宁市", "柳州市", "桂林市", "玉林市", "百色市",
                "北海市", "梧州市", "贵港市", "崇左市", "河池市", 
                "防城港市", "来宾市", "贺州市", "钦州市"
            ],
            quarters: ["2025年一季度", "2025年二季度", "2025年三季度"],
            quarterShort: ["Q1", "Q2", "Q3"],
            colorPalette: [
                "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe",
                "#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fee2e2",
                "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"
            ]
        }
    };
    
    /**
     * 计算加载进度
     */
    function calculateProgress() {
        const total = 3;
        let loaded = 0;
        let inProgress = 0;
        
        Object.values(loadStates).forEach(state => {
            if (state.loaded) loaded++;
            if (state.loading) inProgress++;
        });
        
        // 基础进度 + 加载中的额外进度
        let progress = Math.round((loaded / total) * 80);
        if (inProgress > 0) {
            progress += Math.round((inProgress / total) * 20);
        }
        
        return Math.min(progress, 100);
    }
    
    /**
     * 更新进度
     */
    function updateProgress() {
        if (progressCallback && typeof progressCallback === 'function') {
            const progress = calculateProgress();
            const state = {
                progress,
                gdpLoaded: loadStates.gdp.loaded,
                growthLoaded: loadStates.growth.loaded,
                metaLoaded: loadStates.meta.loaded,
                errors: getLoadErrors()
            };
            try {
                progressCallback(state);
            } catch (error) {
                console.error('进度回调执行出错:', error);
            }
        }
    }
    
    /**
     * 异步加载JSON数据
     */
    async function loadJSON(url, type) {
        // 防止重复加载
        if (loadStates[type].loading) {
            console.log(`${type}数据正在加载中，跳过重复请求`);
            return Promise.resolve(getStoredData(type));
        }
        
        if (loadStates[type].loaded) {
            console.log(`${type}数据已加载，直接返回`);
            return Promise.resolve(getStoredData(type));
        }
        
        loadStates[type].loading = true;
        loadStates[type].error = null;
        updateProgress();
        
        console.log(`开始加载${type}数据: ${url}`);
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`${type}数据加载失败: HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // 验证数据格式
            if (!validateData(data, type)) {
                throw new Error(`${type}数据格式无效`);
            }
            
            // 存储数据
            setStoredData(type, data);
            
            loadStates[type].loaded = true;
            loadStates[type].loading = false;
            
            console.log(`✅ ${type}数据加载成功`);
            updateProgress();
            
            return data;
            
        } catch (error) {
            console.error(`❌ ${type}数据加载失败:`, error.message);
            
            // 使用降级数据
            loadStates[type].error = error.message;
            loadStates[type].loading = false;
            
            const fallback = fallbackData[type];
            if (fallback) {
                console.warn(`⚠️ 使用${type}的降级数据`);
                setStoredData(type, fallback);
                loadStates[type].loaded = true;
                updateProgress();
                return fallback;
            }
            
            updateProgress();
            throw error;
        }
    }
    
    /**
     * 验证数据格式
     */
    function validateData(data, type) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        switch(type) {
            case 'gdp':
            case 'growth':
                return Object.keys(data).length > 0;
            case 'meta':
                return data.cities && Array.isArray(data.cities) && data.cities.length > 0;
            default:
                return true;
        }
    }
    
    /**
     * 获取存储的数据
     */
    function getStoredData(type) {
        switch(type) {
            case 'gdp': return gdpData;
            case 'growth': return growthData;
            case 'meta': return citiesMeta;
            default: return null;
        }
    }
    
    /**
     * 设置存储的数据
     */
    function setStoredData(type, data) {
        switch(type) {
            case 'gdp': 
                gdpData = data;
                break;
            case 'growth': 
                growthData = data;
                break;
            case 'meta': 
                citiesMeta = data;
                break;
        }
    }
    
    /**
     * 获取加载错误
     */
    function getLoadErrors() {
        const errors = {};
        if (loadStates.gdp.error) errors.gdp = loadStates.gdp.error;
        if (loadStates.growth.error) errors.growth = loadStates.growth.error;
        if (loadStates.meta.error) errors.meta = loadStates.meta.error;
        return errors;
    }
    
    // 公共API
    return {
        /**
         * 初始化并加载所有数据
         */
        async init(onProgress = null) {
            progressCallback = onProgress;
            
            console.log('🚀 开始加载所有数据...');
            
            // 并行加载所有数据
            const loadPromises = [
                this.loadGDPData(),
                this.loadGrowthData(),
                this.loadMetaData()
            ];
            
            try {
                const results = await Promise.allSettled(loadPromises);
                
                // 检查结果
                const successfulLoads = results.filter(r => r.status === 'fulfilled').length;
                const allLoaded = this.isAllLoaded();
                
                if (successfulLoads > 0 || allLoaded) {
                    const errors = this.getLoadErrors();
                    const hasErrors = Object.keys(errors).length > 0;
                    
                    console.log(`📊 数据加载完成: ${successfulLoads}/3 成功, 错误: ${hasErrors ? '有' : '无'}`);
                    
                    return {
                        success: true,
                        hasErrors,
                        gdpData,
                        growthData,
                        citiesMeta,
                        errors: hasErrors ? errors : null
                    };
                } else {
                    throw new Error('所有数据加载失败');
                }
            } catch (error) {
                console.error('数据初始化失败:', error);
                throw error;
            }
        },
        
        /**
         * 加载GDP数据
         */
        async loadGDPData() {
            return loadJSON('data/gdp-data.json', 'gdp');
        },
        
        /**
         * 加载增长率数据
         */
        async loadGrowthData() {
            return loadJSON('data/growth-data.json', 'growth');
        },
        
        /**
         * 加载元数据
         */
        async loadMetaData() {
            return loadJSON('data/cities-meta.json', 'meta');
        },
        
        /**
         * 按需加载城市数据
         */
        async loadCityData(cityName) {
            if (!this.isAllLoaded()) {
                await this.init();
            }
            
            return {
                city: cityName,
                gdp: gdpData?.[cityName] || [0, 0, 0],
                growth: growthData?.[cityName] || [0, 0, 0],
                quarters: citiesMeta?.quarterShort || ['Q1', 'Q2', 'Q3']
            };
        },
        
        /**
         * 检查所有数据是否已加载
         */
        isAllLoaded() {
            return loadStates.gdp.loaded && 
                   loadStates.growth.loaded && 
                   loadStates.meta.loaded;
        },
        
        /**
         * 获取加载状态
         */
        getLoadStates() {
            return { ...loadStates };
        },
        
        /**
         * 获取加载错误
         */
        getLoadErrors,
        
        /**
         * 获取已加载的数据
         */
        getData() {
            return {
                gdpData,
                growthData,
                citiesMeta,
                cities: citiesMeta?.cities || []
            };
        },
        
        /**
         * 重新加载数据
         */
        async reload() {
            console.log('🔄 重新加载数据...');
            
            // 重置状态
            gdpData = null;
            growthData = null;
            citiesMeta = null;
            
            Object.keys(loadStates).forEach(key => {
                loadStates[key] = { loaded: false, loading: false, error: null };
            });
            
            updateProgress();
            return this.init(progressCallback);
        },
        
        /**
         * 测试数据连接
         */
        async testConnection() {
            const testUrls = [
                'data/gdp-data.json',
                'data/growth-data.json', 
                'data/cities-meta.json'
            ];
            
            const results = [];
            
            for (const url of testUrls) {
                try {
                    const response = await fetch(url, { method: 'HEAD' });
                    results.push({
                        url,
                        ok: response.ok,
                        status: response.status
                    });
                } catch (error) {
                    results.push({
                        url,
                        ok: false,
                        error: error.message
                    });
                }
            }
            
            return results;
        }
    };
})();

// 导出为全局变量
if (typeof window !== 'undefined') {
    window.DataLoader = DataLoader;
}

// 导出模块
if (typeof exports !== 'undefined') {
    exports.DataLoader = DataLoader;
}