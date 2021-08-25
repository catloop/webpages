<template>
    <div @scroll.self="onScrollHandler" class="scroll-view"><slot /></div>
</template>

<script>
module.exports = {
    props: {
        offset: {
            type: [String, Number],
            default: 100
        }
    },
    methods: {
        onScrollHandler: function(event) {
            var target = event.target;
            // 滚动高度鱼自身高度相等，是内容清除或变少使高度不溢出情况，直接跳出
            if (target.scrollHeight === target.offsetHeight) return;
            if (target.scrollHeight - target.offsetHeight - target.scrollTop > parseInt(this.offset)) return;
            this.$emit('load');
        },

        resetScroll: function() {
            this.$el.scrollTop = 0;
        }
    }
};
</script>
