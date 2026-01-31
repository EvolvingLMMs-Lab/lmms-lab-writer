use serde::Serialize;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpListener;
use tokio::sync::Mutex;

/// State for the auth callback server
#[derive(Default)]
pub struct AuthCallbackState {
    pub shutdown_tx: Option<tokio::sync::oneshot::Sender<()>>,
    pub port: Option<u16>,
}

pub type AuthCallbackStateWrapper = Arc<Mutex<AuthCallbackState>>;

#[derive(Clone, Serialize)]
struct AuthCodePayload {
    code: String,
}

/// Parse the login code from an HTTP request body
fn parse_login_code_from_body(body: &str) -> Option<String> {
    // Try to parse as JSON first
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(body) {
        if let Some(code) = json.get("code").and_then(|v| v.as_str()) {
            return Some(code.to_string());
        }
    }

    // Fallback: try URL-encoded form data
    for pair in body.split('&') {
        let mut parts = pair.splitn(2, '=');
        if let (Some(key), Some(value)) = (parts.next(), parts.next()) {
            if key == "code" {
                // URL decode the value
                if let Ok(decoded) = urlencoding::decode(value) {
                    return Some(decoded.into_owned());
                }
                return Some(value.to_string());
            }
        }
    }

    None
}

/// Start the auth callback server
#[tauri::command]
pub async fn start_auth_callback_server(
    app: AppHandle,
    state: State<'_, AuthCallbackStateWrapper>,
) -> Result<u16, String> {
    let mut state_guard = state.lock().await;

    // If already running, return the existing port
    if let Some(port) = state_guard.port {
        return Ok(port);
    }

    // Try to bind to a port in the range 18700-18799
    let listener = {
        let mut last_error = None;
        let mut bound_listener = None;

        for port in 18700..18800 {
            match TcpListener::bind(format!("127.0.0.1:{}", port)).await {
                Ok(l) => {
                    bound_listener = Some(l);
                    break;
                }
                Err(e) => {
                    last_error = Some(e);
                }
            }
        }

        bound_listener.ok_or_else(|| {
            format!(
                "Failed to bind to any port in range 18700-18799: {:?}",
                last_error
            )
        })?
    };

    let port = listener.local_addr().map_err(|e| e.to_string())?.port();

    let (shutdown_tx, mut shutdown_rx) = tokio::sync::oneshot::channel::<()>();

    state_guard.shutdown_tx = Some(shutdown_tx);
    state_guard.port = Some(port);
    drop(state_guard);

    let app_handle = app.clone();

    // Spawn the server task
    tokio::spawn(async move {
        loop {
            tokio::select! {
                _ = &mut shutdown_rx => {
                    break;
                }
                result = listener.accept() => {
                    match result {
                        Ok((mut stream, _)) => {
                            let app_clone = app_handle.clone();
                            tokio::spawn(async move {
                                let (reader, mut writer) = stream.split();
                                let mut buf_reader = BufReader::new(reader);
                                let mut request_line = String::new();
                                let mut headers = Vec::new();
                                let mut content_length: usize = 0;

                                // Read request line
                                if buf_reader.read_line(&mut request_line).await.is_err() {
                                    return;
                                }

                                // Read headers
                                loop {
                                    let mut header_line = String::new();
                                    if buf_reader.read_line(&mut header_line).await.is_err() {
                                        return;
                                    }
                                    if header_line.trim().is_empty() {
                                        break;
                                    }
                                    let header_lower = header_line.to_lowercase();
                                    if header_lower.starts_with("content-length:") {
                                        if let Some(len_str) = header_lower.strip_prefix("content-length:") {
                                            content_length = len_str.trim().parse().unwrap_or(0);
                                        }
                                    }
                                    headers.push(header_line);
                                }

                                // Check if it's a POST to /callback or OPTIONS (CORS preflight)
                                let is_options = request_line.starts_with("OPTIONS");
                                let is_post_callback = request_line.starts_with("POST /callback") || request_line.starts_with("POST /");

                                // CORS headers
                                let cors_headers = "Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\n";

                                if is_options {
                                    // Handle CORS preflight
                                    let response = format!(
                                        "HTTP/1.1 204 No Content\r\n{}Content-Length: 0\r\n\r\n",
                                        cors_headers
                                    );
                                    let _ = writer.write_all(response.as_bytes()).await;
                                    return;
                                }

                                if is_post_callback && content_length > 0 {
                                    // Read body
                                    let mut body = vec![0u8; content_length];
                                    if buf_reader.read_exact(&mut body).await.is_err() {
                                        let response = format!(
                                            "HTTP/1.1 400 Bad Request\r\n{}Content-Type: text/plain\r\nContent-Length: 16\r\n\r\nFailed to read body",
                                            cors_headers
                                        );
                                        let _ = writer.write_all(response.as_bytes()).await;
                                        return;
                                    }

                                    let body_str = String::from_utf8_lossy(&body);

                                    if let Some(code) = parse_login_code_from_body(&body_str) {
                                        // Emit event to frontend
                                        let _ = app_clone.emit("auth-code-received", AuthCodePayload { code });

                                        let response = format!(
                                            "HTTP/1.1 200 OK\r\n{}Content-Type: application/json\r\nContent-Length: 16\r\n\r\n{{\"success\":true}}",
                                            cors_headers
                                        );
                                        let _ = writer.write_all(response.as_bytes()).await;
                                    } else {
                                        let response = format!(
                                            "HTTP/1.1 400 Bad Request\r\n{}Content-Type: text/plain\r\nContent-Length: 20\r\n\r\nMissing code in body",
                                            cors_headers
                                        );
                                        let _ = writer.write_all(response.as_bytes()).await;
                                    }
                                } else {
                                    let response = format!(
                                        "HTTP/1.1 404 Not Found\r\n{}Content-Length: 9\r\n\r\nNot Found",
                                        cors_headers
                                    );
                                    let _ = writer.write_all(response.as_bytes()).await;
                                }
                            });
                        }
                        Err(_) => {
                            break;
                        }
                    }
                }
            }
        }
    });

    Ok(port)
}

/// Stop the auth callback server
#[tauri::command]
pub async fn stop_auth_callback_server(
    state: State<'_, AuthCallbackStateWrapper>,
) -> Result<(), String> {
    let mut state_guard = state.lock().await;

    if let Some(tx) = state_guard.shutdown_tx.take() {
        let _ = tx.send(());
    }
    state_guard.port = None;

    Ok(())
}

/// Get the current auth callback server port (if running)
#[tauri::command]
pub async fn get_auth_callback_port(
    state: State<'_, AuthCallbackStateWrapper>,
) -> Result<Option<u16>, String> {
    let state_guard = state.lock().await;
    Ok(state_guard.port)
}
