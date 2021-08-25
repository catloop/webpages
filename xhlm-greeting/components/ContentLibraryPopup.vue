<template>
    <van-popup
        v-if="popupExsist"
        v-model="showPopup"
        @close="$emit('close')"
        @closed="onPopupClosedHandler"
        position="bottom"
        class="content-library-popup"
    >
        <div class="header">
            <div class="search-container">
                <search-bar
                    placeholder="搜索内容库"
                    :value="searchText"
                    @search="onSearchHandler"
                    class="search-bar"
                ></search-bar>
                <button class="favorite-btn"></button>                
            </div>

            <div class="categories-container">
                <div class="category-list">
                    <button
                        v-for="category in categories"
                        :key="category.id"
                        @click="onCategoryClickHandler(category)"
                        class="category-item"
                        :class="{ 'active': category.id === currentCategory }"
                    >{{ category.name }}</button>
                </div>
            </div>

            <div v-if="subCategories.length" class="sub-category-container">
                <div class="sub-category-list">
                    <button
                        v-for="subCate in subCategories"
                        :key="subCate.id"
                        @click="onSubCategoryClickHandler(subCate)"
                        :class="{ 'active': subCate.id === currentSubCategory }"
                        class="sub-category-item"
                    >{{ subCate.name }}</button>
                </div>
            </div>
        </div>

        <scroll-load
            @load="onContentListLoadHandler"
            ref="scrollLoad"
            class="content-container"
        >
            <template v-if="contents.length">
                <ul class="content-list">
                    <li
                        v-for="content in contents"
                        :key="content.id"
                        class="content-item"
                    >
                        <img
                            :src="content.picUrl"
                            :alt="content.title"
                            class="cover"
                        />
                        <h4 class="title">{{ content.title }}</h4>
                        <p class="description">{{ content.content }}</p>
                        <button
                            @click="onClickUseBtnHandler(content)"
                            class="btn btn-primary btn-small btn-rounded"
                        >使用它</button>
                    </li>
                </ul>

                <p v-if="finished" class="finished-tip">没有更多了</p>
            </template>

            <div
                v-else-if="finished"
                class="empty-placeholder"
            >
                <template v-if="inSearch">
                    没有搜索结果
                    <button
                        @click="resetSearch"
                        class="btn btn-rounded btn-middle btn-primary"
                    >返回</button>
                </template>
                <template v-else>
                    没有内容
                </template>
            </div>
        </scroll-load>
    </van-popup>
</template>

<script>
/**
 * @typedef Content
 * @property {number} id 内容 ID
 * @property {string} title 标题
 * @property {string} content 描述文本
 * @property {string} picUrl 封面图
 * @property {number} categoryId 分类 ID
 */

/**
 * @typedef {'image' | 'anchor' | 'mini-program' ｜ 'service'} AttachmentType
 */

/**
 * @typedef Attachment
 * @property {string} id 素材 id
 * @property {AttachmentType} type 素材类型
 * @property {string} cover 素材封面图片
 * @property {Object} raw 素材库中的源数据
 */

/**
 * @typedef Category 分类
 * @property {string} id 分类 id
 * @property {string} name 分类名称
 */

/**
 * 默认内部状态
 */
function getDefaultData() {
    return {
        popupExsist: false,
        showPopup: false,
        searchText: '',
        inSearch: false,
        categories: [],
        subCategories: [],
        currentCategory: null,
        currentSubCategory: null,
        contents: [],
        page: 0,
        finished: false
    };
}

var categoryCache = null;
var contentCacheMap = Object.create(null);
var subCateCacheMap = Object.create(null);

var CONTENT_PAGE_SIZE = 10;
var CORP_ID = 'ww40a2539b2c3a7d78';

/**
 * 显示高层击的 loading toast
 * @param {string} text
 * @return {vant.Toast} toast 组件实例
 */
function showHighLevelLoading(text) {
    text = text || '加载中';
    var toast = vant.Toast.loading({ message: text, duration: 0, forbidClick: true });
    setTimeout(function() {
        toast.$el.style.zIndex = Math.max.apply([], [].concat([...document.querySelectorAll('[style]')])
            .filter(function(element) { return element !== toast.$el && element.style.zIndex })
            .map(function(element) { return ~~element.style.zIndex })) + 100;
    });
    return toast;
}

module.exports = {
    name: 'ContentLibraryPopup',
    components: {
        SearchBar: httpVueLoader('./SearchBar.vue'),
        ScrollLoad: httpVueLoader('./ScrollLoad.vue')
    },
    props:  {
        show: Boolean
    },
    watch: {
        show: function(value) {
            if (value) return this.openPopup();
            this.showPopup = false;
        }
    },
    computed: {
        /** 
         * 当前素材类型，输出给 Attachment 组件用于显示
         * @return {AttachmentType}
         */
        currentAttachmentType: function() {
            var _this = this;
            var currentSubCategory = this.subCategories.find(function(subCate) { return subCate.id === _this.currentSubCategory });
            if (!currentSubCategory) return;
            switch (currentSubCategory.materialType) {
                case 7:
                    return 'image';
                case 14:
                    return 'mini-program';
                default:
                    return 'anchor';
            }
        }
    },
    data: getDefaultData,
    methods: {
        /**
         * 重置内部状态
         */
        resetData: function() {
            var _this = this;
            var defaultData = getDefaultData();
            Object.keys(defaultData).forEach(function(key) {
                _this[key] = defaultData[key];
            });
        },
        /**
         * 显示弹层
         * @returns {void}
         */
        openPopup: function() {
            var _this = this;
            this.resetData();
            this.initCurrentCategory();
            this.popupExsist = true;
            this.$nextTick(function() {
                _this.showPopup = true;
            });
        },
        /**
         * 弹层关闭行为
         * @returns {void}
         */
        onPopupClosedHandler: function() {
            var _this = this;
            this.$nextTick(function() {
                _this.popupExsist = false;
            });
        },
        /**
         * 初始化选中分类
         * @returns {void}
         */
        initCurrentCategory: function() {
            var _this = this;
            var toast = showHighLevelLoading();
            return this.getGategories()
                .then(function() {
                    var firstCate = _this.categories[0];
                    if (!firstCate) {
                        _this.resetContents();
                        return toast.clear();
                    }
                    return _this.switchToCategory(firstCate).then(toast.clear);
                });
        },
        /**
         * 切换至分类
         * @param {Category} category
         * @return {Promise<void>}
         */
        switchToCategory: function(category) {
            var _this = this;
            this.currentCategory = category.id;
            return this.getSubCategories().then(function() {
                var firstSubCate = _this.subCategories[0];
                if (!firstSubCate) return _this.resetContents();
                return _this.switchToSubCategory(firstSubCate);
            });
        },
        /**
         * 点击分类
         * @param {Category} category
         */
        onCategoryClickHandler: function(category) {
            if (this.currentCategory === category.id) return;
            var toast = showHighLevelLoading();
            this.switchToCategory(category).then(toast.clear);
        },
        /**
         * 切换至子分类
         * @param {Category} subCategory
         * @return {Promise<void>}
         */
        switchToSubCategory: function(subCategory) {
            this.currentSubCategory = subCategory.id;
            this.resetSearch();
            this.resetContents();
            return this.getContents();
        },
        /**
         * 点击子分类
         * @param {Category} category
         */
        onSubCategoryClickHandler: function(subCategory) {
            if (this.currentSubCategory === subCategory.id) return;
            var toast = showHighLevelLoading();
            this.switchToSubCategory(subCategory).then(toast.clear);
        },
        /**
         * 搜索
         * @returns {void}
         */
        onSearchHandler: function(searchText) {
            if (!searchText) return this.resetSearch();
            this.searchText = searchText;
            this.inSearch = true;
            var toast = showHighLevelLoading('搜索中');
            this.resetContents();
            this.getContents().then(toast.clear);
        },
        /**
         * 点击“使用它”按钮
         * @param {Content} content 内容对象
         * @returns {void}
         */
        onClickUseBtnHandler: function(content) {
            // 组装成 Attachment 组件使用的数据，添加额外字段 raw 存放从接口取出的源数据
            this.$emit('select', {
                id: content.id,
                cover: content.picUrl,
                type: this.currentAttachmentType,
                raw: content
            });
        },
        /**
         * 获取主分类
         * @return {Promise<void>}
         */
        getGategories: function() {
            var _this = this;
            if (categoryCache) {
                this.categories = categoryCache;
                return Promise.resolve();
            }
            return axios.post(
                window['__API'].findTempBar,
                Qs.stringify({ corpId: CORP_ID })
            ).then(function(response) {
                if (!response.data.success) return;
                _this.categories = response.data.data;
                categoryCache = response.data.data;
            });
        },
        /**
         * 获取子分类
         * @return {Promise<void>}
         */
        getSubCategories: function() {
            var _this = this;
            var subCategories = subCateCacheMap[this.currentCategory];
            if (subCategories) {
                this.subCategories = subCategories;
                return Promise.resolve();
            }
            return axios.post(
                window['__API'].findMaterialCategory,
                Qs.stringify({
                    corpId: CORP_ID,
                    categoryId: this.currentCategory,
                    isRoot: false
                })
            ).then(function(response) {
                if (!response.data.success) return;
                _this.subCategories = response.data.data;
                subCateCacheMap[_this.currentCategory] = response.data.data;
            });
        },
        /**
         * 重置内容列表
         * @return {void}
         */
        resetContents: function() {
            this.contents = [];
            this.page = 0;
            this.finished = false;
            setTimeout(function() {
                this.$refs.scrollLoad && this.$refs.scrollLoad.resetScroll();
            });
        },
        /** 重置搜索
         * @return {void}
         */
        resetSearch: function() {
            this.inSearch = false;
            this.searchText = '';
        },
        /**
         * 获取内容列表
         * @return {Promise<void>}
         */
        getContents: function() {
            var _this = this;
            if (!this.inSearch) {
                var content = contentCacheMap[this.currentSubCategory];
                if (content) {
                    this.finished = content.finished;
                    this.page = content.page;
                    this.contents = content.data;
                    if (content.finished) return Promise.resolve();
                }
            }
            return axios.post(
                window['__API'].findMaterialPgByParam,
                Qs.stringify({
                    pageNo: _this.page + 1,
                    pageSize: CONTENT_PAGE_SIZE,
                    title: _this.inSearch ? _this.searchText : '',
                    categoryId: _this.currentSubCategory,
                    status: 1,
                    goodsStatusSearch: 1,
                    isRoot: false,
                    corpId: CORP_ID
                })
            ).then(function(response) {
                if (!response.data.success) return;
                var content = {
                    data: _this.contents.concat(response.data.data.data),
                    page: _this.page + 1,
                    finished: response.data.data.data.length < CONTENT_PAGE_SIZE
                };
                _this.contents = content.data;
                _this.page = content.page;
                _this.finished = content.finished;
                if (!_this.inSearch) contentCacheMap[_this.currentSubCategory] = content;
            });
        },
        /** 内容列表触底加载
         * @return {void}
        */
        onContentListLoadHandler: (function() {
            var inLoad = false;
            return function() {
                if (inLoad || this.finished) return;
                inLoad = true;
                var toast = showHighLevelLoading();
                this.getContents().then(function() {
                    inLoad = false;
                    toast.clear();
                });
            }
        })()
    }
};
</script>

<style src="./css/components/ContentLibraryPopup.css" scoped />
