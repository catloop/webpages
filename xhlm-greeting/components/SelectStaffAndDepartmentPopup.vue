<template>
    <van-popup :value="show" position="right" class="select-staff-and-department-popup">
        <div class="header">
            <search-bar
                placeholder="搜索部门/员工"
                :value="searchText"
                @search="onSearchHandler"
            ></search-bar>
        </div>

        <div class="content">
            <nav class="crumbs" ref="crumbsScrollContainer">
                <div class="inner">
                    <span
                        v-for="directory in directories"
                        :key="directory.id"
                        :class="{ 'current': directory.id && (directory.id === currentDepartmentId) }"
                        @click="onDirectoryClickHandler(directory)"
                        class="directory"
                    >{{ directory.name }}</span>
                    <span v-if="!directories.length" class="directory">选择部门</span>
                </div>
            </nav>

            <ul
                v-if="filteredItems && filteredItems.length"
                class="data-list"
            >
                <li
                    v-for="item in filteredItems"
                    :key="item.id"
                    :class="'item-' + item.type"
                    @click.stop="onDataItemClickHandle(item)"
                    class="data-item"
                >
                    <van-checkbox
                        :disabled="isDepartmentEmpty(item)"
                        :value="isDataItemSelected(item)"
                        @click.native.stop="onDataItemCheckboxClickHandle(item)"
                        class="checkbox"
                    ></van-checkbox>
                    <img
                        v-if="item.type === 'staff'"
                        :src="item.avatar"
                        :alt="item.name"
                        class="avatar"
                    />
                    <i
                        v-if="item.type === 'department'"
                        class="folder-icon"
                    ></i>
                    <span class="name">{{ item.name }}</span>
                    <span
                        v-if="item.type === 'department' && getDepartmentSelectedCount(item)"
                        class="select-status"
                    >
                        <template v-if="isDepartmentFillSelected(item)">
                            已全选
                        </template>
                        <template v-else>
                            其中已选
                            <span class="num">{{ getDepartmentSelectedCount(item) }}</span>
                            人
                        </template>
                    </span>
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
                    没有部门或员工
                </template>
            </div>
        </div>

        <div class="footer">
            <button
                @click="onConfirmHandler"
                class="confirm-btn btn btn-large btn-primary btn-rounded"
            >
                确定
                <span class="select-counter">（已选{{ selectedIds.length }}个员工）</span>
            </button>
        </div>
    </van-popup>
</template>

<script>
var HASH_PREFIX = 'selectStaffAndDepartment:/';

/**
 * @typedef {'staff' | 'department'} DataType
 */

/**
 * @typedef DataItem
 * @property {number} id
 * @property {DataType} type
 * @property {string} name
 * @property {DataItem[]} [children]
 */

var getParentById = window['__UTILS'].getParentById;
var getItemById = window['__UTILS'].getItemById;
var getItemDescendant = window['__UTILS'].getItemDescendant;
var getItemDescendantStaff = window['__UTILS'].getItemDescendantStaff;
var smoothScrollToHorizontalEnd = window['__UTILS'].smoothScrollToHorizontalEnd;

/**
 * 获取部门路径栈
 * @param {string} hash
 * @returns {string[]} 部门的 id 字符串数组
 */
function getHistoryStack(hash) {
    hash = hash || window.location.hash;
    if (!hash.includes(HASH_PREFIX)) return [];
    var directoryStr = hash.split(HASH_PREFIX)[1];
    if (!directoryStr) return [];
    return directoryStr.split('/');
}

/**
 * 默认组件内状态
 */
function getDefaultData() {
    return {
        currentDepartmentId: null,
        selectedIds: [],
        inSearch: false,
        searchText: ''
    }
}

module.exports = {
    name: 'SelectStaffAndDepartmentPopup',
    components: {
        SearchBar: httpVueLoader('./SearchBar.vue')
    },
    props: {
        show: {
            type: Boolean,
            required: true
        }
    },
    computed: Object.assign(Vuex.mapState(['staffAndDepartment']), Vuex.mapState({
        scopeIds: function(state) {
            return state.greeting.scopeIds;
        }
    }),
    {
        /**
         * 路径
         * @returns {DataItem[]}
         */
        directories: function() {
            if (!this.currentDepartmentId) return [];
            var data = this.staffAndDepartment;
            var parentId = this.currentDepartmentId;  
            var directories = [getItemById(data, parentId)];
            while (parentId = (getParentById(data, parentId) || {}).id) {
                directories.unshift(getItemById(data, parentId));
            }
            return directories;
        },
        /**
         * 当前部门下要显示的项目
         * @returns {DataItem[]}
         */
        currentItems: function() {
            return this.currentDepartmentId
                ? getItemById(this.staffAndDepartment, this.currentDepartmentId).children
                : this.staffAndDepartment;
        },
        /**
         * 分发不同条件下要显示的项目
         * @returns {DataItem[]}
         */
        filteredItems: function() {
            var _this = this;
            // 搜索时显示搜索当前部门下的所有匹配结果
            if (this.inSearch && this.searchText) return (
                // 当前没有在某个部门下，搜索全部数据，反之搜索特定部门的子项
                this.currentDepartmentId
                    ? getItemDescendant(getItemById(this.staffAndDepartment, this.currentDepartmentId))
                    : this.staffAndDepartment.map(function(item) {
                        return getItemDescendant(item);
                    }).flat()
            ).filter(function(item) {
                return item.name.includes(_this.searchText);
            });
            // 否则仅显示当前部门的项目
            return this.currentItems;
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
        setGreetingScopeIds: 'SET_GREETING_SCOPE_IDS'
    }), {
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
            if (oldHash.includes(HASH_PREFIX) && !newHash) return this.close();
            // hash 不包含基础前缀时，无操作
            if (!newHash.includes(HASH_PREFIX)) return;
            var historyStack = getHistoryStack(newHash);
            // 没有历史记录，去根目录
            if (!historyStack.length) return this.enterDepartment(null);
            // 有历史记录，去末位 id
            this.enterDepartment(~~([].concat(historyStack).pop()));
        },
        /**
         * 进入部门（只处理 hash 前进后退，具体操作交给事件监听）
         * @param {number} itemId 部门 id
         * @returns {void}
         */
        hashEnterDepartment: function(itemId) {
            // id 与当前相同，不操作
            if (itemId === this.currentDepartmentId) return;
            // 去除搜索状态，避免继续显示进入的目录的搜索结果
            this.inSearch = false;
            var historyStack = getHistoryStack();
            // 没有 id，回到部门选择
            if (!itemId) return history.go(-(historyStack.length));
            var itemIdStr = itemId + '';
            // 历史栈中包含部门 id，后退相应步
            if (historyStack.includes(itemIdStr)) return history.go(historyStack.indexOf(itemIdStr) - (historyStack.length - 1));
            // 历史栈中不包含部门 id，推栈前进
            historyStack.push(itemIdStr);
            window.location.hash = HASH_PREFIX + historyStack.join('/');
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
            var historyStack = getHistoryStack();
            // 有前缀，后退 栈长度 + 1（弹层打开时添加的一次）
            history.go(-(historyStack.length + 1));
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
         * 面包屑导航中某个路径被点击，进入此路径
         * @param {DataItem} directory
         * @return {void}
         */
        onDirectoryClickHandler: function(directory) {
            this.hashEnterDepartment(directory.id);
        },
        /**
         * 项目点击行为，通过类型分发不同操作
         * @param {DataItem} item 项目
         * @returns {void}
         */
        onDataItemClickHandle: function(item) {
            switch (item.type) {
                case 'staff':
                    this.toggleSelectStaff(item.id);
                    break;
                case 'department':
                    this.hashEnterDepartment(item.id);
                    break;
                default:
                    return;
            }
        },
        /**
         * 项目的 checkbox 点击行为，通过类型分发不同操作
         * @param {DataItem} item 项目
         * @returns {void}
         */
        onDataItemCheckboxClickHandle: function(item) {
            switch (item.type) {
                case 'staff':
                    this.toggleSelectStaff(item.id);
                    break;
                case 'department':
                    this.toggleSelectDepartment(item);
                    break;
                default:
                    return;
            }
        },
        /**
         * 进入目录（部门）
         * @param {number} [itemId] 目录（部门）id
         * @returns {void}
         */
        enterDepartment: function(itemId) {
            var _this = this;
            this.currentDepartmentId = itemId || null;
            setTimeout(function() {
                smoothScrollToHorizontalEnd(_this.$refs.crumbsScrollContainer);
            });
        },
        /**
         * 切换员工勾选状态
         * @param {number} itemId 项目 id
         * @returns {void}
         */
        toggleSelectStaff: function(itemId) {
            if (this.selectedIds.includes(itemId)) return this.selectedIds = this.selectedIds.filter(function(id) {
                return id !== itemId;
            });
            this.selectedIds.push(itemId);
        },
        /**
         * 项目是否已选择
         * @param {DataItem} item 项目
         * @returns {boolean}
         */
        isDataItemSelected: function(item) {
            var _this = this;
            switch (item.type) {
                case 'staff':
                    return this.selectedIds.includes(item.id);
                case 'department':
                    return getItemDescendantStaff(item).some(function(itm) {
                        return _this.selectedIds.some(function(id) {
                            return itm.id === id;
                        });
                    });
                default:
                    return false;
            }
        },
        /**
         * 切换目录（部门）勾选状态，递归选择 / 取消包含的员工
         * @param {DataItem} item 目录（部门）
         * @returns {void}
         */
        toggleSelectDepartment: function(item) {
            var allStaffIds = getItemDescendantStaff(item).map(function(staff) {
                return staff.id;
            });
            // 部门已选择（其中有员工选中），取消选择所选的员工
            if (this.isDataItemSelected(item)) {
                this.selectedIds = this.selectedIds.filter(function(id) {
                    return !allStaffIds.includes(id);
                });
                return;
            }
            // 部门没有选择（其中没有选中的员工），选择所有员工
            this.selectedIds = [].concat(this.selectedIds, allStaffIds);
        },
        /**
         * 部门是否为空
         * @param {DataItem} 部门或员工
         * @returns {boolean}
         */
        isDepartmentEmpty: function(item) {
            return item.type === 'department' && !getItemDescendantStaff(item).length;
        },
        /**
         * 获取部门下勾选的子孙项（员工）数量
         * @param {DataItem} item 目录（部门）
         * @returns {number} 已选员工数量
         */
        getDepartmentSelectedCount: function(item) {
            var allStaffIds = getItemDescendantStaff(item).map(function(staff) {
                return staff.id;
            });
            return this.selectedIds.filter(function(id) {
                return allStaffIds.includes(id);
            }).length;
        },
        /**
         * 部门是否全选
         * @param {DataItem} item 部门对象
         * @returns {boolean}
         */
        isDepartmentFillSelected: function(item) {
            return this.getDepartmentSelectedCount(item) === getItemDescendantStaff(item).length;
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
            this.selectedIds = [].concat(this.scopeIds);
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
            this.setGreetingScopeIds(this.selectedIds);
            this.close();
            this.$emit('confirm', this.selectedIds);
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

<style src="../css/components/SelectStaffAndDepartmentPopup.css" scoped />
