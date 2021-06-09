<template>
    <label
        class="upload-file"
        :class="{ 'has-value': value }"
    >
        <input
            type="file"
            @change="onFileInputChangeHandler"
            :accept="accept"
        />

        {{ value ? '' : label }}

        <img
            v-if="value"
            :src="value"
            alt="图片"
            class="uploaded-image"
        />

        <button
            v-if="value"
            class="clear-btn"
            @click.stop.prevent="onClearBtnClickHandler"
        ></button>
    </label>
</template>

<script>
module.exports = {
    name: 'UploadFile',
    props: {
        value: {
            type: String,
            required: true
        },
        /** 按钮文字 */
        label: {
            type: String,
            default: '上传'
        },
        /** 上传接口 URL */
        action: {
            type: String,
            required: true
        },
        /** 接受的文件 mime type */
        accept: {
            type: String,
            default: '*'
        },
        /** 最大文件尺寸 */
        maxSize: Number,
        /** 上传接口文件字段名 */
        fileKey: {
            type: String,
            default: 'file'
        },
        /** 异步加载时是否显示菊花圈 */
        loading: {
            type: Boolean,
            default: true
        },
        /** 上传中菊花圈显示的文字 */
        loadingText: {
            type: String,
            default: '上传中'
        },
        /** 是否可删除 */
        clearable: {
            type: Boolean,
            default: true
        }
    },
    methods: {
        /**
         * input 选择改变
         * @param {Event} event 输入改变事件
         * @returns {void}
         */
        onFileInputChangeHandler: function(event) {
            var _this = this;
            var files = event.target.files;
            if (!files || !files.length) return;
            var file = files[0];
            if (this.maxSize && file.size > this.maxSize) return this.$emit('fail', new Error('FILE_SIZE_OVERFLOW'));
            var toast = this.loading && vant.Toast.loading(this.loadingText);
            var formData = new FormData();
            formData.append(this.fileKey, file);
            axios[/\/mock\//.test(this.action) ? 'get' : 'post'](this.action, {
                data: formData
            })
                .then(function(response) {
                    toast && toast.clear();
                    _this.$emit('success', response.data);
                })
                .catch(function(err) {
                    toast && toast.clear();
                    _this.$emit('fail', err);
                })
                .finally(function() {
                    _this.$emit('change', _this.value)
                });
        },
        /**
         * 点击清除按钮
         * @returns {void}
         */
        onClearBtnClickHandler: function() {
            this.$emit('clear');
            this.$emit('change');
        }
    }
};
</script>

<style src="./css/components/UploadFile.css" scoped />
