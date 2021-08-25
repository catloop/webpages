<template>
    <div class="greeting-content">
        <div class="input-container">
            <div class="input-wrapper">
                <div
                    v-html="styledContent"
                    ref="renderView"
                    class="render-view"
                ></div>
                <textarea
                    :value="value"
                    ref="textarea"
                    @scroll="onTextAreaScrollHandler"
                    @input="onTextAreaInputHandler"
                    maxlength="300"
                    class="input-textarea"
                ></textarea>
            </div>
            <div class="input-footer">
                <button
                    class="action-btn"
                    @click="onInsertTextBtnClickHandler('用户昵称')"
                >插入用户昵称</button>
                <button
                    class="action-btn"
                    @click="onInsertTextBtnClickHandler('员工姓名')"
                >插入员工姓名</button>
                <span class="counter">{{ value.length }} / {{ contentMaxLength }}</span>
            </div>
        </div>
    </div>
</template>

<script>
var SPLIT_WORD = '#';
var SPLIT_WORD_REG_EXP = new RegExp(SPLIT_WORD, 'g');
var CONTENT_MAX_LENGTH = 300;

module.exports = {
    name: 'GreetingContent',
    props: {
        value: {
            type: String,
            required: true
        }
    },
    computed: {
        styledContent: function() {
            var splitWordCount = this.value.split('#').length - 1;
            var hasEndTag = !(splitWordCount % 2);
            var counter = 0;
            return this.value.replace(SPLIT_WORD_REG_EXP, function(word) {
                counter++;
                if ((counter === splitWordCount) && !hasEndTag) return word;
                return (counter % 2)
                    ? '#<span class="high-light">'
                    : '</span>#';
            });
        },
        contentMaxLength: function() {
            return CONTENT_MAX_LENGTH;
        }
    },
    methods: {
        /**
         * 使显示高亮文本的 div 同步滚动
         * @returns {void}
         */
        onTextAreaScrollHandler: function() {
            this.$refs.renderView.scrollTo(0, this.$refs.textarea.scrollTop);
        },
        /**
         * 在文本框插入文本
         * @param {string} text 插入的文本
         * @returns {void}
         */
        onInsertTextBtnClickHandler: function(text) {
            var textarea = this.$refs.textarea;
            var insertPosition = textarea.selectionEnd;
            var strArr = this.value.split('');
            var insertText = SPLIT_WORD + text + SPLIT_WORD;
            if (this.value.length + insertText.length > CONTENT_MAX_LENGTH) return;
            strArr.splice(insertPosition, 0, insertText);
            this.updateValue(strArr.join(''));
            textarea.focus();
            setTimeout(function() {
                textarea.selectionStart = textarea.selectionEnd = insertPosition + insertText.length;
            });
        },
        /**
         * 触发 change 事件更新 value prop
         * @returns {void}
         */
        updateValue: function(value) {
            this.$emit('change', value);
        },
        /**
         * 输入时更新 value prop
         * @param {InputEvent} event
         * @returns {void}
         */
        onTextAreaInputHandler: function(event) {
            this.updateValue(event.target.value);
        }
    }
};
</script>

<style src="./css/components/GreetingContent.css" scoped />
