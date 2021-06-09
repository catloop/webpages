<template>
    <div class="attachment">
        <img :src="value.cover" alt="cover" />
        <span
            class="label"
            :class="'label-' + value.type"
        >
            <span class="inner">{{ value.type | typeText }}</span>
        </span>
        <button
            v-if="removable"
            @click="$emit('remove')"
            class="remove-btn"
        ></button>
    </div>
</template>

<script>
/**
 * @typedef Attachment
 * @property {'image' | 'anchor' | 'mini-program' ｜ 'service'} type
 * @property {string} cover
*/

var TYPE_TEXT_MAP = {
    'image': '图片',
    'anchor': '链接',
    'mini-program': '小程序',
    'service': '智能客服'
};

module.exports = {
    name: 'Attachment',
    props: {
        value: {
            type: Object,
            required: true
        },
        removable: {
            type: Boolean,
            default: false
        }
    },
    filters: {
        /**
         * 附件类型显示文字
         * @param {string} attachmentType 类型定义值
         * @returns {string} 显示于界面的类型显示文字
         */
        typeText: function(attachmentType) {
            return TYPE_TEXT_MAP[attachmentType];
        }
    }
};
</script>

<style src="../css/components/Attachment.css" scoped />
