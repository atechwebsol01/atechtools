<?php
// api/online.php - Tracks and returns the number of online users (creators)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$sessionFile = sys_get_temp_dir() . '/atechtools_online_users.json';
$timeout = 300; // 5 minutes
$now = time();
$ip = $_SERVER['REMOTE_ADDR'];

// Read current sessions
$sessions = [];
if (file_exists($sessionFile)) {
    $sessions = json_decode(file_get_contents($sessionFile), true) ?: [];
}

// Remove expired sessions
foreach ($sessions as $key => $lastSeen) {
    if ($now - $lastSeen > $timeout) {
        unset($sessions[$key]);
    }
}

// Update this user's session
$sessions[$ip] = $now;

// Save sessions
file_put_contents($sessionFile, json_encode($sessions));

// Return count
$response = [
    'success' => true,
    'online' => count($sessions)
];
echo json_encode($response);
