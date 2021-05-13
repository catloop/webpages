(function() {
    function setRem() {
        document.documentElement.style.fontSize = document.documentElement.clientWidth / 3.75 + 'px';
    }
    window.addEventListener('resize', setRem);
    setRem();
})();
