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
                        :value="isItemSelected(item)"
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
                        v-if="item.type === 'department' && isItemSelected(item)"
                        class="select-status"
                    >
                        <template v-if="isDepartmentFullSelected(item)">
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
                <span class="select-counter">（已选 {{ getAllSelectedCount }} 个员工）</span>
            </button>
        </div>
    </van-popup>
</template>

<script>
var HASH_PREFIX = 'selectStaffAndDepartment:/';
var SELECT_COUNT_PLACEHOLDER = '...';

/**
 * @typedef {'staff' | 'department'} DataType
 */

/**
 * @typedef {number | string} ItemId
 */

/**
 * @typedef DataItem
 * @property {ItemId} id
 * @property {DataType} type
 * @property {string} name
 * @property {DataItem[]} [children]
 */

/**
 * @typedef TinyTree
 * @property {number | string} i id
 * @property {1 | 2} t type
 * - 1: staff
 * - 2: department
 * @property {TinyTree[]} [c] children
 */

var getParentById = window['__UTILS'].getParentById;
var getItemById = window['__UTILS'].getItemById;
var getItemDescendants = window['__UTILS'].getItemDescendants;
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
 * 返回删除 children 的新对象
 * @param {DataItem} item
 * @returns {DataItem}
 */
function removeChildren(item) {
    var _item = Object.assign({},item);
    delete _item.children;
    return _item;
}

/**
 * 默认组件内状态
 */
function getDefaultData() {
    return {
        currentDepartmentId: null,
        selectedItems: [],
        inSearch: false,
        searchText: '',
        loggedIds: []
    }
}

/**
 * 最小化部门 / 员工对象
 * @param {DataItem} item
 */
function simplify(item) {
    if (!item) return item;
    return {
        i: item.id,
        t: ({
            staff: 1,
            department: 2
        })[item.type]
    };
}

/**
 * 逐级向上查找关联，获取一颗单叉路径树
 * @param {DataItem[]} data 完整树
 * @param {ItemId} itemId
 * @returns {DataItem} 单叉树
 */
function getSingleTree(data, itemId) {
    var parent = simplify(getItemById(data, itemId)), child;
    while (child = parent, parent = simplify(getParentById(data, parent.i))) {
        parent.c = [child];
    }
    return child;
}

/**
 * 合并两颗树
 * @param {TinyTree | TinyTree[]} alpha
 * @param {TinyTree | TinyTree[]} beta
 * @return {TinyTree | TinyTree[]}
 */
function merge(alpha, beta) {
    var isItem = !!alpha.i;
    var gamma = isItem ? Object.assign({}, alpha) : [].concat(alpha);
    if (isItem) {
        if (!beta.c || !beta.c.length) return gamma;
        gamma.c = merge(gamma.c || [], beta.c);
    } else {
        if (!beta || !beta.length) return gamma;
        var addItems = beta.filter(function(bItem) {
            return !gamma.some(function(gItem) {
                return bItem.i === gItem.i;
            });
        });
        var sameItems = beta.filter(function(bItem) {
            return gamma.some(function(gItem) {
                return bItem.i === gItem.i;
            });
        });
        sameItems.forEach(function(sItem) {
            var dIndex = gamma.findIndex(function(gItem) { return sItem.i === gItem.i; });
            gamma[dIndex] = merge(gamma[dIndex], sItem);
        });
        gamma = gamma.concat(addItems);
    }
    return gamma;
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
        scopeItems: function(state) {
            return state.greeting.scopeItems;
        },
        selectedCountMap: function(state) {
            return state.selectedCountMap;
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
            var parent = getItemById(data, this.currentDepartmentId);
            var directories = [parent];
            while (parent = getParentById(data, parent.id)) {
                directories.unshift(parent);
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
                    ? getItemDescendants(getItemById(this.staffAndDepartment, this.currentDepartmentId))
                    : this.staffAndDepartment.map(function(item) {
                        return getItemDescendants(item);
                    }).flat()
            ).filter(function(item) {
                return item.name.includes(_this.searchText);
            });
            // 否则仅显示当前部门的项目
            return this.currentItems;
        },
        /**
         * 获取全部选择人数
         * @returns {number | string} 全部选择人数
         */
        getAllSelectedCount: function() {
            if (!this.selectedItems.length) return 0;
            var _this = this;
            var selectedItems = this.selectedItems.map(function(item) {
                return getItemById(_this.staffAndDepartment, item.id);
            });
            return this.getDepartmentSelectedCountImmediate(selectedItems);
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
        setGreetingScopeNumber: 'SET_GREETING_SCOPE_NUMBER',
        setGreetingTinyTree: 'SET_GREETING_TINY_TREE'
    }), Vuex.mapActions({
        getDepartmentChildrenById: 'GET_DEPARTMENT_CHILDREN_BY_ID',
        getSelectedCount: 'GET_SELECTED_COUNT_MAP'
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
            this.enterDepartment(this.loggedIds[~~([].concat(historyStack).pop())]);
        },
        /**
         * 进入部门（只处理 hash 前进后退，具体操作交给事件监听）
         * @param {ItemId} itemId 部门 id
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
            // id 没有被记录则记录
            !this.loggedIds.includes(itemId) && this.loggedIds.push(itemId);
            // 取 id 在记录列表中的序号，用这个序号做路径标识符
            var itemIdLoggedIndexStr = this.loggedIds.indexOf(itemId) + '';
            // 历史栈中包含部门 id，后退相应步
            if (historyStack.includes(itemIdLoggedIndexStr)) return history.go(historyStack.indexOf(itemIdLoggedIndexStr) - (historyStack.length - 1));
            // 历史栈中不包含部门 id，推栈前进
            historyStack.push(itemIdLoggedIndexStr);
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
                // 类型为员工，切换选择
                case 'staff':
                    this.toggleSelectStaff(item);
                    break;
                // 类型为部门、进入部门
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
                // 类型为员工、切换员工选择
                case 'staff':
                    this.toggleSelectStaff(item);
                    break;
                // 类型为部门、切换部门选择
                case 'department':
                    this.toggleSelectDepartment(item);
                    break;
                default:
                    return;
            }
        },
        /**
         * 进入目录（部门）
         * @param {ItemId} [itemId] 目录（部门）id
         * @returns {void}
         */
        enterDepartment: function(itemId) {
            var _this = this;
            function enter(_itemId) {
                _this.currentDepartmentId = _itemId;
                setTimeout(function() {
                    smoothScrollToHorizontalEnd(_this.$refs.crumbsScrollContainer);
                });
            }
            // 没有 id 代表进入根目录
            if (!itemId) return enter(null);
            var department = getItemById(this.staffAndDepartment, itemId);
            // 部门不应该不存在
            if (!department) throw new Error('DEPARTMENT_NOT_FOUND');
            // 能找到部门并且部门下已有项目，直接进入

            if (department.children && department.children.length) return enter(department.id);
            // 部门下没有项目，加载
            var toast = vant.Toast.loading({ message: '加载中', duration: 0, forbidClick: true });
            this.getDepartmentChildrenById(department.id).then(function() {
                toast.clear();
                enter(department.id);
            });
        },
        /**
         * 项目自身是否存在于选择数据中
         * @param {ItemId} itemId
         * @return {boolean}
         */
        isItemExistInData: function(itemId) {
            return this.selectedItems.some(function(item) {
                return item.id === itemId;
            });
        },
        /**
         * 祖先项目是否存在于选择数据中
         * @param {ItemId} itemId
         * @returns {boolean}
         */
        isItemAncestorsExistInData: function(itemId) {
            var isItemAncestorsExistInData = false;
            var parent = getItemById(this.staffAndDepartment, itemId);
            while (parent = getParentById(this.staffAndDepartment, parent.id)) {
                if (this.isItemExistInData(parent.id)) {
                    isItemAncestorsExistInData = true;
                    break;
                }
            }
            return isItemAncestorsExistInData;
        },
        /**
         * 子孙项目是否存在于选择数据中
         * @param {ItemId} itemId
         * @returns {boolean}
         */
        isDescendantExistInData: function(itemId) {
            var descendants = getItemDescendants(getItemById(this.staffAndDepartment, itemId));
            return this.selectedItems.some(function(sItem) {
                return descendants.some(function(dItem) {
                    return sItem.id === dItem.id;
                });
            });
        },
        /**
         * 项目是否显示为已选择
         * @param {DataItem} item 项目
         * @returns {boolean}
         */
        isItemSelected: function(item) {
            var id = item.id;
            var preCond = this.isItemExistInData(id) || this.isItemAncestorsExistInData(id);
            return item.type === 'department'
                       ? (preCond || this.isDescendantExistInData(id))
                       : preCond;
        },
        /**
         * 向选择数据中添加一项
         * @param {DataItem} item
         * @returns {void}
         */
        addItemToData: function(item) {
            !this.isItemExistInData(item.id) && this.selectedItems.push(removeChildren(item));
        },
        /**
         * 向选择数据中添加复数项
         * @param {DataItem[]} items
         * @returns {void}
         */
        addItemsToData: function(items) {
            var _this = this;
            var validItems = items.filter(function(item) {
                return !_this.isItemExistInData(item.id);
            }).map(removeChildren);
            this.selectedItems = this.selectedItems.concat(validItems);
        },
        /**
         * 从选择的数据中移除一项
         * @param {ItemId} itemId
         * @returns {void}
         */
        removeItemFromData: function(itemId) {
            this.selectedItems = this.selectedItems.filter(function(item) {
                return item.id !== itemId;
            });
        },
        /**
         * 从选择数据中移除多项
         * @param {ItemId[]} itemIds
         * @returns {void}
         */
        removeItemsFromData: function(itemIds) {
            this.selectedItems = this.selectedItems.filter(function(item) {
                return !itemIds.includes(item.id);
            });
        },
        /**
         * 切换员工勾选状态
         * @param {DataItem} item 项目 id
         * @returns {void}
         */
        toggleSelectStaff: function(item) {
            this.isItemSelected(item)
                ? this.unSelectStaff(item)
                : this.selectStaff(item);
        },
        /**
         * 选择员工
         * @param {DataItem} item
         * @returns {void}
         */
        selectStaff: function(item) {
            this.addItemToData(item);
            this.processWTFSelect(item);
        },
        /**
         * 取消选择员工
         * @param {DataItem} item
         * @returns {void}
         */
        unSelectStaff: function(item) {
            this.removeItemFromData(item.id);
            this.processWTFUnselect(item);
        },
        /**
         * 切换目录（部门）勾选状态，递归选择 / 取消包含的员工
         * @param {DataItem} item 目录（部门）
         * @returns {void}
         */
        toggleSelectDepartment: function(item) {
            this.isItemSelected(item)
                ? this.unSelectDepartment(item)
                : this.selectDepartment(item);
        },
        /**
         * 选择部门
         * @param {DataItem} item
         * @returns {void}
         */
        selectDepartment: function(item) {
            this.addItemToData(item);
            this.removeItemDescendants(item);
            this.processWTFSelect(item);
        },
        /**
         * 取消选择部门
         * @param {DataItem} item
         * @returns {void}
         */
        unSelectDepartment: function(item) {
            this.removeItemFromData(item.id);
            this.removeItemDescendants(item);
            this.processWTFUnselect(item);
        },
        /**
         * 如果此时本级已全选，删除本级所有兄弟项，添加本部门，并使用此规则逐级向上查找处理
         * @param {DataItem} item
         * @return {void}
         */
        processWTFSelect: function(item) {
            var _this = this;
            /** @param {DataItem} department */
            function process(department) {
                // 此时部门子项没有全在选择数据中选则跳过不作处理
                if (!_this.isDepartmentChildrenAllInData(department.id)) return false;
                // 删除部门所有子项
                _this.removeItemsFromData(department.children.map(function(itm) {
                    return itm.id;
                }));
                // 添加本部门
                _this.addItemToData(department);
                return true;
            }
            var parent = item;
            while (parent = getParentById(this.staffAndDepartment, parent.id)) {
                if (!process(parent)) break;
            }
        },
        /**
         * 向上递归删除所有上级部门，并添加此级部门的兄弟项中所有仅因父（祖先）级选择而显示选择的项目
         * @param {DataItem} item
         * @returns {void}
         */
        processWTFUnselect: function(item) {
            var _this = this;
            var addItems = [];
            var removeItems = [];
            function process(department) {
                removeItems.push(department);
                if (!department.children || !department.children.length) return;
                addItems = addItems.concat(department.children.filter(function(child) {
                    var id = child.id;
                    // 自身未选择、子孙未选择、祖先已选择
                    var preCond = !_this.isItemExistInData(id) && _this.isItemAncestorsExistInData(id);
                    return child.type === 'department'
                            ? (preCond && !_this.isDescendantExistInData(id))
                            : preCond;
                }));
            }
            var parent = item;
            while (parent = getParentById(this.staffAndDepartment, parent.id)) process(parent);
            this.addItemsToData(addItems.filter(function(itm) { return itm.id !== item.id; }));
            this.removeItemsFromData(removeItems.map(function(itm) { return itm.id; }));
        },
        /**
         * 移除部门的所有子孙项
         * @param {DataItem} item
         * @returns {void}
         */
        removeItemDescendants: function(item) {
            var _this = this;
            this.removeItemsFromData(getItemDescendants(item).filter(function(descendant) {
                return _this.selectedItems.some(function(sItem) {
                    return sItem.id === descendant.id;
                });
            }).map(function(itm) { return itm.id; }));
        },
        /**
         * 部门子项是否全在数据中
         * @param {ItemId} itemId
         * @returns {boolean}
         */
        isDepartmentChildrenAllInData: function(itemId) {
            var _this = this;
            var department = getItemById(this.staffAndDepartment, itemId);
            var children = department.children;
            if (!children || !children.length) return false;
            return children.every(function(item) {
                return _this.isItemExistInData(item.id);
            });
        },
        /**
         * 获取部门下勾选的子孙项（员工）数量
         * @param {DataItem} item 目录（部门）
         * @returns {number | string} 已选员工数量
         */
        getDepartmentSelectedCount: function(item) {
            var descendants = getItemDescendants(item);
            // 还没有子孙，返回 0
            if (!descendants.length) return 0;
            var selectedDescendants = this.selectedItems.filter(function(sItem) {
                return descendants.some(function(dItem) {
                    return dItem.id === sItem.id;
                });
            });
            return this.getDepartmentSelectedCountImmediate(selectedDescendants);
        },
        /**
         * 立即返回选择人数的缓存值或代替内容
         * @param {DataItem[]} items 员工部门集合
         * @returns {number | string} 已选员工数量
         */
        getDepartmentSelectedCountImmediate: function(items) {
            // 无内容，返回 0
            if (!items.length) return 0;
            var selectedIdStr = items.map(function(sItem) { return sItem.id; }).sort().join(',');
            var cachedContent = this.selectedCountMap[selectedIdStr];
            if (cachedContent) {
                // 还在请求中，返回替代文字
                if (cachedContent instanceof Promise) return SELECT_COUNT_PLACEHOLDER;
                // 命中缓存，返回缓存值
                return cachedContent;
            }
            this.getSelectedCount(items);
            // 异步获取完成写入缓存之前输出临时代替文字
            return SELECT_COUNT_PLACEHOLDER;
        },
        /**
         * 部门是否全选
         * @param {DataItem} item 部门对象
         * @returns {boolean}
         */
        isDepartmentFullSelected: function(item) {
            // 自身选择或祖先选择就是全选
            return this.isItemExistInData(item.id) || this.isItemAncestorsExistInData(item.id);
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
         * 构建最小树结构，保存以供编辑时加载“完整”树结构
         * * 完整指能覆盖选择数据的结构
         * @returns {void}
         */
        resolveTinyTree: function() {
            var _this = this;
            var tinyTree = [];
            var singleTrees = this.selectedItems.map(function(item) {
                return getSingleTree(_this.staffAndDepartment, item.id);
            });
            singleTrees.forEach(function(tree) {
                tinyTree = merge(tinyTree, [tree]);
            });
            this.setGreetingTinyTree(tinyTree);
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
            var _this = this;
            this.setGreetingScopeItems(this.selectedItems);
            var selectedItems = this.selectedItems.map(function(item) {
                return getItemById(_this.staffAndDepartment, item.id);
            });
            var toast = vant.Toast.loading({ message: '加载中', duration: 0, forbidClick: true });
            this.getSelectedCount(selectedItems).then(function() {
                var staffNumber = _this.getDepartmentSelectedCountImmediate(selectedItems);
                _this.setGreetingScopeNumber(staffNumber === SELECT_COUNT_PLACEHOLDER ? 0 : staffNumber);
                _this.resolveTinyTree();
                _this.$emit('confirm', _this.selectedItems);
                _this.close();
                toast.clear();
            });
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

<style src="./css/components/SelectStaffAndDepartmentPopup.css" scoped />
