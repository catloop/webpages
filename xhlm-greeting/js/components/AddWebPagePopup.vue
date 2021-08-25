<template>
    <van-popup
        v-if="popupExsist"
        v-model="showPopup"
        @close="$emit('close')"
        @closed="onPopupClosedHandler"
        position="bottom"
        class="add-web-page-popup"
    >
        <h3 class="title">添加网页</h3>

        <h4 class="label required">网页标题</h4>
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

        <h4 class="label">描述信息</h4>
        <div class="field field-textarea">
            <textarea
                v-model="form.description"
                rows="2"
                placeholder="请输入描述信息，不超过30字"
                :maxlength="descriptionMaxLenght"
                @change="onFieldChangeHandler"
            ></textarea>
            <span class="text-counter">{{ form.description.length }} / {{ descriptionMaxLenght }}</span>
        </div>
        <p
            v-if="getFieldValidateMessage('description')"
            class="validate-error"
        >{{ getFieldValidateMessage('description') }}</p>

        <h4 class="label required">链接地址</h4>
        <div class="field field-textarea">
            <input
                v-model="form.url"
                type="text"
                placeholder="请输入以http或https开头的地址"
                @change="onFieldChangeHandler"
            />
        </div>
        <p
            v-if="getFieldValidateMessage('url')"
            class="validate-error"
        >{{ getFieldValidateMessage('url') }}</p>

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
                <p class="tip">（支持jpg、jpeg、png格式，大小不超过2M，建议尺寸180*180px ）</p>
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
var DESCRIPTION_MAX_LENGTH = 30;
var validateRules = {
    title: [
        { required: true, message: '请填写标题' },
        { max: TITLE_MAX_LENGTH, message: '标题超过限制，不能超过30个字' }
    ],
    description: [{ max: DESCRIPTION_MAX_LENGTH, message: '描述信息限制，不能超过30个字' }],
    url: [
        { required: true, message: '请填写链接地址' },
        {
            validator: function(rule, value, callback) {
                if (!value) return callback(new Error('请填写链接地址'));
                if (!/(http|https):\/\/([\w.]+\/?)\S*/ig.test(value)) return new Error(rule.message);
                callback();
            },
            message: '链接格式不对，请重新输入'
        }
    ],
    cover: [{ required: true, message: '请选择封面图片' }]
};

/**
 * @typedef FormConent
 * @property {string} title 标题
 * @property {string} description 描述
 * @property {string} url 链接地址
 * @property {string} cover 图片地址
 */

/**
 * 默认内部状态
 */
function getDefaultData() {
    return {
        form: {
            title: '',
            description: '',
            url: '',
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
    name: 'AddWebPagePopup',
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
        descriptionMaxLenght: function() {
            return DESCRIPTION_MAX_LENGTH;
        },
        uploadFileApi: function() {
            return window['__API'].uploadFile;
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

<style src="./css/components/AddWebPagePopup.css" scoped />
