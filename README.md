# 🚀 Postgirl

A secure and user-friendly REST client for Visual Studio Code.

## Features

- **Full HTTP Method Support**: GET, POST, PUT, PATCH, DELETE
- **Request Cancellation**: Cancel long-running or stuck requests with the cancel button
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
- **Variables System**: Create and manage variables for use across requests (e.g., `{{baseUrl}}`, `{{token}}`)
- **Session Export/Import**: Export your entire session (requests, variables, headers) to a binary file and import it later
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

**Cancelling Requests:**
- When a request is in progress, a **Cancel** button appears next to the Send button
- Click **Cancel** to immediately abort the request
- Useful for long-running requests, timeouts, or unresponsive endpoints

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

### Managing Variables

- Click **"Add Variable"** in the sidebar to create a new variable
- Enter a variable name (without `{{}}`) and its value
- Use variables in your URLs, headers, or body by wrapping them: `{{variableName}}`
- Variables support special characters in names (e.g., `{{api.key}}`, `{{base-url}}`)
- Variables are automatically replaced when making requests
- Example: `https://{{baseUrl}}/api/users?token={{authToken}}`
- Edit or delete variables from the sidebar

### Session Export and Import

**Export Session:**
- Click the cloud-download icon in the Postgirl sidebar
- Choose a location to save your session file (`.pgrl` format)
- The file contains all your saved requests, variables, and headers in a compact binary format

**Import Session:**
- Click the cloud-upload icon in the Postgirl sidebar
- Select a previously exported `.pgrl` file
- **Warning**: Importing will replace your current session data
- Confirm the import to restore all requests, variables, and headers

