<template>
    <form
        @submit.prevent="onFormSubmitHandler"
        class="search-bar"
    >
        <input
            v-model="searchText"
            ref="searchInput"
            :placeholder="placeholder"
            type="text"
            class="input"
            @change="$emit('change', $event)"
        />
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
        placeholder: '',
        value: ''
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
        }
    }
};
</script>

<style src="../css/components/SearchBar.css" scoped>
