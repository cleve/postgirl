# 🚀 Postgirl

A secure and user-friendly REST client for Visual Studio Code.

## Features

- **Full HTTP Method Support**: GET, POST, PUT, PATCH, DELETE
- **Custom Headers**: Add, edit, and manage request headers with ease
- **Persistent Header Storage**: Save your frequently used headers for quick access
- **Request Storage**: Save complete requests (URL, method, headers, body) for later reuse
- **Request Body Editor**: Built-in JSON body editor for POST/PUT/PATCH requests
- **Response Viewer**: Detailed response information with tabbed interface
  - Response body with automatic JSON formatting
  - Response headers
  - Request information
  - Status codes with color coding
  - Response time and size metrics
- **Export Functionality**: Export request/response data to JSON files
- **Sidebar Integration**: Quick access from the VS Code Activity Bar

## Getting Started

1. Click the Postgirl icon (🌐) in the Activity Bar
2. Click **"New Request"** or use the command palette: `Postgirl: Open REST Client`
3. Enter your API URL
4. Select the HTTP method
5. Add headers if needed
6. Add request body for POST/PUT/PATCH requests
7. Click **Send**

## Usage

### Making Requests

Enter your API endpoint URL, select the HTTP method, and configure headers as needed. For POST, PUT, and PATCH requests, you can add a JSON request body.

### Managing Headers

- Click **"Add Header"** to add more headers
- Click **"Save Headers"** to persist your current headers
- Click **"Load Saved Headers"** to restore previously saved headers
- View saved headers in the sidebar under **"Saved Headers"**

### Saving and Loading Requests

- Click **"💾 Save Request"** to save the current request configuration
- Enter a name for your request when prompted
- Saved requests appear in the sidebar under **"Saved Requests"**
- Click on any saved request to load it into the editor
- Right-click (or click the trash icon) on a saved request to delete it

### Viewing Responses

Responses are displayed in a tabbed interface showing:
- Response body (automatically formatted JSON)
- Response headers
- Request details
- Status code, response time, and content size

### Exporting Results

Click **"Export Results"** to save the complete request and response data as a JSON file.

