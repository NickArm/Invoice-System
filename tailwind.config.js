import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f8ff',
                    100: '#e0f0ff',
                    200: '#bae1ff',
                    300: '#7cc5ff',
                    400: '#36aaff',
                    500: '#0b84f3',
                    600: '#013d73',
                    700: '#012d57',
                    800: '#011d3b',
                    900: '#000d1f',
                },
            },
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [forms],
};
