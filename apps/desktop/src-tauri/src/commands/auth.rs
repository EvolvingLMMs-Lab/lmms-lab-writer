use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthTokens {
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct AuthServerInfo {
    pub port: u16,
    pub callback_url: String,
}

/// State for the auth callback server
pub struct AuthServerState {
    pub running: AtomicBool,
    pub port: std::sync::Mutex<Option<u16>>,
}

impl Default for AuthServerState {
    fn default() -> Self {
        Self {
            running: AtomicBool::new(false),
            port: std::sync::Mutex::new(None),
        }
    }
}

/// Find an available port
fn find_available_port() -> Option<u16> {
    // Try ports in range 49152-65535 (dynamic/private ports)
    for port in 49152..65535 {
        if TcpListener::bind(("127.0.0.1", port)).is_ok() {
            return Some(port);
        }
    }
    None
}

/// Parse query string into HashMap
fn parse_query_string(query: &str) -> HashMap<String, String> {
    let mut params = HashMap::new();
    for pair in query.split('&') {
        let mut parts = pair.splitn(2, '=');
        if let (Some(key), Some(value)) = (parts.next(), parts.next()) {
            let decoded_value = urlencoding::decode(value).unwrap_or_else(|_| value.into());
            params.insert(key.to_string(), decoded_value.into_owned());
        }
    }
    params
}

/// Handle a single HTTP request
fn handle_connection(mut stream: TcpStream, app_handle: &AppHandle) -> bool {
    let mut reader = BufReader::new(&stream);
    let mut request_line = String::new();

    if reader.read_line(&mut request_line).is_err() {
        return false;
    }

    // Parse the request line: GET /callback?tokens=... HTTP/1.1
    let parts: Vec<&str> = request_line.split_whitespace().collect();
    if parts.len() < 2 {
        return false;
    }

    let path = parts[1];

    // Check if this is a callback request
    if !path.starts_with("/callback") {
        // Send 404 for non-callback requests
        let response = "HTTP/1.1 404 Not Found\r\nContent-Type: text/html\r\n\r\n<html><body><h1>404 Not Found</h1></body></html>";
        let _ = stream.write_all(response.as_bytes());
        return false;
    }

    // Parse query parameters
    let query_start = path.find('?').map(|i| i + 1).unwrap_or(path.len());
    let query = &path[query_start..];
    let params = parse_query_string(query);

    // Check for error
    if let Some(error) = params.get("error") {
        let error_desc = params.get("error_description").cloned().unwrap_or_else(|| error.clone());

        // Emit error event
        let _ = app_handle.emit("auth-callback-error", error_desc.clone());

        // Send error response
        let html = format!(
            r#"<!DOCTYPE html>
<html>
<head>
    <title>Login Failed</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafafa; }}
        .container {{ text-align: center; padding: 2rem; }}
        .icon {{ font-size: 3rem; margin-bottom: 1rem; }}
        h1 {{ font-size: 1.5rem; margin-bottom: 0.5rem; }}
        p {{ color: #666; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">❌</div>
        <h1>Login Failed</h1>
        <p>{}</p>
        <p>You can close this window.</p>
    </div>
</body>
</html>"#,
            error_desc
        );
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\n\r\n{}",
            html.len(),
            html
        );
        let _ = stream.write_all(response.as_bytes());
        return true; // Signal to stop server
    }

    // Get tokens from query params
    let access_token = params.get("access_token").cloned();
    let refresh_token = params.get("refresh_token").cloned();

    if let (Some(access_token), Some(refresh_token)) = (access_token, refresh_token) {
        // Emit success event with tokens
        let tokens = AuthTokens {
            access_token,
            refresh_token,
        };
        let _ = app_handle.emit("auth-callback-success", tokens);

        // Send success response
        let html = r#"<!DOCTYPE html>
<html>
<head>
    <title>Login Successful</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafafa; }
        .container { text-align: center; padding: 2rem; }
        .icon { font-size: 3rem; margin-bottom: 1rem; }
        h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        p { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">✅</div>
        <h1>Login Successful!</h1>
        <p>You can close this window and return to the app.</p>
        <script>setTimeout(() => window.close(), 2000);</script>
    </div>
</body>
</html>"#;
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\n\r\n{}",
            html.len(),
            html
        );
        let _ = stream.write_all(response.as_bytes());
        return true; // Signal to stop server
    }

    // Missing tokens
    let html = r#"<!DOCTYPE html>
<html>
<head>
    <title>Login Error</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafafa; }
        .container { text-align: center; padding: 2rem; }
        .icon { font-size: 3rem; margin-bottom: 1rem; }
        h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        p { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">⚠️</div>
        <h1>Missing Tokens</h1>
        <p>Authentication tokens were not received. Please try again.</p>
    </div>
</body>
</html>"#;
    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\n\r\n{}",
        html.len(),
        html
    );
    let _ = stream.write_all(response.as_bytes());
    false
}

/// Start the local auth callback server
#[tauri::command]
pub async fn auth_start_server(app_handle: AppHandle) -> Result<AuthServerInfo, String> {
    let state = app_handle.state::<AuthServerState>();

    // Check if already running
    if state.running.load(Ordering::SeqCst) {
        if let Some(port) = *state.port.lock().unwrap() {
            return Ok(AuthServerInfo {
                port,
                callback_url: format!("http://localhost:{}/callback", port),
            });
        }
    }

    // Find available port
    let port = find_available_port().ok_or("No available port found")?;

    // Create listener
    let listener = TcpListener::bind(("127.0.0.1", port))
        .map_err(|e| format!("Failed to bind to port {}: {}", port, e))?;

    // Set non-blocking for timeout support
    listener.set_nonblocking(true)
        .map_err(|e| format!("Failed to set non-blocking: {}", e))?;

    // Update state
    state.running.store(true, Ordering::SeqCst);
    *state.port.lock().unwrap() = Some(port);

    let running = Arc::new(AtomicBool::new(true));
    let running_clone = running.clone();
    let app_handle_clone = app_handle.clone();

    // Spawn server in background
    std::thread::spawn(move || {
        let timeout = std::time::Duration::from_millis(100);

        while running_clone.load(Ordering::SeqCst) {
            match listener.accept() {
                Ok((stream, _)) => {
                    // Handle the connection
                    let should_stop = handle_connection(stream, &app_handle_clone);
                    if should_stop {
                        running_clone.store(false, Ordering::SeqCst);
                        break;
                    }
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    // No connection yet, sleep briefly
                    std::thread::sleep(timeout);
                }
                Err(e) => {
                    eprintln!("Error accepting connection: {}", e);
                    break;
                }
            }
        }

        // Clean up state
        if let Some(state) = app_handle_clone.try_state::<AuthServerState>() {
            state.running.store(false, Ordering::SeqCst);
            *state.port.lock().unwrap() = None;
        }
    });

    // Set a timeout to auto-stop the server after 5 minutes
    let app_handle_timeout = app_handle.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_secs(300));
        if let Some(state) = app_handle_timeout.try_state::<AuthServerState>() {
            if state.running.load(Ordering::SeqCst) {
                state.running.store(false, Ordering::SeqCst);
                *state.port.lock().unwrap() = None;
            }
        }
    });

    Ok(AuthServerInfo {
        port,
        callback_url: format!("http://localhost:{}/callback", port),
    })
}

/// Stop the local auth callback server
#[tauri::command]
pub async fn auth_stop_server(app_handle: AppHandle) -> Result<(), String> {
    let state = app_handle.state::<AuthServerState>();
    state.running.store(false, Ordering::SeqCst);
    *state.port.lock().unwrap() = None;
    Ok(())
}

/// Check if the auth server is running
#[tauri::command]
pub async fn auth_server_status(app_handle: AppHandle) -> Result<Option<AuthServerInfo>, String> {
    let state = app_handle.state::<AuthServerState>();

    if state.running.load(Ordering::SeqCst) {
        if let Some(port) = *state.port.lock().unwrap() {
            return Ok(Some(AuthServerInfo {
                port,
                callback_url: format!("http://localhost:{}/callback", port),
            }));
        }
    }

    Ok(None)
}
