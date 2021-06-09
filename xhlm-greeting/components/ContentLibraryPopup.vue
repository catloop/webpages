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
                        v-for="category in contentLibrary.categories"
                        :key="category.id"
                        @click="onCategoryClickHandler(category)"
                        class="category-item"
                        :class="{ 'active': category.id === currentCategory }"
                    >{{ category.name }}</button>
                </div>
            </div>

            <div class="sub-categories">
                <button
                    v-for="subCate in subCategories"
                    :key="subCate.id"
                    @click="currentSubCategory = subCate.id"
                    :class="{ 'active': subCate.id === currentSubCategory }"
                    class="sub-category"
                >{{ subCate.name }}</button>
            </div>
        </div>

        <div class="content-container">
            <ul
                v-if="filteredBySearch.length"
                class="content-list"
            >
                <li
                    v-for="content in filteredBySearch"
                    :key="content.id"
                    class="content-item"
                >
                    <img
                        :src="content.cover"
                        :alt="content.title"
                        class="cover"
                    />
                    <h4 class="title">{{ content.title }}}</h4>
                    <p class="description">{{ content.description }}</p>
                    <button
                        @click="onClickUseBtnHandler(content)"
                        class="btn btn-primary btn-small btn-rounded"
                    >使用它</button>
                </li>
            </ul>

            <div
                v-else
                class="empty-placeholder"
            >
                <template v-if="inSearch">
                    没有搜索结果
                    <button
                        @click="onSearchEmptyBackBtnClickHandler"
                        class="btn btn-rounded btn-middle btn-primary"
                    >返回</button>
                </template>
                <template v-else>
                    没有内容
                </template>
            </div>
        </div>
    </van-popup>
</template>

<script>
/**
 * @typedef Content
 * @property {number} id 内容 ID
 * @property {string} type 内容类型
 * @property {string} title 标题
 * @property {string} description 描述文本
 * @property {string} cover 封面图
 * @property {number} categoryId 分类 ID
 * @property {number} subCategoryId 子分类 ID
 */

/**
 * @typedef Category 分类
 * @property {number} id 分类 id
 * @property {string} name 分类名称
 * @property {Category[]} [subCategories] 子分类
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
        currentCategory: null,
        currentSubCategory: null
    };
}

module.exports = {
    name: 'ContentLibraryPopup',
    components: {
        SearchBar: httpVueLoader('./SearchBar.vue')
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
    computed: Object.assign(Vuex.mapState({
        contentLibrary: function(state) {
            return state.contentLibrary;
        }
    }), {
        /**
         * 通过分类的过滤结果
         * @return {Content[]}
         */
        filteredByCategory: function() {
            var _this = this;
            return this.contentLibrary.data.filter(function(content) {
                return content.categoryId === _this.currentCategory;
            });
        },
        /**
         * 通过子分类的过滤结果
         * @return {Content[]}
         */
        filteredBySubCategory: function() {
            var _this = this;
            return this.filteredByCategory.filter(function(content) {
                return content.subCategoryId === _this.currentSubCategory;
            });
        },
        /**
         * 通过搜索关键字的过滤结果
         * @return {Content[]}
         */
        filteredBySearch: function() {
            var _this = this;
            return this.filteredBySubCategory.filter(function(content) {
                return content.title.includes(_this.searchText) || content.description.includes(_this.searchText);
            });
        },
        /**
         * 当前选中主分类下的子分类列表
         */
        subCategories: function() {
            var _this = this;
            if (!this.currentCategory || !this.currentSubCategory) return [];
            return this.contentLibrary.categories.find(function(category) {
                return category.id === _this.currentCategory;
            }).subCategories;
        }
    }),
    data: getDefaultData,
    methods: Object.assign(Vuex.mapActions({
        getContentLibrary: 'GET_CONTENT_LIBRARY'
    }), {
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
            this.getContentLibrary()
                .then(function() {
                    var firstCate = _this.contentLibrary.categories[0];
                    if (!firstCate) return;
                    _this.setFirstCategoryAndSubAsCurrent(firstCate);
                });
        },
        /**
         * 将指定分类设为选中分类，并设其第一个子分类选中
         * @param {Category} category
         * @return {void}
         */
        setFirstCategoryAndSubAsCurrent: function(category) {
            this.currentCategory = category.id;
            var firstSubCate = category.subCategories[0];
            if (!firstSubCate) return;
            this.currentSubCategory = firstSubCate.id;
        },
        /**
         * 点击分类
         * @param {Category} category
         */
        onCategoryClickHandler: function(category) {
            this.currentCategory = category.id;
            this.setFirstCategoryAndSubAsCurrent(category);
        },
        /**
         * 搜索
         * @returns {void}
         */
        onSearchHandler: function(searchText) {
            this.searchText = searchText;
            this.inSearch = true;
        },
        /**
         * 点击返回退出搜索
         * @returns {void}
         */
        onSearchEmptyBackBtnClickHandler: function() {
            this.searchText = '';
            this.inSearch = false;
        },
        /**
         * 点击“使用它”按钮
         * @param {Content} content 内容对象
         * @returns {void}
         */
        onClickUseBtnHandler: function(content) {
            this.$emit('select', Object.assign({}, content));
        }
    })
};
</script>

<style src="./css/components/ContentLibraryPopup.css" scoped />
