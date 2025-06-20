<?php
// api/tokens.php - API endpoint for storing and retrieving token information
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration
$db_host = getenv('DB_HOST');
$db_name = getenv('DB_NAME');
$db_user = getenv('DB_USER');
$db_pass = getenv('DB_PASS');

// Connect to MySQL
try {
    $mysqli = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($mysqli->connect_errno) {
        throw new Exception('Database connection failed: ' . $mysqli->connect_error);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

// Create tokens table if it doesn't exist
$createTableQuery = "
CREATE TABLE IF NOT EXISTS tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mint_address VARCHAR(255) UNIQUE NOT NULL,
    creator_wallet VARCHAR(255) NOT NULL,
    plan ENUM('basic', 'advanced', 'enterprise') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_creator (creator_wallet),
    INDEX idx_plan (plan),
    INDEX idx_created (created_at)
)";
$mysqli->query($createTableQuery);

// Handle POST: Add new token
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['mint_address'], $data['creator_wallet'], $data['plan'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }
    
    // Validate plan
    if (!in_array($data['plan'], ['basic', 'advanced', 'enterprise'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid plan']);
        exit;
    }
    
    // Insert token
    $stmt = $mysqli->prepare('INSERT INTO tokens (mint_address, creator_wallet, plan) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE plan = VALUES(plan)');
    $stmt->bind_param('sss', $data['mint_address'], $data['creator_wallet'], $data['plan']);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'id' => $stmt->insert_id ?: $mysqli->insert_id,
            'message' => 'Token stored successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to store token: ' . $stmt->error]);
    }
    $stmt->close();
    exit;
}

// Handle GET: List tokens
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $where = [];
    $params = [];
    $types = '';
    
    // Filter by creator wallet if provided
    if (isset($_GET['creator']) && !empty($_GET['creator'])) {
        $where[] = 'creator_wallet = ?';
        $params[] = $_GET['creator'];
        $types .= 's';
    }
    
    // Filter by plan if provided
    if (isset($_GET['plan']) && !empty($_GET['plan'])) {
        $where[] = 'plan = ?';
        $params[] = $_GET['plan'];
        $types .= 's';
    }
    
    // Build query
    $query = 'SELECT id, mint_address, creator_wallet, plan, created_at FROM tokens';
    if (!empty($where)) {
        $query .= ' WHERE ' . implode(' AND ', $where);
    }
    $query .= ' ORDER BY created_at DESC';
    
    // Add limit if provided
    if (isset($_GET['limit']) && is_numeric($_GET['limit'])) {
        $query .= ' LIMIT ' . intval($_GET['limit']);
    }
    
    // Execute query
    if (!empty($params)) {
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $mysqli->query($query);
    }
    
    // Fetch results
    $tokens = [];
    while ($row = $result->fetch_assoc()) {
        $tokens[] = $row;
    }
    
    // Add statistics
    $stats = [
        'total' => count($tokens),
        'by_plan' => []
    ];
    
    // Count by plan
    $planCounts = $mysqli->query("SELECT plan, COUNT(*) as count FROM tokens GROUP BY plan");
    while ($row = $planCounts->fetch_assoc()) {
        $stats['by_plan'][$row['plan']] = intval($row['count']);
    }
    
    echo json_encode([
        'success' => true,
        'tokens' => $tokens,
        'stats' => $stats
    ]);
    
    if (isset($stmt)) $stmt->close();
    exit;
}

// Method not allowed
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
$mysqli->close();
exit;
