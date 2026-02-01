<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="description" content="Professional invoice management system with AI-powered extraction and myDATA integration">
        <meta name="theme-color" content="#2563eb">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Invaice">

        <title inertia>{{ config('app.name', 'Invaice') }}</title>

        <!-- Manifest for PWA -->
        <link rel="manifest" href="{{ asset('manifest.json') }}">
        
        <!-- Apple Icons -->
        <link rel="apple-touch-icon" href="{{ asset('images/logo/pwa-icons/apple-icon-180x180.png') }}">
        <link rel="icon" type="image/png" href="{{ asset('images/logo/pwa-icons/favicon-32x32.png') }}">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
        
        <!-- PWA Service Worker Registration -->
        <script>
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('{{ asset('service-worker.js') }}').catch(() => {});
            }
        </script>
    </body>
</html>
