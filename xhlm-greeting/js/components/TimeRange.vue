<template>
    <div class="time-range">
        <span class="text">{{ isSelected ? valueText : '时间段设置' }}</span>
        <button
            @click="onSelectTimeBtnClickHandler"
            class="select-time-btn"
        >选择时间</button>

        <van-popup
            v-if="selectTimePopupExist"
            v-model="showSelectTimePopup"
            @closed="onSelectTimeClosedHandler"
            position="bottom"
            class="select-time-popup"
        >
            <div class="popup-actions">
                <button
                    @click="showSelectTimePopup = false"
                    class="action-btn cancel-btn"
                >取消</button>
                <button
                    @click="onPopupConfirmBtnClickHandler"
                    class="action-btn confirm-btn"
                >确定</button>
            </div>

            <div class="workday">
                法定工作日
                <van-switch
                    v-model="tempValue.workDay"
                    class="switch"
                ></van-switch>
            </div>

            <div class="days-container">
                <ul class="days">
                    <li
                        v-for="day in weekDays"
                        :key="day.value"
                        class="day"
                    >
                        <button
                            @click="onDayClickHandler(day.value)"
                            :class="{ 'selected': tempValue.days.includes(day.value) }"
                            :disabled="tempValue.workDay"
                            class="day-btn"
                        >{{ day.text }}</button>
                    </li>
                </ul>
            </div>

            <div class="time-range-container">
                <div class="range-labels">
                    <span class="label">开始时间</span>
                    <span class="placeholder"></span>
                    <span class="label">结束时间</span>
                </div>
                <div class="picker-container">
                    <van-datetime-picker
                        :value="tempValue.startTime"
                        @change="onCurrentTimeChangeHandler('startTime', $event)"
                        type="time"
                        item-height="1.2rem"
                        class="time-picker"
                    ></van-datetime-picker>
                    <div class="to">至</div>
                    <van-datetime-picker
                        :value="tempValue.endTime"
                        @change="onCurrentTimeChangeHandler('endTime', $event)"
                        type="time"
                        item-height="1.2rem"
                        class="time-picker"
                    ></van-datetime-picker>
                </div>
            </div>
        </van-popup>
    </div>
</template>

<script>
var WEEK_DAYS = [{
    text: '周一',
    value: 1
}, {
    text: '周二',
    value: 2
}, {
    text: '周三',
    value: 3
}, {
    text: '周四',
    value: 4
}, {
    text: '周五',
    value: 5
}, {
    text: '周六',
    value: 6
}, {
    text: '周日',
    value: 0
}];

/**
 * 通过时刻字符串获取今天此时刻的时间戳
 * @returns {number}
 */
function getTimeStampByMoment(momentStr) {
    return moment(moment().format('YYYY-MM-DD ') + momentStr).valueOf();
}

module.exports = {
    name: 'TimeRange',
    props: {
        value: {
            type: Object,
            required: true
        },
        validateRule: Function
    },
    computed: {
        /**
         * 星期每天的值数组
         * @returns {number[]}
         */
        weekDays: function() {
            return WEEK_DAYS;
        },
        /**
         * 是否已经选择时间
         * @returns {boolean}
         */
        isSelected: function() {
            var value = this.value;
            if (!value) return false;
            return (!!value.days && !!value.days.length) || value.workDay;
        },
        /**
         * 选定时间显示的文字
         * @returns {string}
         */
        valueText: function() {
            var value = this.value;
            var daysText = value.workDay
                ? '工作日'
                : [].concat(value.days).sort().map(function(dayValue) {
                    return WEEK_DAYS.find(function(day) {
                        return day.value === dayValue;
                    }).text;
                }).join('、')
            return value.startTime + '-' + value.endTime + '；' + daysText;
        }
    },
    data: function() {
        return {
            selectTimePopupExist: false,
            showSelectTimePopup: false,
            tempValue: null
        };
    },
    methods: {
        /**
         * 搬运 prop 到临时状态
         * @returns {void}
         */
        initTempValue: function() {
            var tempValue = Object.assign({}, this.value);
            var nowTime = moment(Date.now()).format('HH:mm');
            tempValue.startTime = tempValue.startTime || nowTime;
            tempValue.endTime = tempValue.endTime || nowTime;
            this.tempValue = tempValue;
        },
        /**
         * 点击选择时间按钮，打开时间选择弹层
         * @returns {void}
         */
        onSelectTimeBtnClickHandler: function() {
            var _this = this;
            this.initTempValue();
            this.selectTimePopupExist = true;
            this.$nextTick(function() {
                _this.showSelectTimePopup = true;
            });
        },
        /**
         * 选择时间改变时触发
         * @param {'startTime' | 'endTime'} key 改变的字段名，开始时间或结束时间
         * @param {Vant.Picker} picker Vant 的 Picker 组件实例
         * @returns {void}
         */
        onCurrentTimeChangeHandler: function(key, picker) {
            this.tempValue = Object.assign({}, this.tempValue, {
                [key]: picker.getValues().join(':')
            });
        },
        /**
         * 弹层关闭之后，移除弹层的 dom 节点
         * @returns {void}
         */
        onSelectTimeClosedHandler: function() {
            var _this = this;
            this.$nextTick(function() {
                _this.selectTimePopupExist = false;
            });
        },
        /**
         * 点击弹层确定按钮
         * @returns {void}
         */
        onPopupConfirmBtnClickHandler: function() {
            if (this.validateRule && !this.validateRule(this.tempValue)) return;
            this.$emit('confirm', Object.assign({}, this.tempValue));
            this.showSelectTimePopup = false;
        },
        /**
         * 点击星期
         * @param {number} 星期值
         * @return {void}
         */
        onDayClickHandler: function(dayValue) {
            if (this.tempValue.days.includes(dayValue)) return this.tempValue.days = this.tempValue.days.filter(function(day) {
                return day !== dayValue;
            });
            this.tempValue.days = [].concat(this.tempValue.days, [dayValue]);
        }
    },
    mounted: function() {
        this.initTempValue();
    }
};
</script>

<style src="./css/components/TimeRange.css" scoped />
