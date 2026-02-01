<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;
use Parsedown;

class ChangelogController extends Controller
{
    /**
     * Display the changelog parsed from CHANGELOG.md
     */
    public function index()
    {
        $rootChangelogPath = base_path('..'.DIRECTORY_SEPARATOR.'CHANGELOG.md');
        $appChangelogPath = base_path('CHANGELOG.md');
        $changelogPath = File::exists($rootChangelogPath) ? $rootChangelogPath : $appChangelogPath;

        if (!File::exists($changelogPath)) {
            return Inertia::render('Changelog/Index', [
                'content' => '<p>Changelog not found.</p>',
                'latestVersion' => 'Unknown',
            ]);
        }

        $markdown = File::get($changelogPath);

        // Extract latest version from first ## [X.X.X] line
        preg_match('/##\s+\[(\d+\.\d+\.\d+)\]/', $markdown, $matches);
        $latestVersion = $matches[1] ?? 'Unknown';

        $parsedown = new Parsedown();

        // Split changelog into sections per version
        $pattern = '/^##\s+\[(\d+\.\d+\.\d+)\]\s+-\s+([0-9-]+)\s*$/m';
        $parts = preg_split($pattern, $markdown, -1, PREG_SPLIT_DELIM_CAPTURE);

        $introMarkdown = trim($parts[0] ?? '');
        $introHtml = $introMarkdown ? $parsedown->text($introMarkdown) : '';

        $sections = [];
        for ($i = 1; $i < count($parts); $i += 3) {
            $version = $parts[$i] ?? '';
            $date = $parts[$i + 1] ?? '';
            $bodyMarkdown = trim($parts[$i + 2] ?? '');
            $bodyHtml = $bodyMarkdown ? $parsedown->text($bodyMarkdown) : '';

            if ($version) {
                $sections[] = [
                    'version' => $version,
                    'date' => $date,
                    'html' => $bodyHtml,
                ];
            }
        }

        return Inertia::render('Changelog/Index', [
            'latestVersion' => $latestVersion,
            'introHtml' => $introHtml,
            'sections' => $sections,
        ]);
    }
}
