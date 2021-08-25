<template>
    <form
        @submit.prevent="onFormSubmitHandler"
        class="search-bar"
    >
        <div class="input-container">
            <input
                v-model="searchText"
                ref="searchInput"
                :placeholder="placeholder"
                type="text"
                class="input"
                @change="$emit('change', $event)"
            />

            <button
                v-if="clearable && searchText"
                @click.prevent="onClearBtnClickHandler"
                type="button"
                class="clear-btn"
            ></button>
        </div>

        <button
            type="submit"
            class="search-btn btn btn-primary btn-middle btn-rounded"
        >搜索</button>
    </form>
</template>

<script>
module.exports = {
    name: 'SearchBar',
    props: {
        placeholder: {
            type: String,
            default: ''
        },
        value: {
            type: String,
            default: ''
        },
        clearable: {
            type: Boolean,
            default: true
        },
        submitOnClear: {
            type: Boolean,
            default: false
        }
    },
    watch: {
        value: function(value) {
            this.searchText = value;
        }
    },
    data: function() {
        return {
            searchText: ''
        };
    },
    methods: {
        onFormSubmitHandler: function() {
            this.$refs.searchInput.blur();
            this.$emit('search', this.searchText);
        },
        onClearBtnClickHandler: function() {
            var _this = this;
            this.searchText = '';
            this.$refs.searchInput.blur();
            setTimeout(function() {
                _this.$emit('clear');
                this.submitOnClear && this.onFormSubmitHandler();
            });
        }
    }
};
</script>

<style src="./css/components/SearchBar.css" scoped>
