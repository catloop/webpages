<template>
    <div class="scopes">
        <van-radio-group
            :value="scopeType"
            class="scope-selector"
            :style="{ '--radio-size': getIntPx(32) }"
        >
            <van-radio
                name="BY_STAFF_AND_DEPARTMENT"
                @click="onRadioClickHandler('BY_STAFF_AND_DEPARTMENT')"
            >
                按部门及员工
                <button
                    v-if="scopeType === 'BY_STAFF_AND_DEPARTMENT'"
                    @click.stop="onSelectBtnClickHandle('BY_STAFF_AND_DEPARTMENT')"
                    class="btn-select-detail"
                >选择员工</button>
            </van-radio>
            <van-radio
                name="BY_TRENCH"
                @click="onRadioClickHandler('BY_TRENCH')"
            >
                按渠道
                <button
                    v-if="scopeType === 'BY_TRENCH'"
                    @click.stop="onSelectBtnClickHandle('BY_TRENCH')"
                    class="btn-select-detail"
                >选择渠道</button>
            </van-radio>
        </van-radio-group>

        <ul
            v-if="scopeItems && scopeItems.length"
            class="selected-scopes"
        >
            <li
                v-for="scope in scopeItems"
                :key="scope.id"
                :class="'scope-' + scope.type"
                class="scope"
            >{{ scope.name }}</li>
        </ul>

        <p v-else class="empty-placeholder">暂未选择任何员工和渠道</p>
    </div>
</template>

<script>
/**
 * @typedef {'BY_STAFF_AND_DEPARTMENT' | 'BY_TRENCH'} ScopeType 范围类型
 * - BY_STAFF_AND_DEPARTMENT: 按部门及员工
 * - BY_TRENCH: 按渠道
 */

/**
 * @typedef Trench 渠道
 * @property {number} id 渠道 ID
 * @property {string} name 渠道名称
 * @property {'trench'} type 渠道类型
 * @property {string} avatar 渠道图片
 */

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

module.exports = {
    name: 'Scopes',
    computed: Object.assign(Vuex.mapState(['trenchs', 'staffAndDepartment']), Vuex.mapState({
        /**
         * @returns {ScopeType}
         */
        scopeType: function(state) {
            return state.greeting.scopeType;
        },
        scopeItems: function(state) {
            return state.greeting.scopeItems;
        },
        scopeNumber: function(state) {
            return state.greeting.scopeNumber;
        },
        tinyTree: function(state) {
            return state.greeting.tinyTree;
        }
    })),
    data: function() {
        return {
            backup: {
                scopeItems: [],
                tinyTree: [],
                scopeNumber: 0
            }
        };
    },
    methods: Object.assign(Vuex.mapMutations({
        setGreetingScopeType: 'SET_GREETING_SCOPE_TYPE',
        setGreetingScopeItems: 'SET_GREETING_SCOPE_ITEMS',
        setGreetingScopeNumber: 'SET_GREETING_SCOPE_NUMBER',
        setGreetingTinyTree: 'SET_GREETING_TINY_TREE'
    }), {
        /**
         * rem 尺寸取整 px
         * @param {number} 逻辑像素值
        */
        getIntPx: function(logicValue) {
            return ~~(logicValue / 75 * parseInt(document.documentElement.style.fontSize)) + 'px';
        },
        /**
         * 选择具体员工或渠道
         * @param {ScopeType} scopeType 范围类型
         * @returns {void}
         */
        onSelectBtnClickHandle: function(scopeType) {
            this.$emit('select-scope', scopeType);
        },
        /**
         * radio 点击触发，切换范围类型
         * @param {ScopeType} scopeType 范围类型
         * @returns {void}
         */
        onRadioClickHandler: function(scopeType) {
            // 值未改变，无操作
            if (scopeType === this.scopeType) return;
            // 准备从备份的数据恢复（或置为空数据）
            var restore = Object.assign({}, this.backup);
            this.backup = {
                scopeItems: this.scopeItems,
                tinyTree: this.tinyTree,
                scopeNumber: this.scopeNumber
            };
            // 恢复备份或清空数据：如果之前没有保存，即第一次切换，会清空成空初始数据，反之会恢复上一个类型保存的数据
            // * 这种方式只适合两组数据相交换，若有更多类型，需要改为 map 结构
            this.setGreetingScopeItems(restore.scopeItems);
            this.setGreetingTinyTree(restore.tinyTree);
            this.setGreetingScopeNumber(restore.scopeNumber);
            this.setGreetingScopeType(scopeType);
        }
    })
};
</script>

<style src="./css/components/Scopes.css" scoped />
