// app/api-docs/page.tsx
export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Sify Gist API 文档</h1>

        <div className="prose max-w-none">
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">简介</h2>
          <p>Sify Gist 提供了一个完整的 RESTful API，用于创建、读取、更新和删除代码片段（Gist）。</p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">认证</h2>
          <p>大多数 API 端点需要用户认证。认证通过 JWT 令牌实现，需要在请求头中包含 <code
            className="bg-gray-100 px-1 rounded">Authorization: Bearer `token`</code>。</p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">API 端点</h2>

          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">获取所有 Gists</h3>
            <div className="mb-2">
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">GET</span>
              <span className="ml-2 font-mono">/api/gists</span>
            </div>
            <div className="text-gray-600">
              <p className="mb-2"><strong>描述:</strong> 获取所有公共 Gists，按创建时间倒序排列。</p>
              <p className="mb-2"><strong>参数:</strong></p>
              <ul className="list-disc pl-5 mb-2">
                <li><code>limit</code> (可选): 限制返回结果数量，默认为 50</li>
                <li><code>offset</code> (可选): 偏移量，默认为 0</li>
              </ul>
              <p><strong>响应示例:</strong></p>
              <pre className="bg-gray-50 p-3 rounded mt-2 overflow-x-auto text-sm">
{`[
  {
    "id": "abc123",
    "title": "Hello World 示例",
    "description": "一个简单的 Hello World 程序",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z",
    "files": [
      {
        "filename": "hello.js",
        "content": "console.log('Hello World');",
        "language": "javascript"
      }
    ]
  }
]`}
              </pre>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">获取特定 Gist</h3>
            <div className="mb-2">
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono">GET</span>
              <span className="ml-2 font-mono">/api/gists/{`{id}`}</span>
            </div>
            <div className="text-gray-600">
              <p className="mb-2"><strong>描述:</strong> 获取指定 ID 的 Gist 信息。</p>
              <p><strong>参数:</strong></p>
              <ul className="list-disc pl-5 mb-2">
                <li><code>id</code> (必需): Gist 的唯一标识符</li>
              </ul>
              <p><strong>响应示例:</strong></p>
              <pre className="bg-gray-50 p-3 rounded mt-2 overflow-x-auto text-sm">
{`{
  "id": "abc123",
  "title": "Hello World 示例",
  "description": "一个简单的 Hello World 程序",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "files": [
    {
      "filename": "hello.js",
      "content": "console.log('Hello World');",
      "language": "javascript"
    }
  ]
}`}
              </pre>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">创建新 Gist</h3>
            <div className="mb-2">
              <span
                className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-mono">POST</span>
              <span className="ml-2 font-mono">/api/gists</span>
            </div>
            <div className="text-gray-600">
              <p className="mb-2"><strong>描述:</strong> 创建一个新的 Gist。</p>
              <p><strong>请求体:</strong></p>
              <pre className="bg-gray-50 p-3 rounded mt-2 overflow-x-auto text-sm">
{`{
  "title": "My New Gist",
  "description": "A description for my gist",
  "files": [
    {
      "filename": "example.js",
      "content": "console.log('Hello');",
      "language": "javascript"
    }
  ]
}`}
              </pre>
              <p className="mt-2"><strong>响应示例:</strong></p>
              <pre className="bg-gray-50 p-3 rounded mt-2 overflow-x-auto text-sm">
{`{
  "id": "newId123",
  "title": "My New Gist",
  "description": "A description for my gist",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "files": [
    {
      "filename": "example.js",
      "content": "console.log('Hello');",
      "language": "javascript"
    }
  ]
}`}
              </pre>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">获取 Gist 版本历史</h3>
            <div className="mb-2">
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">GET</span>
              <span className="ml-2 font-mono">/api/gists/{`{id}`}/versions</span>
            </div>
            <div className="text-gray-600">
              <p className="mb-2"><strong>描述:</strong> 获取指定 Gist 的所有版本历史。</p>
              <p><strong>参数:</strong></p>
              <ul className="list-disc pl-5 mb-2">
                <li><code>id</code> (必需): Gist 的唯一标识符</li>
              </ul>
              <p><strong>响应示例:</strong></p>
              <pre className="bg-gray-50 p-3 rounded mt-2 overflow-x-auto text-sm">
{`[
  {
    "id": 1,
    "gist_id": "abc123",
    "version_number": 1,
    "created_at": "2023-01-01T00:00:00Z",
    "files": [
      {
        "filename": "hello.js",
        "content": "console.log('Hello World');",
        "language": "javascript"
      }
    ]
  }
]`}
              </pre>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">获取 Gist 原始文件</h3>
            <div className="mb-2">
              <span
                className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-mono">GET</span>
              <span className="ml-2 font-mono">/api/gists/{`{id}`}/raw/{`{filename}`}</span>
            </div>
            <div className="text-gray-600">
              <p className="mb-2"><strong>描述:</strong> 获取指定 Gist 中特定文件的原始内容。</p>
              <p><strong>参数:</strong></p>
              <ul className="list-disc pl-5 mb-2">
                <li><code>id</code> (必需): Gist 的唯一标识符</li>
                <li><code>filename</code> (必需): 文件名</li>
              </ul>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">导出 Gist 为 ZIP</h3>
            <div className="mb-2">
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono">GET</span>
              <span className="ml-2 font-mono">/api/gists/{`{id}`}/export</span>
            </div>
            <div className="text-gray-600">
              <p className="mb-2"><strong>描述:</strong> 将指定 Gist 的所有文件打包为 ZIP 文件下载。</p>
              <p><strong>参数:</strong></p>
              <ul className="list-disc pl-5 mb-2">
                <li><code>id</code> (必需): Gist 的唯一标识符</li>
              </ul>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">错误处理</h2>
          <p>API 使用标准 HTTP 状态码来表示请求结果：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><code>200 OK</code> - 请求成功</li>
            <li><code>201 Created</code> - 资源创建成功</li>
            <li><code>400 Bad Request</code> - 请求格式错误或参数缺失</li>
            <li><code>401 Unauthorized</code> - 未提供有效认证信息</li>
            <li><code>404 Not Found</code> - 请求的资源不存在</li>
            <li><code>500 Internal Server Error</code> - 服务器内部错误</li>
          </ul>
        </div>
      </div>
    </div>
  );
}