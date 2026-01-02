(function () {
    // Apply theme immediately to prevent flash
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);

    document.addEventListener('DOMContentLoaded', function () {
        const toggle = document.getElementById('theme-toggle-nav');
        const iconDark = document.getElementById('nav-icon-dark');
        const iconLight = document.getElementById('nav-icon-light');

        // Set initial icon state
        updateIcons(savedTheme);

        if (toggle) {
            toggle.addEventListener('click', function () {
                const current = localStorage.getItem('theme') || 'dark';
                const next = current === 'dark' ? 'light' : 'dark';

                // Update theme attribute (CSS handles all styling)
                document.documentElement.setAttribute('data-bs-theme', next);
                localStorage.setItem('theme', next);
                updateIcons(next);
            });
        }

        function updateIcons(theme) {
            if (theme === 'dark') {
                if (iconDark) iconDark.style.display = 'inline';
                if (iconLight) iconLight.style.display = 'none';
            } else {
                if (iconDark) iconDark.style.display = 'none';
                if (iconLight) iconLight.style.display = 'inline';
            }
        }
    });
})();
