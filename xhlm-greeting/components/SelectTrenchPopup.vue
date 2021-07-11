<template>
    <van-popup :value="show" position="right" class="select-trench-popup">
        <div class="header">
            <search-bar
                placeholder="搜索渠道"
                :value="searchText"
                @search="onSearchHandler"
            ></search-bar>
        </div>

        <ul
            v-if="filteredTrenchs && filteredTrenchs.length"
            class="content"
        >
            <li
                v-for="trench in filteredTrenchs"
                :key="trench.id"
                @click="onTranchClickHandler(trench)"
                class="trench"
            >
                <van-checkbox
                    :value="isTrenchSelected(trench.id)"
                    class="checkbox"
                ></van-checkbox>
                <img
                    :src="trench.avatar"
                    :alt="trench.name"
                    class="avatar"
                />
                <span class="name">{{ trench.name }}</span>
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
                没有渠道
            </template>
        </div>

        <div class="footer">
            <van-checkbox
                :value="isAllSelected"
                @click="onSelectAllCheckboxClickHandler"
                class="checkbox"
            >全选</van-checkbox>
            <button
                @click="onConfirmHandler"
                class="confirm-btn btn btn-large btn-primary btn-rounded"
            >
                确定
                <span class="select-counter">（已选{{ selectedItems.length }}个渠道）</span>
            </button>
        </div>
    </van-popup>
</template>

<script>
var HASH_PREFIX = 'selectTrench:/';

/**
 * @typedef Trench 渠道
 * @property {number} id 渠道 ID
 * @property {string} name 渠道名称
 * @property {'trench'} type 渠道类型
 * @property {string} avatar 渠道图片
 */

/**
 * 默认组件内状态
 */
function getDefaultData() {
    return {
        selectedItems: [],
        inSearch: false,
        searchText: ''
    };
}

module.exports = {
    name: 'SelectTrenchPopup',
    components: {
        SearchBar: httpVueLoader('./SearchBar.vue')
    },
    props: {
        show: {
            type: Boolean,
            required: true
        }
    },
    computed: Object.assign(Vuex.mapState(['trenchs']), Vuex.mapState({
        scopeItems: function(state) {
            return state.greeting.scopeItems;
        }
    }), {
        /**
         * 过滤的渠道列表，差分常态和搜索
         * @returns {Trench[]}
         */
        filteredTrenchs: function() {
            var _this = this;
            if (this.searchText && this.inSearch) return this.trenchs.filter(function(trench) {
                return trench.name.includes(_this.searchText);
            });
            return this.trenchs;
        },
        /**
         * 是否已经全选
         * @returns {boolean}
         */
        isAllSelected: function() {
            return this.selectedItems.length === this.trenchs.length;
        }
    }),
    watch: {
        show: function(value) {
            if (value) this.openPopup();
        }
    },
    data: function() {
        return getDefaultData();
    },
    methods: Object.assign(Vuex.mapMutations({
        setGreetingScopeItems: 'SET_GREETING_SCOPE_ITEMS',
        setGreetingScopeNumber: 'SET_GREETING_SCOPE_NUMBER'
    }),
    {
        /**
         * hashchange 事件监听监听程序，对目录提供前进后退支持
         * @param {HashChangeEvent} event
         */
        onHashChangeHandler: function(event) {
            var newHash = event.newURL.split('#')[1] || '';
            var oldHash = event.oldURL.split('#')[1] || '';
            // 通过历史记录前进进入，打开弹层
            if (!oldHash && newHash === HASH_PREFIX) return this.openPopup();
            // 未显示时除以上情景，无操作
            if (!this.show) return;
            // 从“包含基础 hash 前缀”回到无 hash 状态时关闭弹层
            if (oldHash.includes(HASH_PREFIX) && !newHash) this.close();
        },
        /**
         * 清除操作留下的历史记录
         * @returns {void}
         */
        clearHistoryStack: function() {
            // 无前缀，不操作
            if (!window.location.hash.includes(HASH_PREFIX)) return;
            // hash 与前缀完全相等，意味着仅打开弹层，位于根目录，后退一次即可
            if (window.location.hash.split('#').pop() === HASH_PREFIX) return history.back();
        },
        /**
         * 搜索
         * @param {string} 搜索文本
         * @returns {void}
         */
        onSearchHandler: function(value) {
            this.searchText = value;
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
         * 切换渠道选择状态
         * @param {number} trench 渠道对象
         * @returns {void}
         */
        onTranchClickHandler: function(trench) {
            if (this.selectedItems.some(function(t) {
                return t.id === trench.id;
            })) return this.selectedItems = this.selectedItems.filter(function(t) {
                return t.id !== trench.id;
            });
            this.selectedItems.push(trench);
        },
        /**
         * 渠道是否被选择
         * @param {number} trenchId 渠道 ID
         * @returns {boolean}
         */
        isTrenchSelected: function(trenchId) {
            return this.selectedItems.some(function(trench) {
                return trench.id === trenchId;
            });
        },
        /**
         * 全选复选框点击
         * @returns {void}
         */
        onSelectAllCheckboxClickHandler: function() {
            this.selectedItems = this.isAllSelected
                ? []
                : [].concat(this.trenchs);
        },
        /**
         * 初始化组件状态
         * @returns {void}
         */
        initData: function() {
            var _this = this;
            var defaultData = getDefaultData();
            Object.keys(defaultData).forEach(function(key) {
                _this[key] = defaultData[key];
            });
            this.selectedItems = [].concat(this.scopeItems);
        },
        /**
         * 打开弹层
         * @returns {void}
         */
        openPopup: function() {
            this.initData();
            window.location.hash = HASH_PREFIX;
            this.$emit('open');
        },
        /**
         * 关闭弹层
         * @returns {void}
         */
        close: function() {
            this.clearHistoryStack();
            this.$emit('close');
        },
        /**
         * 确认选择
         * @returns {void}
         */
        onConfirmHandler: function() {
            this.setGreetingScopeItems(this.selectedItems);
            this.setGreetingScopeNumber(this.selectedItems.length);
            this.close();
            this.$emit('confirm', this.selectedItems);
        }
    }),
    mounted: function() {
        this.clearHistoryStack();
        window.addEventListener('hashchange', this.onHashChangeHandler);
    },
    beforeDestroy: function() {
        window.removeEventListener('hashchange', this.onHashChangeHandler);
    }
};
</script>

<style src="./css/components/SelectTrenchPopup.css" scoped />
