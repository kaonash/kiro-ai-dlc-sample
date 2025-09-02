import { serve } from "bun";

const server = serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = url.pathname;
    
    // ルートパスの場合はindex.htmlを返す
    if (filePath === '/') {
      filePath = '/index.html';
    }

    try {
      const file = Bun.file(`.${filePath}`);
      
      // ファイルが存在するかチェック
      if (await file.exists()) {
        return new Response(file);
      } else {
        return new Response('File not found', { status: 404 });
      }
    } catch (error) {
      console.error('Error serving file:', error);
      return new Response('Internal server error', { status: 500 });
    }
  },
});

console.log(`🚀 Tower Defense Game server running at http://localhost:${server.port}`);
console.log('📁 Serving files from current directory');
console.log('🎮 Open http://localhost:3000 in your browser to play!');