<template>
    <van-popup
        v-if="popupExsist"
        v-model="showPopup"
        @close="$emit('close')"
        @closed="onPopupClosedHandler"
        position="bottom"
        class="add-mini-program-popup"
    >
        <h3 class="title">添加小程序</h3>

        <h4 class="label required">小程序标题</h4>
        <div class="field field-input">
            <input
                v-model="form.title"
                type="text"
                :maxlength="titleMaxLength"
                placeholder="请输入标题，不超过30字"
                @change="onFieldChangeHandler"
            />
            <span class="text-counter">{{ form.title.length }} / {{ titleMaxLength }}</span>
        </div>
        <p
            v-if="getFieldValidateMessage('title')"
            class="validate-error"
        >{{ getFieldValidateMessage('title') }}</p>

        <h4 class="label required">小程序 APPID</h4>
        <div class="field field-input">
            <input
                v-model="form.appId"
                type="text"
                placeholder="请输入 APPID"
                @change="onFieldChangeHandler"
            />
        </div>
        <p
            v-if="getFieldValidateMessage('appId')"
            class="validate-error"
        >{{ getFieldValidateMessage('appId') }}</p>

        <h4 class="label required">页面路径</h4>
        <div class="field field-textarea">
            <input
                v-model="form.path"
                type="text"
                placeholder="请输入小程序内的页面路径"
                @change="onFieldChangeHandler"
            />
        </div>
        <p
            v-if="getFieldValidateMessage('path')"
            class="validate-error"
        >{{ getFieldValidateMessage('path') }}</p>

        <div class="field field-file">
            <upload-file
                :value="form.cover"
                :action="uploadFileApi"
                label="封面图片"
                accept="image/jpeg, image/png"
                :max-size="2097152"
                @success="onUploadSuccessHandler"
                @fail="onUploadFailHandler"
                @clear="onUploadClearHandler"
                @change="onFieldChangeHandler"
            >
            </upload-file>
            <div class="text">
                <p v-if="getFieldValidateMessage('cover')" class="validate-error">{{ getFieldValidateMessage('cover') }}</p>
                <p class="tip">（支持jpg、jpeg、png格式，大小不超过2M，建议尺寸520*416px ）</p>
            </div>
        </div>

        <div class="actions">
            <button
                @click="onCancelBtnClickHandler"
                class="cancel-btn btn btn-large btn-accent btn-rounded"
            >取消</button>
            <button
                @click="onConfirmBtnClickHandler"
                class="save-btn btn btn-large btn-primary btn-rounded"
            >保存</button>
        </div>
    </van-popup>
</template>

<script>
var AsyncValidator = window['__ASYNC_VALIDATOR'];
var TITLE_MAX_LENGTH = 30;
var validateRules = {
    title: [
        { required: true, message: '请填写标题' },
        { max: TITLE_MAX_LENGTH, message: '标题超过限制，不能超过30个字' }
    ],
    appId: [{ required: true, message: '请填写 APPID' }],
    path: [{ required: true, message: '请填写页面路径' }],
    cover: [{ required: true, message: '请选择封面图片' }]
};

/**
 * @typedef FormConent
 * @property {string} title 标题
 * @property {string} appId 小程序 AppID
 * @property {string} path 小程序内部路径
 * @property {string} cover 图片地址
 */

/**
 * 默认内部状态
 */
function getDefaultData() {
    return {
        form: {
            title: '',
            appId: '',
            path: '',
            cover: ''
        },
        showPopup: false,
        popupExsist: false,
        uploadErrMsag: '',
        enableValidate: false,
        validateErrors: []
    };
}

module.exports = {
    name: 'AddMiniProgramPopup',
    components: {
        UploadFile: httpVueLoader('./UploadFile.vue')
    },
    props: {
        show: Boolean
    },
    watch: {
        show: function(value) {
            if (value) return this.openPopup();
            this.showPopup = false;
        }
    },
    computed: {
        titleMaxLength: function() {
            return TITLE_MAX_LENGTH;
        },
        uploadFileApi: function() {
            return window['__MOCK_API'].uploadFile;
        }
    },
    data: getDefaultData,
    methods: {
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
         * 添加网页图片成功
         * @returns {void}
         */
        onUploadSuccessHandler: function(result) {
            if (!result.success) return this.uploadErrMsag = result.alertMsg;
            this.uploadErrMsag = '';
            this.form = Object.assign(this.form, {
                cover: result.data
            });
        },
        /**
         * 添加网页图片失败
         * @returns {void}
         */
        onUploadFailHandler: function(error) {
            switch (error.message) {
                case 'FILE_SIZE_OVERFLOW':
                    this.uploadErrMsag = '图片不得超过2M，请重新上传';
                    break;
                default:
                    vant.Toast.fail('网络错误: ' + error.response.status);
            }
        },
        /**
         * 上传的文件被清除
         * @returns {void}
         */
        onUploadClearHandler: function() {
            this.form = Object.assign(this.form, {
                cover: ''
            });
            this.uploadErrMsag = '';
        },
        /**
         * 验证表单
         * @returns {Promise<void>}
         */
        validateForm: function() {
            if (!this.enableValidate) return Promise.resolve();
            var _this = this;
            var validator = new AsyncValidator(validateRules);
            return new Promise(function(resolve, reject) {
                if (_this.uploadErrMsag) return reject(_this.validateErrors = [].concat(_this.validateErrors, [{
                    field: 'cover',
                    message: _this.uploadErrMsag
                }]));
                validator.validate(_this.form).then(function() {
                    _this.validateMessage = [];
                    resolve();
                }).catch(function(error) {
                    reject(_this.validateErrors = error.errors);
                });
            });
        },
        /**
         * 获取单个表单域的校验错误信息
         * @param {string} field 表单字段名
         * @returns {string}
         */
        getFieldValidateMessage: function(field) {
            var error = this.validateErrors.find(function(err) {
                return err.field === field;
            });
            if (error && error.message) return error.message;
            return '';
        },
        /**
         * 点击保存按钮
         * @returns {void}
         */
        onConfirmBtnClickHandler: function() {
            var _this = this;
            this.enableValidate = true;
            this.validateForm()
                .then(function() {
                    _this.$emit('confirm', Object.assign({}, _this.form));
                });
        },
        /**
         * 点击取消按钮
         * @returns {void}
         */
        onCancelBtnClickHandler: function() {
            this.$emit('close');
        },
        /**
         * 有表单改变时验证表单
         * @returns {void}
         */
        onFieldChangeHandler: function() {
            this.validateForm();
        }
    }
};
</script>

<style src="../css/components/AddMiniProgramPopup.css" scoped />
