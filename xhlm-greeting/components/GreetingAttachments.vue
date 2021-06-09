<template>
    <div class="greeting-attachments">
        <ul class="attachment-list">
            <li
                v-for="(attachment, index) in value"
                :key="index"
                class="li attachment-item"
            >
                <attachment
                    :value="attachment"
                    removable
                    @remove="onAttachmentRemoveHandler(index)"
                ></attachment>
            </li>

            <li
                v-if="allowAdd"
                @click="onAddBtnClickHandler"
                class="li attachment-item"
            >
                <button class="add-btn">选择素材</button>
            </li>
        </ul>

        <p class="tip">（最多上传9个附件，支持图片、网页、小程序；）</p>

        <van-action-sheet
            v-if="actionSheetExsist"
            v-model="showActionSheet"
            :actions="actions"
            @select="onActionSheetSelectHandler"
            @closed="onActionSheetClosedHandler"
            cancel-text="取消"
            close-on-click-action
            class="add-action-sheet"
        ></van-action-sheet>

        <content-library-popup
            :show="showContentLibraryPopup"
            @select="onContentLibraryPopupConfirmHandler"
            @close="showContentLibraryPopup = false"
        >
        </content-library-popup>

        <add-web-page-popup
            :show="showAddWebPagePopup"
            @confirm="onAddWebPagePopupConfirmHandler"
            @close="showAddWebPagePopup = false"
        ></add-web-page-popup>

        <add-mini-program-popup
            :show="showAddMiniProgramPopup"
            @confirm="onAddMiniProgramPopupConfirmHandler"
            @close="showAddMiniProgramPopup = false"
        ></add-mini-program-popup>
    </div>
</template>

<script>
/**
 * @typedef Attachment
 * @property {'image' | 'anchor' | 'mini-program' ｜ 'service'} type
 * @property {string} cover
*/

/**
 * @typedef WebPage 网页链接
 * @property {string} title 链接标题
 * @property {string} description 链接描述
 * @property {string} url 链接地址
 * @property {string} cover 链接封面图片
 */

/**
 * @typedef MiniProgram 小程序
 * @property {string} title 小程序标题
 * @property {string} appId 小程序 AppId
 * @property {string} path 小程序内部路径
 * @property {string} cover 小程序封面图片
 */

var MAX_ATTACHMENT_COUNT = 9;

module.exports = {
    components: {
        Attachment: httpVueLoader('./Attachment.vue'),
        AddWebPagePopup: httpVueLoader('./AddWebPagePopup.vue'),
        AddMiniProgramPopup: httpVueLoader('./AddMiniProgramPopup.vue'),
        ContentLibraryPopup: httpVueLoader('./ContentLibraryPopup.vue')
    },
    props: {
        value: {
            type: Array,
            required: true
        }
    },
    computed: {
        /**
         * 是否允许添加
         * @returns {boolean}
         */
        allowAdd: function() {
            return this.value.length < MAX_ATTACHMENT_COUNT;
        }
    },
    data: function() {
        return {
            showActionSheet: false,
            actionSheetExsist: false,
            actions: [{
                name: '拍照',
                type: 'CAMERA'
            }, {
                name: '从相册选择',
                type: 'ALBUM'
            }, {
                name: '从内容库选择',
                type: 'LIBRARY'
            }, {
                name: '智能客服',
                type: 'SERVICE',
                disabled: true
            }, {
                name: '手动添加网页',
                type: 'WEB_PAGE'
            }, {
                name: '手动添加小程序',
                type: 'MINI_PROGRAM'
            }],
            showAddWebPagePopup: false,
            showAddMiniProgramPopup: false,
            showContentLibraryPopup: false
        };
    },
    methods: {
        /**
         * 点击素材上的移除按钮
         * @param {number} index 下标
         * @return {void}
         */
        onAttachmentRemoveHandler: function(index) {
            this.$emit('change', this.value.filter(function(a, i) {
                return i !== index;
            }));
        },
        /**
         * 点击添加素材按钮
         * @returns {void}
         */
        onAddBtnClickHandler: function() {
            var _this = this;
            this.actionSheetExsist = true;
            this.$nextTick(function() {
                _this.showActionSheet = true;
            });
        },
        /**
         * 弹层关闭之后，移除弹层的 dom 节点
         * @returns {void}
         */
        onActionSheetClosedHandler: function() {
            var _this = this;
            this.$nextTick(function() {
                _this.actionSheetExsist = false;
            });
        },
        /**
         * ActionSheet 选择操作的行为
         * @param action 操作对象
         * @param {string} action.name 操作显示名称
         * @param {string} action.type 操作类型
         * @return {void}
         */
        onActionSheetSelectHandler: function(action) {
            switch (action.type) {
                // 拍照选择
                case 'CAMERA':
                // 相册选择
                case 'ALBUM':
                    this.selectFromMedia(action.type);
                    break;
                // 从内容库选择
                case 'LIBRARY':
                    this.showContentLibraryPopup = true;
                    break;
                // 智能客服
                case 'SERVICE':
                    console.log('智能客服');
                    break;
                // 添加网页
                case 'WEB_PAGE':
                    this.showAddWebPagePopup = true;
                    break;
                // 添加小程序
                case 'MINI_PROGRAM':
                    this.showAddMiniProgramPopup = true;
                    break;
                default:
                    return;
            }
        },
        /**
         * 选择图片（拍照、相册）
         * @param {'CAMERA' | 'ALBUM'} type 选择的类型
         * @returns {Promise<string>} 含有 url 的 promise
         */
        selectFromMedia: function(type) {
            var _this = this;
            return new Promise(function(resolve, reject) {
                // 微信方法
                if ('wx' in window && wx.chooseImage) {
                    return wx.chooseImage({
                        count: 1,
                        sizeType: ['original', 'compressed'],
                        sourceType: [({
                            'CAMERA': 'camera',
                            'ALBUM': 'album'
                        })[type]],
                        success: function(res) {
                            if (res.errMsg !== 'chooseImage:ok' || !res.localIds || !res.localIds.length) return reject();
                            // 返回微信本地链接，如需上传，可以在此发网络请求进一步处理
                            resolve(res.localIds[0]);
                        }
                    });
                }
                // 浏览器方法
                var input = document.createElement('input');
                input.type = 'file';
                switch (type) {
                    case 'CAMERA':
                        input.accept = 'image/png, image/jpg';
                        input.capture = 'camera';
                        break;
                    case 'ALBUM':
                        input.accept = 'image/*';
                        break;
                    default:
                        return;
                }
                input.onchange = function() {
                    if (!input.files || !input.files.length) return reject();
                    // 构造 blob url 返回，如需上传，可以在此发网络请求进一步处理
                    resolve(window.URL.createObjectURL(input.files[0]));
                };
                input.click();
            }).then(function(url) {
                _this.addAttachment({
                    type: 'image',
                    cover: url
                });
            });
        },
        /**
         * 添加网页链接弹层确认
         * @param {WebPage} webPage
         * @returns {void}
         */
        onAddWebPagePopupConfirmHandler: function(webPage) {
            this.addAttachment(Object.assign(webPage, {
                type: 'anchor'
            }));
            this.showAddWebPagePopup = false;
        },
        /**
         * 添加小程序弹层确认
         * @param {MiniProgram} miniProgram
         * @returns {void}
         */
        onAddMiniProgramPopupConfirmHandler: function(miniProgram) {
            this.addAttachment(Object.assign(miniProgram, {
                type: 'mini-program'
            }));
            this.showAddMiniProgramPopup = false;
        },
        /**
         * 选择内容库弹层确认
         * @param {Attachment} attachment 素材
         * @returns {void}
         */
        onContentLibraryPopupConfirmHandler: function(attachment) {
            this.addAttachment(attachment);
            this.showContentLibraryPopup = false;
        },
        /**
         * 添加素材
         * @param {Attachment} attachment 素材
         * @returns {void}
         */
        addAttachment: function(attachment) {
            this.$emit('change', [].concat(this.value, [attachment]));
        }
    }
};
</script>

<style src="../css/components/GreetingAttachments.css" scoped />
